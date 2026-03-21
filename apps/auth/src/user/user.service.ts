import { DatabaseService } from '@app/database'
import { Injectable } from '@nestjs/common'
import { UserBioDto } from './dtos/bio.dto'
import { User } from '@app/utils'
import { UserTypeDto } from './dtos/type.dto'
import {
  AlreadyFollowingError,
  AlreadyRequestedError,
  FollowOwnError,
  RequestNotFoundError,
  UserNotFoundError,
} from '../utils/error'
import { FollowDto } from './dtos/follow.dto'
import { Prisma } from 'generated/prisma/client'
import { CursorPaginationDto } from '@app/utils/pagination.dto'
import { NotificationProducer } from '../notification-producer.service'

@Injectable()
export class UserService {
  constructor(
    private readonly db: DatabaseService,
    private readonly producer: NotificationProducer,
  ) {}

  async profile(targetUsername: string | null, user: User) {
    const where: any = {}

    if (targetUsername) where.username = targetUsername
    else where.id = user.id

    const profile = await this.db.user.findUnique({
      where,
      select: {
        id: true,
        username: true,
        bio: true,
        avatar: true,
        type: true,
        postCount: true,
        followerCount: true,
        followingCount: true,
        followers: { where: { followerId: user.id } },
      },
    })

    if (!profile) throw new UserNotFoundError()

    const relation = profile.followers[0]
    const followState = relation ? relation.status : 'none'

    return {
      id: profile.id,
      username: profile.username,
      bio: profile.bio,
      avatar: profile.avatar,
      type: profile.type,
      stats: {
        followers: profile.followerCount,
        following: profile.followingCount,
        posts: profile.postCount,
      },
      same: profile.id === user.id,
      followState,
    }
  }

  async bio(data: UserBioDto, user: User) {
    await this.db.user.update({
      where: { id: user.id },
      data: { bio: data.bio },
    })
  }

  async type(data: UserTypeDto, user: User) {
    await this.db.user.update({
      where: { id: user.id },
      data: { type: data.type },
    })
  }

  async follow(data: FollowDto, user: User) {
    if (data.targetId === user.id) throw new FollowOwnError()

    const target = await this.db.user.findUnique({
      where: { id: data.targetId },
      select: {
        id: true,
        type: true,
        followers: {
          where: { followerId: user.id },
          select: { status: true },
        },
      },
    })

    if (!target) throw new UserNotFoundError()

    const isPrivate = target.type === 'private'
    const alreadyFollowing = target.followers[0]

    if (alreadyFollowing) {
      if (alreadyFollowing.status === 'accepted') throw new AlreadyFollowingError()
      else throw new AlreadyRequestedError()
    }

    const tasks: Prisma.PrismaPromise<any>[] = [
      this.db.follow.create({
        data: {
          followerId: user.id,
          followingId: target.id,
          status: isPrivate ? 'pending' : 'accepted',
        },
      }),
    ]

    if (!isPrivate) {
      tasks.push(
        this.db.user.update({ where: { id: user.id }, data: { followingCount: { increment: 1 } } }),
        this.db.user.update({ where: { id: target.id }, data: { followerCount: { increment: 1 } } }),
      )
    }

    await this.db.$transaction(tasks).catch(error => {
      if (error.code === 'P2002') throw new AlreadyRequestedError()
      throw error
    })

    if (isPrivate) return
    this.producer.followed({ entityId: user.id, userId: target.id, actorId: user.id })
  }

  async requests(pagination: CursorPaginationDto, user: User) {
    const limit = pagination.limit ?? 20

    const requests = await this.db.follow.findMany({
      where: { followingId: user.id, status: 'pending' },
      cursor: pagination.cursor
        ? { followerId_followingId: { followerId: pagination.cursor, followingId: user.id } }
        : undefined,
      orderBy: { createdAt: 'desc' },
      include: { follower: { select: { id: true, username: true, avatar: true } } },
      take: limit + 1,
    })

    let nextCursor: string | null = null

    if (requests.length > limit) {
      const next = requests.pop()!
      nextCursor = next.followerId
    }

    return { requests: requests.map(r => r.follower), cursor: nextCursor }
  }

  async accept(followerId: string, user: User) {
    const follow = await this.db.follow.findUnique({
      where: { followerId_followingId: { followerId: followerId, followingId: user.id } },
      select: { status: true },
    })

    if (!follow || follow.status !== 'pending') throw new RequestNotFoundError()

    await this.db.$transaction([
      this.db.follow.update({
        where: { followerId_followingId: { followerId: followerId, followingId: user.id } },
        data: { status: 'accepted' },
      }),
      this.db.user.update({ where: { id: followerId }, data: { followingCount: { increment: 1 } } }),
      this.db.user.update({ where: { id: user.id }, data: { followerCount: { increment: 1 } } }),
    ])
  }

  async reject(followerId: string, user: User) {
    await this.db.follow.deleteMany({
      where: {
        followerId: followerId,
        followingId: user.id,
        status: 'pending',
      },
    })
  }

  async followers(pagination: CursorPaginationDto, user: User) {
    const limit = pagination.limit ?? 20

    const followers = await this.db.follow.findMany({
      where: { followingId: user.id, status: 'accepted' },
      cursor: pagination.cursor
        ? { followerId_followingId: { followerId: pagination.cursor, followingId: user.id } }
        : undefined,
      orderBy: { createdAt: 'desc' },
      select: { followerId: true, follower: { select: { id: true, username: true, avatar: true } } },
      take: limit + 1,
    })

    let nextCursor: string | null = null

    if (followers.length > limit) {
      const next = followers.pop()!
      nextCursor = next.followerId
    }

    return { followers: followers.map(f => f.follower), cursor: nextCursor }
  }

  async followings(pagination: CursorPaginationDto, user: User) {
    const limit = pagination.limit ?? 20

    const followings = await this.db.follow.findMany({
      where: { followerId: user.id, status: 'accepted' },
      cursor: pagination.cursor
        ? { followerId_followingId: { followerId: user.id, followingId: pagination.cursor } }
        : undefined,
      orderBy: { createdAt: 'asc' },
      select: { followingId: true, following: { select: { id: true, username: true, avatar: true } } },
      take: limit + 1,
    })

    let nextCursor: string | null = null

    if (followings.length > limit) {
      const next = followings.pop()!
      nextCursor = next.followingId
    }

    return { followings: followings.map(f => f.following), cursor: nextCursor }
  }
}
