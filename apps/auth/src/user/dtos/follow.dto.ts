import { IsNotEmpty, IsString } from 'class-validator'

export class FollowDto {
  @IsNotEmpty()
  @IsString()
  targetId: string
}
