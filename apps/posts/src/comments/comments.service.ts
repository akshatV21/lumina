import { DatabaseService } from '@app/database'
import { Injectable } from '@nestjs/common'
import { CreateCommentDto } from './dtos/comment.dto'
import { User } from '@app/utils'
import { NoCommentError, NoParentError } from './errors'
import { FetchCommentsDto } from './dtos/fetch-comments.dto'
import { FetchRepliesDto } from './dtos/fetch-replies.dto'

@Injectable()
export class CommentsService {
  constructor(private readonly db: DatabaseService) {}

  async create(data: CreateCommentDto, user: User) {
    const usernames = this.extractMentions(data.content)
    const mentions = await this.validMentionIds(usernames)

    if (data.parentId) {
      const parent = await this.db.comment.findUnique({
        where: { id: data.parentId, parentId: null },
        select: { id: true, user: { select: { id: true } } },
      })

      if (!parent) throw new NoParentError()
    }

    const [comment, _] = await this.db.$transaction([
      this.db.comment.create({
        data: {
          postId: data.postId,
          userId: user.id,
          content: data.content,
          parentId: data.parentId ?? null,
          mentions: { connect: mentions.map(m => ({ id: m })) },
        },
        include: { user: { select: { id: true, username: true, avatar: true } } },
      }),
      this.db.post.update({ where: { id: data.postId }, data: { commentCount: { increment: 1 } } }),
    ])

    // Fire events in future

    return comment
  }

  async comments(query: FetchCommentsDto, user: User) {
    const limit = query.limit ?? 10

    const comments = await this.db.comment.findMany({
      where: { postId: query.postId, parentId: null },
      cursor: query.cursor ? { id: query.cursor } : undefined,
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        user: { select: { id: true, username: true, avatar: true } },
        content: true,
        _count: { select: { replies: true } },
        mentions: { select: { id: true, username: true } },
        createdAt: true,
      },
      take: limit + 1,
    })

    let cursor: string | null = null

    if (comments.length > limit) {
      const next = comments.pop()!
      cursor = next.id
    }

    return {
      comments: comments.map(c => ({ ...c, replyCount: c._count.replies })),
      cursor,
    }
  }

  async replies(query: FetchRepliesDto, user: User) {
    const limit = query.limit ?? 10

    const replies = await this.db.comment.findMany({
      where: { parentId: query.parentId },
      cursor: query.cursor ? { id: query.cursor } : undefined,
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        user: { select: { id: true, username: true, avatar: true } },
        content: true,
        mentions: { select: { id: true, username: true } },
        createdAt: true,
      },
      take: limit + 1,
    })

    let cursor: string | null = null

    if (replies.length > limit) {
      const next = replies.pop()!
      cursor = next.id
    }

    return { replies, cursor }
  }

  async delete(commentId: string, user: User) {
    const comment = await this.db.comment.findUnique({
      where: { id: commentId, userId: user.id },
      select: { postId: true, parentId: true, _count: { select: { replies: true } } },
    })

    if (!comment) throw new NoCommentError()

    await this.db.$transaction([
      this.db.comment.delete({ where: { id: commentId } }),
      this.db.post.update({
        where: { id: comment.postId },
        data: { commentCount: { decrement: 1 + comment._count.replies } },
      }),
    ])
  }

  private extractMentions(content: string): string[] {
    const regex = /@([a-zA-Z0-9_]+)/g
    const matches = content.match(regex) || []

    return [...new Set(matches.map((m: string) => m.slice(1)))]
  }

  private async validMentionIds(usernames: string[]): Promise<string[]> {
    if (usernames.length <= 0) return []

    const valid = await this.db.user.findMany({
      where: { username: { in: usernames } },
      select: { id: true },
    })

    return valid.map(u => u.id)
  }
}
