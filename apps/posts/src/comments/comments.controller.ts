import { Body, Controller, Get, Post, Query } from '@nestjs/common'
import { CommentsService } from './comments.service'
import { Auth, AuthUser, HttpResponse, User } from '@app/utils'
import { CreateCommentDto } from './dtos/comment.dto'
import { FetchCommentsDto } from './dtos/fetch-comments.dto'
import { FetchRepliesDto } from './dtos/fetch-replies.dto'

@Controller('comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post('create')
  @Auth()
  async httpCreateComment(@Body() data: CreateCommentDto, @AuthUser() user: User): HttpResponse {
    const comment = await this.commentsService.create(data, user)
    return { success: true, message: 'Comment posted successfully.', data: { comment } }
  }

  @Get('list')
  @Auth()
  async httpListComments(@Query() query: FetchCommentsDto, @AuthUser() user: User): HttpResponse {
    const res = await this.commentsService.comments(query, user)
    return { success: true, message: 'Fetched comments successfully.', data: res }
  }

  @Get('replies')
  @Auth()
  async httpListReplies(@Query() query: FetchRepliesDto, @AuthUser() user: User): HttpResponse {
    const res = await this.commentsService.replies(query, user)
    return { success: true, message: 'Fetched replies successfully.', data: res }
  }
}
