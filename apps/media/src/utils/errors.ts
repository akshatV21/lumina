import { BadRequestException } from '@nestjs/common'

export class AvatarUploadUrlError extends BadRequestException {
  constructor() {
    super({
      success: false,
      error: 'AvatarUploadURLError',
      message: 'Failed to create an upload url.',
    })
  }
}

export class PostUploadUrlError extends BadRequestException {
  constructor() {
    super({
      success: false,
      error: 'PostUploadURLError',
      message: 'Failed to create an upload url.',
    })
  }
}
