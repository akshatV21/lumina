import { CursorPaginationDto } from '@app/utils/pagination.dto'
import { IsOptional, IsString } from 'class-validator'

export class JournalQueryDto extends CursorPaginationDto {
  @IsOptional()
  @IsString()
  targetId: string
}
