import { DatabaseService } from '@app/database'
import { User } from '@app/utils'
import { Injectable } from '@nestjs/common'
import { JournalQueryDto } from './dtos/journal.dto'
import { CursorPaginationDto } from '@app/utils/pagination.dto'

@Injectable()
export class PostsService {
  constructor(private readonly db: DatabaseService) {}

  async journal(query: JournalQueryDto, user: User) {
    const limit = query.limit ?? 10
    const same = query.targetId === user.id

    const posts = await this.db.post.findMany({
      where: { userId: query.targetId, status: 'completed', hidden: same ? undefined : false },
      take: limit + 1,
      cursor: query.cursor ? { id: query.cursor } : undefined,
      orderBy: { createdAt: 'desc' },
      include: {
        media: {
          orderBy: { order: 'asc' },
          select: { id: true, url: true, type: true, width: true, height: true, blurhash: true },
        },
      },
    })

    let nextCursor: string | null = null

    if (posts.length > limit) {
      const next = posts.pop()!
      nextCursor = next.id
    }

    return { posts, cursor: nextCursor }
  }

  async feed(pagination: CursorPaginationDto, user: User) {
    const limit = pagination.limit ?? 10

    const followings = await this.db.follow.findMany({
      where: { followerId: user.id, status: 'accepted' },
      select: { followingId: true },
    })

    const ids = followings.map(f => f.followingId)
    ids.push(user.id)

    const posts = await this.db.post.findMany({
      where: { userId: { in: ids }, status: 'completed', hidden: false },
      cursor: pagination.cursor ? { id: pagination.cursor } : undefined,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, username: true, avatar: true } },
        media: {
          orderBy: { order: 'asc' },
          select: { id: true, url: true, type: true, width: true, height: true, blurhash: true },
        },
      },
      take: limit + 1,
    })

    let cursor: string | null = null

    if (posts.length > limit) {
      const next = posts.pop()!
      cursor = next.id
    }

    return { posts, cursor }
  }
}
