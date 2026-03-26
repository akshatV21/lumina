import { DatabaseService } from '@app/database'
import { User } from '@app/utils'
import { Injectable } from '@nestjs/common'
import { JournalQueryDto } from './dtos/journal.dto'
import { CursorPaginationDto } from '@app/utils/pagination.dto'
import { NotificationProducer } from './notification-producer.service'
import { PrivateProfileError } from './errors'

@Injectable()
export class PostsService {
  constructor(
    private readonly db: DatabaseService,
    private readonly producer: NotificationProducer,
  ) {}

  async journal(query: JournalQueryDto, user: User) {
    const limit = query.limit ?? 10
    const same = query.targetId === user.id

    if (!same) {
      const target = await this.db.user.findUnique({
        where: { id: query.targetId },
        select: {
          type: true,
          followers: { where: { followerId: user.id }, select: { status: true } },
        },
      })

      if (target?.type === 'private') {
        const follow = target.followers[0]
        if (!follow || follow.status !== 'accepted') throw new PrivateProfileError()
      }
    }

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
        likes: { where: { userId: user.id }, select: { userId: true } },
        saved: { where: { userId: user.id }, select: { userId: true } },
      },
    })

    let cursor: string | null = null

    if (posts.length > limit) {
      const next = posts.pop()!
      cursor = next.id
    }

    return {
      posts: posts.map(p => ({ ...p, liked: p.likes.length > 0, saved: p.saved.length > 0 })),
      cursor,
    }
  }

  async post(id: string, user: User) {
    const post = await this.db.post.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatar: true,
            type: true,
            followers: { where: { followerId: user.id }, select: { status: true } },
          },
        },
        media: {
          orderBy: { order: 'asc' },
          select: { id: true, url: true, type: true, width: true, height: true, blurhash: true },
        },
        likes: { where: { userId: user.id }, select: { userId: true } },
        saved: { where: { userId: user.id }, select: { userId: true } },
      },
    })

    if (!post) return null

    const same = post.userId === user.id

    if (!same && post.user.type === 'private') {
      const follow = post.user.followers[0]
      if (!follow || follow.status !== 'accepted') throw new PrivateProfileError()
    }

    return {
      ...post,
      liked: post.likes.length > 0,
      saved: post.saved.length > 0,
    }
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
        likes: { where: { userId: user.id }, select: { userId: true } },
        saved: { where: { userId: user.id }, select: { userId: true } },
      },
      take: limit + 1,
    })

    let cursor: string | null = null

    if (posts.length > limit) {
      const next = posts.pop()!
      cursor = next.id
    }

    return {
      posts: posts.map(p => ({ ...p, liked: p.likes.length > 0, saved: p.saved.length > 0 })),
      cursor,
    }
  }

  async saved(pagination: CursorPaginationDto, user: User) {
    const limit = pagination.limit ?? 20

    const saved = await this.db.savedPost.findMany({
      where: { userId: user.id },
      cursor: pagination.cursor ? { userId_postId: { userId: user.id, postId: pagination.cursor } } : undefined,
      orderBy: { createdAt: 'desc' },
      select: {
        post: {
          include: {
            user: { select: { id: true, username: true, avatar: true } },
            media: {
              orderBy: { order: 'asc' },
              select: { id: true, url: true, type: true, width: true, height: true, blurhash: true },
            },
            likes: { where: { userId: user.id }, select: { userId: true } },
            saved: { where: { userId: user.id }, select: { userId: true } },
          },
        },
      },
      take: limit + 1,
    })

    let cursor: string | null = null

    if (saved.length > limit) {
      const next = saved.pop()!
      cursor = next.post.id
    }

    return {
      posts: saved.map(s => ({ ...s.post, liked: s.post.likes.length > 0, saved: s.post.saved.length > 0 })),
      cursor,
    }
  }

  async toggleLike(postId: string, userId: string) {
    const like = await this.db.like.findUnique({
      where: { userId_postId: { userId, postId } },
      select: { createdAt: true },
    })

    return like ? this.unlike(postId, userId) : this.like(postId, userId)
  }

  private async unlike(postId: string, userId: string) {
    await this.db.$transaction([
      this.db.like.delete({ where: { userId_postId: { userId, postId } } }),
      this.db.post.update({ where: { id: postId }, data: { likeCount: { decrement: 1 } } }),
    ])
  }

  private async like(postId: string, userId: string) {
    try {
      const [_, post] = await this.db.$transaction([
        this.db.like.create({ data: { userId, postId } }),
        this.db.post.update({ where: { id: postId }, data: { likeCount: { increment: 1 } } }),
      ])

      this.producer.like({ entityId: postId, actorId: userId, userId: post.userId })
    } catch (error) {
      if (error.code === 'P2002') return true
      throw error
    }
  }

  async toggleSaved(postId: string, userId: string) {
    const saved = await this.db.savedPost.findUnique({
      where: { userId_postId: { userId, postId } },
      select: { createdAt: true },
    })

    return saved ? this.unsave(postId, userId) : this.save(postId, userId)
  }

  private async unsave(postId: string, userId: string) {
    await this.db.savedPost.delete({ where: { userId_postId: { userId, postId } } })
    return false
  }

  private async save(postId: string, userId: string) {
    try {
      await this.db.savedPost.create({ data: { userId, postId } })
      return true
    } catch (error) {
      if (error.code === 'P2002') return true
      throw error
    }
  }
}
