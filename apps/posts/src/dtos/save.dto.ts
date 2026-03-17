import { IsNotEmpty, IsString } from 'class-validator'

export class SaveQueryDto {
  @IsNotEmpty()
  @IsString()
  postId: string
}
