import { UnauthorizedException } from '@nestjs/common'

export class NoAuthHeaderError extends UnauthorizedException {
  constructor() {
    super({
      success: false,
      error: 'NoAuthHeader',
      message: 'No auth header was provided.',
    })
  }
}

export class TokenExpiredError extends UnauthorizedException {
  constructor() {
    super({
      success: false,
      error: 'TokenExpired',
      message: 'Token is expired.',
    })
  }
}

export class InvalidTokenError extends UnauthorizedException {
  constructor() {
    super({
      success: false,
      error: 'InvalidToken',
      message: 'Provided token is invalid.',
    })
  }
}
