export type HttpResponse = Promise<{
  success: boolean
  message: string
  data?: Record<string, unknown>
}>
