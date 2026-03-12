import { Body, Controller, Patch } from '@nestjs/common'
import { UserService } from './user.service'
import { Auth, AuthUser, HttpResponse, User } from '@app/utils'
import { UserBioDto } from './dtos/bio.dto'

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Patch('bio')
  @Auth()
  async httpUpdateBio(@Body() data: UserBioDto, @AuthUser() user: User): HttpResponse {
    await this.userService.bio(data, user)
    return { success: true, message: 'User bio updated successfully.' }
  }
}
