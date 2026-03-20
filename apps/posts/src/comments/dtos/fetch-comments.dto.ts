import { CursorPaginationDto } from '@app/utils/pagination.dto'
import { IsNotEmpty, IsString } from 'class-validator'

export class FetchCommentsDto extends CursorPaginationDto {
  @IsNotEmpty()
  @IsString()
  postId: string
}
