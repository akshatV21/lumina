import { DatabaseService } from '@app/database'
import { Injectable } from '@nestjs/common'
import { UserBioDto } from './dtos/bio.dto'
import { User } from '@app/utils'
import { UserTypeDto } from './dtos/type.dto'

@Injectable()
export class UserService {
  constructor(private readonly db: DatabaseService) {}

  async user(userId: string) {
    return this.db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        bio: true,
        avatar: true,
        // Future - Followers/Following count, etc
      },
    })
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
