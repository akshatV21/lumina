import { BadRequestException, NotFoundException } from '@nestjs/common'

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

export class UserNotFoundError extends NotFoundException {
  constructor() {
    super({
      success: false,
      error: 'UserNotFound',
      message: 'Unable to find user.',
    })
  }
}
