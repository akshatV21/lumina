import { Module } from '@nestjs/common'
import { UserService } from './user.service'
import { UserController } from './user.controller'
import { BullModule } from '@nestjs/bullmq'
import { NOTIFICATIONS_QUEUE } from '@app/utils'
import { NotificationProducer } from '../notification-producer.service'

@Module({
  imports: [BullModule.registerQueue({ name: NOTIFICATIONS_QUEUE })],
  controllers: [UserController],
  providers: [UserService, NotificationProducer],
})
export class UserModule {}
