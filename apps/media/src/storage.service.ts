import { User } from '@app/utils'
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
}
