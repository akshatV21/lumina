import { Module } from '@nestjs/common'
import { PostsController } from './posts.controller'
import { PostsService } from './posts.service'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { DatabaseModule } from '@app/database'
import { APP_GUARD } from '@nestjs/core'
import { Authorize, NOTIFICATIONS_QUEUE } from '@app/utils'
import { CommentsModule } from './comments/comments.module'
import { BullModule } from '@nestjs/bullmq'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    BullModule.forRootAsync({
      useFactory: (config: ConfigService) => ({ connection: { url: config.getOrThrow('REDIS_URL') } }),
      inject: [ConfigService],
    }),
    DatabaseModule,
    CommentsModule,
    BullModule.registerQueue({ name: NOTIFICATIONS_QUEUE }),
  ],
  controllers: [PostsController],
  providers: [PostsService, { provide: APP_GUARD, useClass: Authorize }],
})
export class PostsModule {}
