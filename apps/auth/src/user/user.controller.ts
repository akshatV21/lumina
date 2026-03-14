import { Body, Controller, Get, Patch } from '@nestjs/common'
import { UserService } from './user.service'
import { Auth, AuthUser, HttpResponse, User } from '@app/utils'
import { UserBioDto } from './dtos/bio.dto'
import { UserTypeDto } from './dtos/type.dto'

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @Auth()
  async httpGetUser(@AuthUser() user: User): HttpResponse {
    const res = await this.userService.user(user.id)
    return { success: true, message: 'Fetched user successfully.', data: { user: res } }
  }

  @Patch('bio')
  @Auth()
  async httpUpdateBio(@Body() data: UserBioDto, @AuthUser() user: User): HttpResponse {
    await this.userService.bio(data, user)
    return { success: true, message: 'User bio updated successfully.' }
  }

  @Patch('type')
  @Auth()
  async httpUpdateType(@Body() data: UserTypeDto, @AuthUser() user: User): HttpResponse {
    await this.userService.type(data, user)
    return { success: true, message: 'User account type updated successfully.' }
  }
}
