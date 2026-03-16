import { Module } from '@nestjs/common'
import { MediaController } from './media.controller'
import { MediaService } from './media.service'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { DatabaseModule } from '@app/database'
import { APP_GUARD } from '@nestjs/core'
import { Authorize } from '@app/utils'
import { StorageService } from './storage.service'
import { BullModule } from '@nestjs/bullmq'
import { AvatarProcessor } from './processors/avatar.processor'
import { PostProcessor } from './processors/post.processor'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    BullModule.forRootAsync({
      useFactory: (config: ConfigService) => ({
        connection: {
          url: config.getOrThrow('REDIS_URL'),
          //  host: config.getOrThrow('REDIS_HOST'),
          // port: config.getOrThrow('REDIS_PORT')
        },
      }),
      inject: [ConfigService],
    }),
    BullModule.registerQueue({ name: 'avatar' }, { name: 'post' }),
  ],
  controllers: [MediaController],
  providers: [
    MediaService,
    { provide: APP_GUARD, useClass: Authorize },
    StorageService,
    AvatarProcessor,
    PostProcessor,
  ],
})
export class MediaModule {}
