import { Body, Controller, Get, Patch, Query } from '@nestjs/common'
import { UserService } from './user.service'
import { Auth, AuthUser, HttpResponse, User } from '@app/utils'
import { UserBioDto } from './dtos/bio.dto'
import { UserTypeDto } from './dtos/type.dto'

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('profile')
  @Auth()
  async httpGetProfile(@Query('username') username: string | null, @AuthUser() user: User): HttpResponse {
    const profile = await this.userService.profile(username, user)
    return { success: true, message: 'Fetched profile successfully.', data: { profile } }
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
