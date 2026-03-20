// apps/notifications/src/notifications.gateway.ts
import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets'
import { Server, Socket } from 'socket.io'
import { Logger, UnauthorizedException } from '@nestjs/common'
import { Authorize } from '@app/utils'
import { ConfigService } from '@nestjs/config'

@WebSocketGateway({ path: '/ws/gateway', cors: { origin: '*' } })
export class RealtimeGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server

  private readonly logger = new Logger(RealtimeGateway.name)

  constructor(private readonly config: ConfigService) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth?.token || client.handshake.headers['authorization']?.split(' ')[1]

      if (!token) throw new UnauthorizedException('No token provided')

      const payload = Authorize.validateToken(token, this.config.getOrThrow('AUTH_KEY'))
      const userId = payload.id

      client.join(`user_${userId}`)
      client.data.user = payload

      this.logger.log(`Client connected: ${client.id} (User: ${userId})`)
    } catch (error) {
      this.logger.warn(`Unauthorized connection attempt: ${client.id}`)
      client.disconnect()
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.data?.user?.sub
    this.logger.log(`Client disconnected: ${client.id} (User: ${userId || 'Unknown'})`)
  }

  @SubscribeMessage('ping')
  handlePing(@MessageBody() data: any, @ConnectedSocket() client: Socket) {
    const userId = client.data.user.sub
    this.logger.log(`Received ping from user ${userId} with data:`, data)

    return { event: 'pong', data: { message: 'Gateway is alive!', received: data } }
  }
}
