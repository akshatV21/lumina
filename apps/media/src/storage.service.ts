import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { createClient, SupabaseClient } from '@supabase/supabase-js'

@Injectable()
export class StorageService {
  private client: SupabaseClient

  constructor(private readonly config: ConfigService) {
    const SP_URL = this.config.getOrThrow('SUPABASE_URL')
    const SP_KEY = this.config.getOrThrow('SUPABASE_KEY')

    this.client = createClient(SP_URL, SP_KEY)
  }

  async sign(bucket: string, path: string) {
    const res = await this.client.storage.from(bucket).createSignedUploadUrl(path, { upsert: true })
    return res.data
  }

  async download(bucket: string, path: string) {
    const url = this.client.storage.from(bucket).getPublicUrl(path, { download: true }).data.publicUrl
    const res = await fetch(url)

    const arrayBuffer = await res.arrayBuffer()
    const raw = Buffer.from(arrayBuffer)

    return raw
  }

  async upload(buffer: Buffer, bucket: string, path: string) {
    return this.client.storage.from(bucket).upload(path, buffer, { upsert: true })
  }

  async delete(bucket: string, path: string) {
    return this.client.storage.from(bucket).remove([path])
  }
}
