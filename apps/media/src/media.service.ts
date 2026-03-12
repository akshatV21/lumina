import { Injectable } from '@nestjs/common'
import { StorageService } from './storage.service'
import { User } from '@app/utils'
import { CreatePPUploadUrlError } from './error'

@Injectable()
export class MediaService {
  private ppbucket = 'avatar'

  constructor(private readonly storage: StorageService) {}

  async ppUploadURL(ext: string, user: User) {
    const path = `temp/${user.id}.${ext}`

    const data = await this.storage.sign(this.ppbucket, path)
    if (!data) throw new CreatePPUploadUrlError()

    return data
  }
}
