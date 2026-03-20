import { IsNotEmpty, IsOptional, IsString } from 'class-validator'

export class CreateCommentDto {
  @IsNotEmpty()
  @IsString()
  postId: string

  @IsNotEmpty()
  @IsString()
  content: string

  @IsOptional()
  @IsString()
  parentId: string
}
