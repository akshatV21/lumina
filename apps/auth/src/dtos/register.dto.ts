import { IsNotEmpty, IsString, IsStrongPassword, MinLength } from 'class-validator'

export class RegisterDto {
  @IsNotEmpty()
  @IsString()
  @MinLength(3)
  username: string

  @IsNotEmpty()
  @IsStrongPassword()
  password: string
}
