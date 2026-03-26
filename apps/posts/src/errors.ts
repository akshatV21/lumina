import { BadRequestException } from '@nestjs/common'

export class PrivateProfileError extends BadRequestException {
  constructor() {
    super({
      success: false,
      error: 'PrivateProfile',
      message: 'This profile is private. Follow them to see their journal.',
    })
  }
}
