import { Body, Controller, Get, Post, Query } from '@nestjs/common'
import { MediaService } from './media.service'
import { Auth, AuthUser, HttpResponse, User } from '@app/utils'
import { UploadedDto } from './dtos/uploaded.dto'
import { PostUploadedDto } from './dtos/post.dto'

@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Get('avatar/url')
  @Auth()
  async httpAvatarUploadUrl(@Query('ext') ext: string, @AuthUser() user: User): HttpResponse {
    const data = await this.mediaService.avatarUploadURL(ext, user)
    return { success: true, message: 'Successfully created avatar upload url.', data }
  }

  @Post('avatar/uploaded')
  @Auth()
  async httpAvatarUploaded(@Body() data: UploadedDto, @AuthUser() user: User): HttpResponse {
    await this.mediaService.avatarUploaded(data.path, user)
    return { success: true, message: 'Avatar processing started.' }
  }

  @Get('post/url')
  @Auth()
  async httpPostUploadUrl(@Query('ext') ext: string, @AuthUser() user: User): HttpResponse {
    const data = await this.mediaService.postUploadUrl(ext, user)
    return { success: true, message: 'Successfully created post upload url.', data }
  }

  @Post('post/uploaded')
  @Auth()
  async httpPostUploaded(@Body() data: PostUploadedDto, @AuthUser() user: User): HttpResponse {
    await this.mediaService.postUploaded(data, user)
    return { success: true, message: 'Post processing started.' }
  }
}
