import { IsNotEmpty, IsString } from 'class-validator'

export class ProfileDto {
  @IsNotEmpty()
  @IsString()
  username: string
}
