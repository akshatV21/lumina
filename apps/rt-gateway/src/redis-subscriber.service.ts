import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common'
import { Redis } from 'ioredis'
import { RealtimeGateway } from './gateway.service'
import { ConfigService } from '@nestjs/config'
import { REALTIME_CHANNEL } from '@app/utils'

@Injectable()
export class RedisSubscriberService implements OnModuleInit, OnModuleDestroy {
  private subscriberClient: Redis
  private readonly logger = new Logger(RedisSubscriberService.name)

  constructor(
    private readonly config: ConfigService,
    private readonly gateway: RealtimeGateway,
  ) {}

  onModuleInit() {
    this.subscriberClient = new Redis(this.config.getOrThrow('REDIS_URL'))

    this.subscriberClient.subscribe(REALTIME_CHANNEL, (err, count) => {
      if (err) {
        this.logger.error(`Failed to subscribe to ${REALTIME_CHANNEL}: ${err.message}`)
        return
      }

      this.logger.log(`Subscribed to Redis channel: ${REALTIME_CHANNEL}`)
    })

    this.subscriberClient.on('message', (receivedChannel, message) => {
      if (receivedChannel === REALTIME_CHANNEL) {
        try {
          const payload = JSON.parse(message)
          if (!payload.userId || !payload.event) return

          this.gateway.server.to(`user_${payload.userId}`).emit(payload.event, payload.data)

          this.logger.debug(`Routed '${payload.event}' to user_${payload.userId}`)
        } catch (error) {
          this.logger.error(`Error parsing Redis message: ${error.message}`)
        }
      }
    })
  }

  onModuleDestroy() {
    this.subscriberClient.disconnect()
  }
}
