import { DatabaseModule } from '@app/database'
import { Authorize, NOTIFICATIONS_QUEUE } from '@app/utils'
import { RedisModule } from '@nestjs-modules/ioredis'
import { BullModule } from '@nestjs/bullmq'
import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { NotificationProcessor } from './notifications.processor'
import { NotificationsController } from './notifications.controller'
import { NotificationsService } from './notifications.service'
import { APP_GUARD } from '@nestjs/core'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    BullModule.forRootAsync({
      useFactory: (config: ConfigService) => ({ connection: { url: config.getOrThrow('REDIS_URL') } }),
      inject: [ConfigService],
    }),
    RedisModule.forRootAsync({
      useFactory: (config: ConfigService) => ({ type: 'single', url: config.getOrThrow('REDIS_URL') }),
      inject: [ConfigService],
    }),
    DatabaseModule,
    BullModule.registerQueue({ name: NOTIFICATIONS_QUEUE }),
  ],
  controllers: [NotificationsController],
  providers: [NotificationsService, { provide: APP_GUARD, useClass: Authorize }, NotificationProcessor],
})
export class NotificationsModule {}
