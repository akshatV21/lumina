import { SetMetadata } from '@nestjs/common'
import { AUTH_OPTIONS_KEY, AuthOptions } from '../index'

export const Auth = (options?: AuthOptions) => {
  const final: AuthOptions = {
    isOpen: options?.isOpen ?? false,
  }

  return SetMetadata(AUTH_OPTIONS_KEY, final)
}
