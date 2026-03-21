import { NotificationData, NOTIFICATIONS_QUEUE } from '@app/utils'
import { InjectQueue } from '@nestjs/bullmq'
import { Queue } from 'bullmq'
import { Injectable } from '@nestjs/common'
import { InjectRedis } from '@nestjs-modules/ioredis'
import Redis from 'ioredis'
import { NotificationType } from 'generated/prisma/enums'

@Injectable()
export class NotificationProducer {
  constructor(
    @InjectRedis() private readonly redis: Redis,
    @InjectQueue(NOTIFICATIONS_QUEUE) private readonly queue: Queue,
  ) {}

  async followed(data: NotificationData) {
    const key = `notification:follow:${data.entityId}:`
    const isNew = await this.redis.sadd(key, data.actorId)
    const size = await this.redis.scard(key)

    if (size === 1 && isNew) {
      await this.queue.add('notification-follow', {
        type: NotificationType.followed,
        entityId: data.entityId,
        userId: data.userId,
        key,
      })
    }
  }
}
