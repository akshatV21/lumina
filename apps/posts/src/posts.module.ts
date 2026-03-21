import { Module } from '@nestjs/common'
import { PostsController } from './posts.controller'
import { PostsService } from './posts.service'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { DatabaseModule } from '@app/database'
import { APP_GUARD } from '@nestjs/core'
import { Authorize, NOTIFICATIONS_QUEUE } from '@app/utils'
import { CommentsModule } from './comments/comments.module'
import { BullModule } from '@nestjs/bullmq'
import { RedisModule } from '@nestjs-modules/ioredis'
import { NotificationProducer } from './notification-producer.service'

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
    CommentsModule,
  ],
  controllers: [PostsController],
  providers: [PostsService, { provide: APP_GUARD, useClass: Authorize }, NotificationProducer],
})
export class PostsModule {}
