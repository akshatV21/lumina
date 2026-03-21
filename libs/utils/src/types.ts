import { NotificationType } from 'generated/prisma/enums'

export type HttpResponse = Promise<{
  success: boolean
  message: string
  data?: Record<string, unknown>
}>

export type AuthOptions = {
  isOpen?: boolean
}

export type User = {
  id: string
}

export type NotificationData = {
  entityId: string
  userId: string
  actorId: string
}

export type NotificationQueueData = {
  type: NotificationType
  entityId: string
  userId: string
  key: string
}
