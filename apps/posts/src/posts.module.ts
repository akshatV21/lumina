import { Module } from '@nestjs/common'
import { PostsController } from './posts.controller'
import { PostsService } from './posts.service'
import { ConfigModule } from '@nestjs/config'
import { DatabaseModule } from '@app/database'
import { APP_GUARD } from '@nestjs/core'
import { Authorize } from '@app/utils'
import { CommentsModule } from './comments/comments.module'

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), DatabaseModule, CommentsModule],
  controllers: [PostsController],
  providers: [PostsService, { provide: APP_GUARD, useClass: Authorize }],
})
export class PostsModule {}
