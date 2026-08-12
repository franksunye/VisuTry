import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error('DATABASE_URL is required for the local PostgreSQL contract')
}

export const localPostgresPrisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
  log: [],
})
