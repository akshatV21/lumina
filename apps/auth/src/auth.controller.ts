import { Body, Controller, Get, Post } from '@nestjs/common'
import { AuthService } from './auth.service'
import { RegisterDto } from './dtos/register.dto'
import { HttpResponse } from './utils/types'
import { LoginDto } from './dtos/login.dto'
import { Auth } from '@app/utils'

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @Auth({ isOpen: true })
  async httpRegister(@Body() data: RegisterDto): HttpResponse {
    await this.authService.register(data)
    return { success: true, message: 'User registered successfully.' }
  }

  @Post('login')
  @Auth({ isOpen: true })
  async httpLogin(@Body() data: LoginDto): HttpResponse {
    const res = await this.authService.login(data)
    return { success: true, message: 'User logged in successfully.', data: res }
  }
}
