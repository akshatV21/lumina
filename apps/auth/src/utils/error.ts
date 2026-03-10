import { BadRequestException } from '@nestjs/common'

export class DuplicateUsernameError extends BadRequestException {
  constructor() {
    super({
      success: false,
      error: 'DupUser',
      message: 'This username is already in use.',
    })
  }
}

export class InvalidCredentialsError extends BadRequestException {
  constructor() {
    super({
      success: false,
      error: 'InvalidCredentials',
      message: 'Invalid credentials provided.',
    })
  }
}
