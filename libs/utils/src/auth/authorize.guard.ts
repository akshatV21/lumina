import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Reflector } from '@nestjs/core'
import { AUTH_OPTIONS_KEY, AuthOptions } from '../index'
import { verify } from 'jsonwebtoken'
import { InvalidTokenError, NoAuthHeaderError, TokenExpiredError } from './errors'

@Injectable()
export class Authorize implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly config: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest()

    const { isOpen } = this.reflector.get<AuthOptions>(AUTH_OPTIONS_KEY, context.getHandler())
    if (isOpen) return true

    const authHeader = request.headers.authorization
    if (!authHeader) throw new NoAuthHeaderError()

    const token = authHeader.split(' ')[1]
    const user = Authorize.validateToken(token, this.config.getOrThrow('AUTH_KEY'))

    request.user = user
    return true
  }

  static validateToken(token: string, secret: string): any {
    return verify(token, secret, (err, payload) => {
      // when jwt is valid
      if (!err) return payload

      // when jwt has expired
      if (err.name === 'TokenExpiredError') throw new TokenExpiredError()

      // throws error when jwt is malformed
      throw new InvalidTokenError()
    })
  }
}
