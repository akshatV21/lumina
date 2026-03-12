import { Controller, Get, Query } from '@nestjs/common'
import { MediaService } from './media.service'
import { Auth, AuthUser, HttpResponse, User } from '@app/utils'

@Controller()
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Get('pp/url')
  @Auth()
  async httpCreatePPUploadUrl(@Query('ext') ext: string, @AuthUser() user: User): HttpResponse {
    const data = await this.mediaService.ppUploadURL(ext, user)
    return { success: true, message: 'Successfully create pp upload url.', data }
  }
}
