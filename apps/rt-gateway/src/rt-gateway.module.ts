import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { RealtimeGateway } from './gateway.service'
import { RedisSubscriberService } from './redis-subscriber.service'

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true })],
  controllers: [],
  providers: [RealtimeGateway, RedisSubscriberService],
})
export class RtGatewayModule {}
