import { DatabaseService } from '@app/database'
import { NotificationQueueData, NOTIFICATIONS_QUEUE, REALTIME_CHANNEL } from '@app/utils'
import { InjectRedis } from '@nestjs-modules/ioredis'
import { Processor, WorkerHost } from '@nestjs/bullmq'
import { Job } from 'bullmq'
import Redis from 'ioredis'

@Processor(NOTIFICATIONS_QUEUE)
export class NotificationProcessor extends WorkerHost {
  private MAX_ACTORS = 10000

  constructor(
    private readonly db: DatabaseService,
    @InjectRedis() private readonly redis: Redis,
  ) {
    super()
  }

  async process(job: Job<NotificationQueueData, string>): Promise<any> {
    try {
      const { type, entityId, userId, key } = job.data

      const ids = await this.redis.spop(key, this.MAX_ACTORS)
      if (!ids || ids.length <= 0) return

      const actors = await this.db.user.findMany({
        where: { id: { in: ids } },
        select: { id: true, username: true, avatar: true },
        take: 2,
      })

      const existing = await this.db.notification.findUnique({
        where: { userId_type_entityId: { userId, type, entityId } },
      })

      let combined = actors
      let total = actors.length
      let metadata: any = null

      if (existing) {
        const existingActors = existing.actors as any[]
        const filtered = existingActors.filter(a => !ids.includes(a.id))

        combined = [...actors, ...filtered].slice(0, 2)
        total = existing.actorsCount + ids.length - (existingActors.length - filtered.length)

        metadata = existing.metadata
      } else if (type === 'like') {
        const post = await this.db.post.findUnique({
          where: { id: entityId },
          select: { media: { where: { order: 0 }, select: { url: true } } },
        })

        if (!post) return

        metadata = { thumb: post.media[0].url }
      }

      const notification = await this.db.notification.upsert({
        where: { userId_type_entityId: { userId, type, entityId } },
        update: { actors: combined, actorsCount: total, read: false, updatedAt: new Date() },
        create: { userId, type, entityId, actors: combined, actorsCount: total, metadata },
      })

      this.redis.publish(REALTIME_CHANNEL, JSON.stringify({ userId, event: 'notification', data: { notification } }))
    } catch (error) {
      console.log(error)
    }
  }
}
