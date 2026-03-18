import { Controller, Get, Query } from '@nestjs/common'
import { PostsService } from './posts.service'
import { Auth, AuthUser, HttpResponse, User } from '@app/utils'
import { JournalQueryDto } from './dtos/journal.dto'
import { CursorPaginationDto } from '@app/utils/pagination.dto'
import { LikeQueryDto } from './dtos/like.dto'
import { SaveQueryDto } from './dtos/save.dto'

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Get('journal')
  @Auth()
  async httpGetJournal(@Query() query: JournalQueryDto, @AuthUser() user: User): HttpResponse {
    const journal = await this.postsService.journal(query, user)
    return { success: true, message: 'Journal fetched successfully.', data: { journal } }
  }

  @Get('feed')
  @Auth()
  async httpGetFeed(@Query() query: CursorPaginationDto, @AuthUser() user: User): HttpResponse {
    const feed = await this.postsService.feed(query, user)
    return { success: true, message: 'Feed fetched successfully.', data: { feed } }
  }

  @Get('saved')
  @Auth()
  async httpGetSaved(@Query() query: CursorPaginationDto, @AuthUser() user: User): HttpResponse {
    const saved = await this.postsService.saved(query, user)
    return { success: true, message: 'Saved posts fetched successfully.', data: { saved } }
  }

  @Get('like')
  @Auth()
  async httpLikePost(@Query() query: LikeQueryDto, @AuthUser() user: User): HttpResponse {
    const liked = await this.postsService.toggleLike(query.postId, user.id)
    return { success: true, message: 'Successfully toggled like for post.', data: { liked } }
  }

  @Get('save')
  @Auth()
  async httpSavePost(@Query() query: SaveQueryDto, @AuthUser() user: User): HttpResponse {
    const saved = await this.postsService.toggleSaved(query.postId, user.id)
    return { success: true, message: 'Successfully toggled save for post.', data: { saved } }
  }
}
