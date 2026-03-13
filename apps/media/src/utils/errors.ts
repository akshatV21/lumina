import { BadRequestException } from '@nestjs/common'

export class AvatarUploadUrlError extends BadRequestException {
  constructor() {
    super({
      success: false,
      error: 'PPUpURLErr',
      message: 'Failed to create an upload url.',
    })
  }
}
