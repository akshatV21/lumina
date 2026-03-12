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
