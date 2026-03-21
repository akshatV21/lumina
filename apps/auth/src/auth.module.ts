import { Module } from '@nestjs/common'
import { AuthController } from './auth.controller'
import { AuthService } from './auth.service'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { DatabaseModule } from '@app/database'
import { UserModule } from './user/user.module'
import { APP_GUARD } from '@nestjs/core'
import { Authorize, NOTIFICATIONS_QUEUE } from '@app/utils'
import { BullModule } from '@nestjs/bullmq'
import { RedisModule } from '@nestjs-modules/ioredis'

@Module({
  imports: [
    DatabaseModule,
    ConfigModule.forRoot({ isGlobal: true }),
    BullModule.forRootAsync({
      useFactory: (config: ConfigService) => ({ connection: { url: config.getOrThrow('REDIS_URL') } }),
      inject: [ConfigService],
    }),
    RedisModule.forRootAsync({
      useFactory: (config: ConfigService) => ({ type: 'single', url: config.getOrThrow('REDIS_URL') }),
      inject: [ConfigService],
    }),
    BullModule.registerQueue({ name: NOTIFICATIONS_QUEUE }),
    UserModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, { provide: APP_GUARD, useClass: Authorize }],
})
export class AuthModule {}
