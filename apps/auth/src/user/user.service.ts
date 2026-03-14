import { DatabaseService } from '@app/database'
import { Injectable } from '@nestjs/common'
import { UserBioDto } from './dtos/bio.dto'
import { User } from '@app/utils'
import { UserTypeDto } from './dtos/type.dto'
import { UserNotFoundError } from '../utils/error'

@Injectable()
export class UserService {
  constructor(private readonly db: DatabaseService) {}

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
        followerCount: true,
        followingCount: true,
        followers: { where: { followerId: user.id, status: 'accepted' } },
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
}
