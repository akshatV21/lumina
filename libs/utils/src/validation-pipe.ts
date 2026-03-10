import { ArgumentMetadata, BadRequestException, Injectable, PipeTransform } from '@nestjs/common'
import { validate } from 'class-validator'
import { plainToInstance } from 'class-transformer'

@Injectable()
export class CustomValidationPipe implements PipeTransform {
  async transform(value: any, { metatype }: ArgumentMetadata) {
    if (!metatype || !this.toValidate(metatype)) {
      return value
    }

    const object = plainToInstance(metatype, value ?? {})
    const errors = await validate(object, { whitelist: true })

    if (errors.length > 0) {
      const messages = errors.flatMap(err => Object.values(err.constraints || {}))

      throw new BadRequestException({
        success: false,
        message: messages,
        error: 'InvalidPayload',
      })
    }

    return object
  }

  private toValidate(metatype: any): boolean {
    const types = [String, Boolean, Number, Array, Object]
    return !types.includes(metatype)
  }
}
