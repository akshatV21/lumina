import { Injectable, OnModuleInit } from '@nestjs/common'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from 'generated/prisma/client'

@Injectable()
export class DatabaseService extends PrismaClient implements OnModuleInit {
  constructor() {
    const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
    super({ adapter })
  }

  async onModuleInit() {
    try {
      await this.$connect()
      await this.$queryRaw`SELECT 1`
      console.log('Prisma is connected to the database.')
    } catch (error) {
      console.error('Prisma connection error:', error)
      throw error
    }
  }

  async onModuleDestroy() {
    await this.$disconnect()
    console.log('Prisma disconnected from the database.')
  }
}
