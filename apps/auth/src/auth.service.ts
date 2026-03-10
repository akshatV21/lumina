import { DatabaseService } from '@app/database'
import { Injectable } from '@nestjs/common'
import { RegisterDto } from './dtos/register.dto'
import { DuplicateUsernameError, InvalidPasswordError, InvalidUsernameError } from './utils/error'
import { compareSync, hashSync } from 'bcrypt'
import { LoginDto } from './dtos/login.dto'
import { sign } from 'jsonwebtoken'
import { ConfigService } from '@nestjs/config'

@Injectable()
export class AuthService {
  constructor(
    private readonly db: DatabaseService,
    private readonly config: ConfigService,
  ) {}

  async register(data: RegisterDto) {
    const dupe = await this.db.user.findUnique({ where: { username: data.username } })
    if (dupe) throw new DuplicateUsernameError()

    const hashed = hashSync(data.password, 10)
    await this.db.user.create({ data: { username: data.username, password: hashed } })
  }

  async login(data: LoginDto) {
    const registered = await this.db.user.findUnique({
      where: { username: data.username },
      select: { id: true, username: true, password: true },
    })

    if (!registered) throw new InvalidUsernameError()

    const valid = compareSync(data.password, registered.password)
    if (!valid) throw new InvalidPasswordError()

    const key = this.config.getOrThrow('AUTH_KEY')
    const token = sign({ id: registered.id }, key, { expiresIn: '600s' })

    return {
      user: { id: registered.id, username: registered.username },
      token,
    }
  }
}
