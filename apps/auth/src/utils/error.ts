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

export class InvalidUsernameError extends BadRequestException {
  constructor() {
    super({
      success: false,
      error: 'InvalidUsername',
      message: 'No user is registered with provided username.',
    })
  }
}

export class InvalidPasswordError extends BadRequestException {
  constructor() {
    super({
      success: false,
      error: 'InvalidPassword',
      message: 'Invalid password was provided.',
    })
  }
}
