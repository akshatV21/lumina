import { DatabaseService } from '@app/database'
import { User } from '@app/utils'
import { CursorPaginationDto } from '@app/utils/pagination.dto'
import { Injectable } from '@nestjs/common'

@Injectable()
export class NotificationsService {
  constructor(private readonly db: DatabaseService) {}

  async list(pagination: CursorPaginationDto, user: User) {
    const limit = pagination.limit ?? 25

    const notifications = await this.db.notification.findMany({
      where: { userId: user.id },
      cursor: pagination.cursor ? { id: pagination.cursor } : undefined,
      take: limit + 1,
      orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
    })

    let cursor: string | null = null

    if (notifications.length > limit) {
      const next = notifications.pop()!
      cursor = next.id
    }

    const res: any = { notifications, cursor }
    if (!pagination.cursor) res.unread = await this.db.notification.count({ where: { userId: user.id, read: false } })

    return res
  }

  async read(user: User) {
    await this.db.notification.updateMany({
      where: { userId: user.id, read: false },
      data: { read: true },
    })
  }
}
