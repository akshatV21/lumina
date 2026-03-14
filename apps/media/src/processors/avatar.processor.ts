import { DatabaseService } from '@app/database'
import { Processor, WorkerHost } from '@nestjs/bullmq'
import { Job } from 'bullmq'
import * as sharp from 'sharp'
import { createHash } from 'crypto'
import { StorageService } from '../storage.service'
import { BUCKETS } from '../utils/constants'

@Processor('avatar')
export class AvatarProcessor extends WorkerHost {
  private MAX_WIDTH = 8000
  private MAX_HEIGHT = 8000

  constructor(
    private readonly db: DatabaseService,
    private readonly storage: StorageService,
  ) {
    super()
  }

  async process(job: Job<any, any, string>): Promise<any> {
    const { path, userId } = job.data

    try {
      const raw = await this.storage.download(BUCKETS.AVATAR, path)

      const hash = createHash('sha256').update(raw).digest('hex')

      const image = sharp(raw).rotate()
      await this.validate(image)

      const processed = await this.processvariants(image)

      await Promise.all(
        processed.map(p => {
          const outPath = `processed/${hash}-${p.name}.webp`
          return this.storage.upload(p.buffer, BUCKETS.AVATAR, outPath, 'image/webp')
        }),
      )

      await this.db.user.update({ where: { id: userId }, data: { avatar: hash } })
    } finally {
      await this.storage.delete(BUCKETS.AVATAR, path).catch(() => {})
    }
  }

  private async validate(image: sharp.Sharp) {
    const { width, height } = await image.metadata()

    if (!width || !height) throw new Error('Invalid File Provided. Could not read dimensions.')
    if (width > this.MAX_WIDTH || height > this.MAX_HEIGHT) {
      throw new Error(`Invalid File Size. Dimensions ${width}x${height} exceed maximum allowed.`)
    }
  }

  private async processvariants(image: sharp.Sharp) {
    const variants = [
      { name: 'sm', size: 96 },
      { name: 'md', size: 256 },
      { name: 'lg', size: 512 },
    ]

    const processed = await Promise.all(
      variants.map(async variant => {
        const buffer = await image
          .clone()
          .resize({
            width: variant.size,
            height: variant.size,
            fit: 'cover',
            position: 'entropy',
          })
          .webp({ quality: 80, effort: 6 })
          .toBuffer()

        return { name: variant.name, buffer }
      }),
    )

    return processed
  }
}
