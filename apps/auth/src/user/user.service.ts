import { DatabaseService } from '@app/database'
import { Injectable } from '@nestjs/common'
import { UserBioDto } from './dtos/bio.dto'
import { User } from '@app/utils'

@Injectable()
export class UserService {
  constructor(private readonly db: DatabaseService) {}

  async bio(data: UserBioDto, user: User) {
    await this.db.user.update({
      where: { id: user.id },
      data: { bio: data.bio },
    })
  }
}
