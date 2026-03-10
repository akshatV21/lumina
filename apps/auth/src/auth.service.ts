import { DatabaseService } from '@app/database'
import { Injectable } from '@nestjs/common'
import { RegisterDto } from './dtos/register.dto'
import { DuplicateUsernameError, InvalidCredentialsError } from './utils/error'
import { compare, hash } from 'bcrypt'
import { LoginDto } from './dtos/login.dto'
import { sign } from 'jsonwebtoken'
import { ConfigService } from '@nestjs/config'

@Injectable()
export class AuthService {
  UNIQUE_CONSTRAINT_CODE = 'P2002'

  constructor(
    private readonly db: DatabaseService,
    private readonly config: ConfigService,
  ) {}

  async register(data: RegisterDto) {
    try {
      const hashed = await hash(data.password, 10)
      await this.db.user.create({ data: { username: data.username, password: hashed } })
    } catch (err) {
      if (err.code === this.UNIQUE_CONSTRAINT_CODE) {
        throw new DuplicateUsernameError()
      }

      throw err
    }
  }

  async login(data: LoginDto) {
    const registered = await this.db.user.findUnique({
      where: { username: data.username },
      select: { id: true, username: true, password: true },
    })

    if (!registered) throw new InvalidCredentialsError()

    const valid = await compare(data.password, registered.password)
    if (!valid) throw new InvalidCredentialsError()

    const key = this.config.getOrThrow('AUTH_KEY')
    const token = sign({ id: registered.id }, key, { expiresIn: '600s' })

    return {
      user: { id: registered.id, username: registered.username },
      token,
    }
  }
}
