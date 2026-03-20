import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { RealtimeGateway } from './gateway.service'

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true })],
  controllers: [],
  providers: [RealtimeGateway],
})
export class RtGatewayModule {}
