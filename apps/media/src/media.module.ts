import { Module } from '@nestjs/common'
import { MediaController } from './media.controller'
import { MediaService } from './media.service'
import { ConfigModule } from '@nestjs/config'
import { DatabaseModule } from '@app/database'
import { APP_GUARD } from '@nestjs/core'
import { Authorize } from '@app/utils'
import { StorageService } from './storage.service'

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true, envFilePath: ['./apps/media/.env', './.env'] }), DatabaseModule],
  controllers: [MediaController],
  providers: [MediaService, { provide: APP_GUARD, useClass: Authorize }, StorageService],
})
export class MediaModule {}
