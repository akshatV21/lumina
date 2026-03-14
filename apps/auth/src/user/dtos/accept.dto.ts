import { IsNotEmpty, IsString } from 'class-validator'

export class AcceptRequestDto {
  @IsNotEmpty()
  @IsString()
  followerId: string
}
