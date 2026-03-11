import { Module } from '@nestjs/common'
import { AuthController } from './auth.controller'
import { AuthService } from './auth.service'
import { ConfigModule } from '@nestjs/config'
import { DatabaseModule } from '@app/database'
import { UserModule } from './user/user.module'

@Module({
  imports: [DatabaseModule, ConfigModule.forRoot({ isGlobal: true }), UserModule],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
