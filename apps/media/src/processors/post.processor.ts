import { DatabaseService } from '@app/database'
import { Processor, WorkerHost } from '@nestjs/bullmq'
import { Logger } from '@nestjs/common' // Added Logger
import * as sharp from 'sharp'
import { Job } from 'bullmq'
import { StorageService } from '../storage.service'
import { BUCKETS } from '../utils/constants'
import { createHash } from 'crypto'
import { encode } from 'blurhash'
import { join } from 'path'
import { readFile, unlink, writeFile } from 'fs/promises'
import * as Ffmpeg from 'fluent-ffmpeg'

type ProcessStage = 'INIT' | 'PROCESSING_MEDIA' | 'DATABASE_TRANSACTION' | 'COMPLETED'

@Processor('post')
export class PostProcessor extends WorkerHost {
  private readonly logger = new Logger(PostProcessor.name)

  constructor(
    private readonly db: DatabaseService,
    private readonly storage: StorageService,
  ) {
    super()
  }

  async process(job: Job<any, any, string>) {
    const { postId, userId } = job.data
    this.logger.log(`Starting job ${job.id} for Post: ${postId} (User: ${userId})`)

    const post = await this.db.post.findUnique({
      where: { id: postId },
      include: { media: true },
    })

    if (!post || post.status !== 'processing') {
      this.logger.warn(`Job ${job.id} skipped: Post ${postId} not found or not in 'processing' status`)
      return
    }

    let currentStage: ProcessStage = 'INIT'
    const uploadedPermanentPaths: string[] = []

    try {
      currentStage = 'PROCESSING_MEDIA'
      this.logger.debug(`Processing ${post.media.length} media items for Post ${postId}`)

      const processedMedia = await Promise.all(
        post.media.map(mediaItem => this.processMediaItem(mediaItem, uploadedPermanentPaths)),
      )

      currentStage = 'DATABASE_TRANSACTION'
      this.logger.debug(`Updating database records for Post ${postId}`)

      await this.db.$transaction([
        ...processedMedia.map(m =>
          this.db.postMedia.update({
            where: { id: m.id },
            data: { url: m.urlBase, width: m.width, height: m.height, blurhash: m.blurhash },
          }),
        ),
        this.db.post.update({ where: { id: postId }, data: { status: 'completed' } }),
        this.db.user.update({ where: { id: userId }, data: { postCount: { increment: 1 } } }),
      ])

      currentStage = 'COMPLETED'
      this.logger.log(`Successfully processed Post ${postId}`)
    } catch (error) {
      this.logger.error(`Failed at stage [${currentStage}] for Post ${postId}: ${error.message}`, error.stack)

      await this.db.post
        .delete({ where: { id: post.id } })
        .catch(e => this.logger.error(`Failed to delete failed post ${postId}: ${e.message}`))

      if (uploadedPermanentPaths.length > 0) {
        this.logger.warn(`Rolling back ${uploadedPermanentPaths.length} uploads for Post ${postId}`)
        await Promise.all(uploadedPermanentPaths.map(path => this.storage.delete(BUCKETS.POST, path).catch(() => null)))
      }

      throw error
    } finally {
      this.logger.debug(`Cleaning up temporary media for Post ${postId}`)
      for (const mediaItem of post.media) {
        await this.storage.delete(BUCKETS.POST, mediaItem.url).catch(() => null)
      }
    }
  }

  private async processMediaItem(mediaItem: any, ledger: string[]) {
    this.logger.debug(`Downloading media item: ${mediaItem.id} (${mediaItem.type})`)
    const rawBuffer = await this.storage.download(BUCKETS.POST, mediaItem.url)
    const fileHash = createHash('sha256').update(rawBuffer).digest('hex').substring(0, 16)

    if (mediaItem.type === 'image') {
      return this.processImage(rawBuffer, fileHash, mediaItem.id, ledger)
    } else {
      return this.processVideo(rawBuffer, fileHash, mediaItem.id, ledger)
    }
  }

  private async processImage(buffer: Buffer, hash: string, id: string, ledger: string[]) {
    this.logger.debug(`Generating image derivatives for media: ${id}`)
    const image = sharp(buffer).rotate()
    const metadata = await image.metadata()

    const { data: rawPixels, info } = await image
      .clone()
      .resize(32, 32, { fit: 'inside' })
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true })

    const blurhash = encode(new Uint8ClampedArray(rawPixels), info.width, info.height, 4, 4)

    const thumbBuffer = await image.clone().resize(300, 300, { fit: 'cover' }).webp({ quality: 80 }).toBuffer()

    const feedBuffer = await image
      .clone()
      .resize({ width: 1080, withoutEnlargement: true })
      .webp({ quality: 85 })
      .toBuffer()

    const thumbPath = `processed/${hash}-thumb.webp`
    const feedPath = `processed/${hash}-feed.webp`

    await Promise.all([
      this.storage.upload(thumbBuffer, BUCKETS.POST, thumbPath, 'image/webp'),
      this.storage.upload(feedBuffer, BUCKETS.POST, feedPath, 'image/webp'),
    ])

    ledger.push(thumbPath, feedPath)

    return { id, width: metadata.width, height: metadata.height, blurhash, urlBase: `processed/${hash}` }
  }

  private async processVideo(buffer: Buffer, hash: string, id: string, ledger: string[]) {
    this.logger.debug(`Processing video and extracting frames for media: ${id}`)
    const tempVideoPath = join('/tmp', `${hash}.mp4`)
    const tempFramePath = join('/tmp', `${hash}.jpg`)

    try {
      await writeFile(tempVideoPath, buffer)

      await new Promise((resolve, reject) => {
        Ffmpeg(tempVideoPath)
          .screenshots({
            timestamps: [0.1],
            filename: `${hash}.jpg`,
            folder: '/tmp',
            size: '?x1080',
          })
          .on('end', resolve)
          .on('error', err => {
            this.logger.error(`FFmpeg Error on media ${id}: ${err.message}`)
            reject(err)
          })
      })

      const frameBuffer = await readFile(tempFramePath)

      const frameImage = sharp(frameBuffer)
      const metadata = await frameImage.metadata()

      const { data: rawPixels, info } = await frameImage
        .clone()
        .resize(32, 32, { fit: 'inside' })
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true })

      const blurhash = encode(new Uint8ClampedArray(rawPixels), info.width, info.height, 4, 4)
      const thumbBuffer = await frameImage.clone().resize(300, 300, { fit: 'cover' }).webp({ quality: 80 }).toBuffer()

      const videoPath = `processed/${hash}-video.mp4`
      const thumbPath = `processed/${hash}-thumb.webp`

      await Promise.all([
        this.storage.upload(buffer, BUCKETS.POST, videoPath, 'video/mp4'),
        this.storage.upload(thumbBuffer, BUCKETS.POST, thumbPath, 'image/webp'),
      ])

      ledger.push(videoPath, thumbPath)

      return { id, width: metadata.width, height: metadata.height, blurhash, urlBase: `processed/${hash}` }
    } catch (error) {
      throw error
    } finally {
      await unlink(tempVideoPath).catch(() => null)
      await unlink(tempFramePath).catch(() => null)
    }
  }
}
