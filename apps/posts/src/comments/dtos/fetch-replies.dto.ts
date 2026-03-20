import { CursorPaginationDto } from '@app/utils/pagination.dto'
import { IsNotEmpty, IsString } from 'class-validator'

export class FetchRepliesDto extends CursorPaginationDto {
  @IsNotEmpty()
  @IsString()
  parentId: string
}
