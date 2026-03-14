import { IsEnum, IsNotEmpty } from 'class-validator'
import { AccountType } from 'generated/prisma/enums'

export class UserTypeDto {
  @IsNotEmpty()
  @IsEnum(AccountType)
  type: AccountType
}
