import { NOTIFICATIONS_QUEUE } from '@app/utils'
import { InjectRedis } from '@nestjs-modules/ioredis'
import { Processor, WorkerHost } from '@nestjs/bullmq'
import { Job } from 'bullmq'
import Redis from 'ioredis'

@Processor(NOTIFICATIONS_QUEUE)
export class NotificationProcessor extends WorkerHost {
  constructor(@InjectRedis() private readonly redis: Redis) {
    super()
  }

  async process(job: Job<any, any, string>): Promise<any> {}
}
