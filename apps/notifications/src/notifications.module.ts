import { DatabaseModule } from '@app/database'
import { NOTIFICATIONS_QUEUE } from '@app/utils'
import { RedisModule } from '@nestjs-modules/ioredis'
import { BullModule } from '@nestjs/bullmq'
import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { NotificationProcessor } from './notifications.processor'

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
  controllers: [],
  providers: [NotificationProcessor],
})
export class NotificationsModule {}
