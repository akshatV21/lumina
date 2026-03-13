import { Injectable } from '@nestjs/common'
import { StorageService } from './storage.service'
import { User } from '@app/utils'
import { AvatarUploadUrlError } from './utils/errors'
import { BUCKETS } from './utils/constants'
import { InjectQueue } from '@nestjs/bullmq'
import { Queue } from 'bullmq'

@Injectable()
export class MediaService {
  constructor(
    private readonly storage: StorageService,
    @InjectQueue('avatar') private avatarQueue: Queue,
  ) {}

  async avatarUploadURL(ext: string, user: User) {
    const path = `temp/${user.id}.${ext}`

    const data = await this.storage.sign(BUCKETS.AVATAR, path)
    if (!data) throw new AvatarUploadUrlError()

    return data
  }

  async avatarUploaded(path: string, user: User) {
    await this.avatarQueue.add('process-avatar', { path, userId: user.id })
  }
}
