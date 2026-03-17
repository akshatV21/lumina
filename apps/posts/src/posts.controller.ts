import { Controller, Get, Query } from '@nestjs/common'
import { PostsService } from './posts.service'
import { Auth, AuthUser, HttpResponse, User } from '@app/utils'
import { JournalQueryDto } from './dtos/journal.dto'

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Get('journal')
  @Auth()
  async httpGetJournal(@Query() query: JournalQueryDto, @AuthUser() user: User): HttpResponse {
    const journal = await this.postsService.journal(query, user)
    return { success: true, message: 'Journal fetched successfully.', data: { journal } }
  }
}
