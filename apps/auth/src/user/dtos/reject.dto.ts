import { IsNotEmpty, IsString } from 'class-validator'

export class RejectRequestDto {
  @IsNotEmpty()
  @IsString()
  followerId: string
}
