import { Controller, Get, Query } from '@nestjs/common'
import { NotificationsService } from './notifications.service'
import { Auth, AuthUser, HttpResponse, User } from '@app/utils'
import { CursorPaginationDto } from '@app/utils/pagination.dto'

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notficationsService: NotificationsService) {}

  @Get('list')
  @Auth()
  async httpListNotifications(@Query() query: CursorPaginationDto, @AuthUser() user: User): HttpResponse {
    const res = await this.notficationsService.list(query, user)
    return { success: true, message: 'Fetched notfications successfully.', data: res }
  }
}
