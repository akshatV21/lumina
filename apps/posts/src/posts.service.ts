import { DatabaseService } from '@app/database'
import { User } from '@app/utils'
import { Injectable } from '@nestjs/common'
import { JournalQueryDto } from './dtos/journal.dto'

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
}
