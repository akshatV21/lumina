import { DatabaseService } from '@app/database'
import { Injectable } from '@nestjs/common'

@Injectable()
export class UserService {
  constructor(private readonly db: DatabaseService) {}
}
