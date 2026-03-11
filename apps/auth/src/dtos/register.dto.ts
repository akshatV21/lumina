import { IsEnum, IsNotEmpty, IsString, IsStrongPassword, MinLength } from 'class-validator'
import { AccountType } from 'generated/prisma/enums'

export class RegisterDto {
  @IsNotEmpty()
  @IsString()
  @MinLength(3)
  username: string

  @IsNotEmpty()
  @IsStrongPassword()
  password: string

  @IsNotEmpty()
  @IsEnum(AccountType)
  type: AccountType
}
