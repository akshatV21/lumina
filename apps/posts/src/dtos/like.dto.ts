import { IsNotEmpty, IsString } from 'class-validator'

export class LikeQueryDto {
  @IsNotEmpty()
  @IsString()
  postId: string
}
