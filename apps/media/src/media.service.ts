import { Injectable } from '@nestjs/common'
import { StorageService } from './storage.service'
import { User } from '@app/utils'
import { AvatarUploadUrlError, PostUploadUrlError } from './utils/errors'
import { BUCKETS } from './utils/constants'
import { InjectQueue } from '@nestjs/bullmq'
import { Queue } from 'bullmq'
import { randomUUID } from 'node:crypto'
import { PostUploadedDto } from './dtos/post.dto'
import { DatabaseService } from '@app/database'

@Injectable()
export class MediaService {
  constructor(
    private readonly db: DatabaseService,
    private readonly storage: StorageService,
    @InjectQueue('avatar') private avatarQueue: Queue,
    @InjectQueue('post') private postQueue: Queue,
  ) {}

  async avatarUploadURL(ext: string, user: User) {
    const path = `temp/${user.id}.${ext}`

    const data = await this.storage.sign(BUCKETS.AVATAR, path)
    if (data.error) throw new AvatarUploadUrlError()

    return data.data
  }

  async avatarUploaded(path: string, user: User) {
    await this.avatarQueue.add(
      'process-avatar',
      { path, userId: user.id },
      {
        attempts: 3,
        backoff: { type: 'exponential', delay: 1000 },
        removeOnComplete: true,
        removeOnFail: true,
      },
    )
  }

  async postUploadUrl(ext: string, user: User) {
    const fileId = randomUUID()
    const path = `temp/${user.id}-${fileId}.${ext}`

    const data = await this.storage.sign(BUCKETS.POST, path)
    if (data.error) throw new PostUploadUrlError()

    return data.data
  }

  async postUploaded(data: PostUploadedDto, user: User) {
    const post = await this.db.post.create({
      data: {
        content: data.content,
        userId: user.id,
        status: 'processing',
        media: { create: data.media.map(item => ({ url: item.path, type: item.type, order: item.order })) },
      },
      include: { media: true },
    })

    await this.postQueue.add(
      'process-post',
      { userId: user.id, postId: post.id },
      {
        attempts: 3,
        backoff: { type: 'exponential', delay: 1000 },
        removeOnComplete: true,
        removeOnFail: true,
      },
    )
  }
}
