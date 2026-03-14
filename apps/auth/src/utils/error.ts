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

export class UserNotFoundError extends BadRequestException {
  constructor() {
    super({
      success: false,
      error: 'UserNotFound',
      message: 'Unable to find user.',
    })
  }
}

export class AlreadyFollowingError extends BadRequestException {
  constructor() {
    super({
      success: false,
      error: 'AlreadyFollowing',
      message: 'You already follow this user.',
    })
  }
}

export class AlreadyRequestedError extends BadRequestException {
  constructor() {
    super({
      success: false,
      error: 'AlreadyRequested',
      message: 'You already have requested this user.',
    })
  }
}

export class FollowOwnError extends BadRequestException {
  constructor() {
    super({
      success: false,
      error: 'CannotFollowOwn',
      message: 'You cannot follow your own profile.',
    })
  }
}

export class RequestNotFoundError extends BadRequestException {
  constructor() {
    super({
      success: false,
      error: 'RequestNotFound',
      message: 'No request was found.',
    })
  }
}
