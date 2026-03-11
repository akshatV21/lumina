import { IsNotEmpty, IsString } from 'class-validator'

export class UserBioDto {
  @IsNotEmpty()
  @IsString()
  bio: string
}
