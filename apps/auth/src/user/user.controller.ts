import { Body, Controller, Get, Patch, Post, Query } from '@nestjs/common'
import { UserService } from './user.service'
import { Auth, AuthUser, HttpResponse, User } from '@app/utils'
import { UserBioDto } from './dtos/bio.dto'
import { UserTypeDto } from './dtos/type.dto'
import { FollowDto } from './dtos/follow.dto'
import { CursorPaginationDto } from '@app/utils/pagination.dto'
import { AcceptRequestDto } from './dtos/accept.dto'
import { RejectRequestDto } from './dtos/reject.dto'

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

  @Post('follow')
  @Auth()
  async httpFollow(@Body() data: FollowDto, @AuthUser() user: User): HttpResponse {
    await this.userService.follow(data, user)
    return { success: true, message: 'Follow request successfull.' }
  }

  @Get('requests')
  @Auth()
  async httpGetFollowRequests(@Query() query: CursorPaginationDto, @AuthUser() user: User): HttpResponse {
    const res = await this.userService.requests(query, user)
    return { success: true, message: 'Fetched follow requests successfully.', data: res }
  }

  @Post('accept')
  @Auth()
  async httpAcceptRequest(@Body() data: AcceptRequestDto, @AuthUser() user: User): HttpResponse {
    await this.userService.accept(data.followerId, user)
    return { success: true, message: 'Request accepted successfully.' }
  }

  @Post('reject')
  @Auth()
  async httpRejectRequest(@Body() data: RejectRequestDto, @AuthUser() user: User): HttpResponse {
    await this.userService.reject(data.followerId, user)
    return { success: true, message: 'Request rejected successfully.' }
  }
}
