import { Module } from '@nestjs/common'
import { AuthController } from './auth.controller'
import { AuthService } from './auth.service'
import { ConfigModule } from '@nestjs/config'
import { DatabaseModule } from '@app/database'
import { UserModule } from './user/user.module'
import { APP_GUARD } from '@nestjs/core'
import { Authorize } from '@app/utils'

@Module({
  imports: [DatabaseModule, ConfigModule.forRoot({ isGlobal: true }), UserModule],
  controllers: [AuthController],
  providers: [AuthService, { provide: APP_GUARD, useClass: Authorize }],
})
export class AuthModule {}
