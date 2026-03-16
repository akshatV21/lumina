import { Type } from 'class-transformer'
import { IsString, IsOptional, IsArray, ValidateNested, IsEnum, IsInt, Min, IsNotEmpty } from 'class-validator'
import { MediaType } from 'generated/prisma/enums'

class PostMediaDto {
  @IsNotEmpty()
  @IsString()
  path: string

  @IsNotEmpty()
  @IsEnum(MediaType)
  type: MediaType

  @IsNotEmpty()
  @IsInt()
  @Min(0)
  order: number
}

export class PostUploadedDto {
  @IsOptional()
  @IsString()
  content?: string

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PostMediaDto)
  media: PostMediaDto[]
}
