import { Transform } from 'class-transformer'
import { IsNumber, IsOptional, IsString } from 'class-validator'

export class CursorPaginationDto {
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => Number(value))
  limit?: number

  @IsOptional()
  @IsString()
  cursor?: string
}
