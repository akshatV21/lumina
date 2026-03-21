import { Module } from '@nestjs/common'
import { CommentsService } from './comments.service'
import { CommentsController } from './comments.controller'
import { NotificationProducer } from '../notification-producer.service'
import { BullModule } from '@nestjs/bullmq'
import { NOTIFICATIONS_QUEUE } from '@app/utils'

@Module({
  imports: [BullModule.registerQueue({ name: NOTIFICATIONS_QUEUE })],
  controllers: [CommentsController],
  providers: [CommentsService, NotificationProducer],
})
export class CommentsModule {}
