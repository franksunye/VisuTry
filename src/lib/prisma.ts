import { PrismaClient } from '@prisma/client'
import { PrismaNeon } from '@prisma/adapter-neon'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// 使用 Neon Serverless Driver 优化性能
// Prisma 6.x 新 API：直接传递 connectionString 对象
// 这样可以获得更低的延迟和更好的 serverless 性能
const connectionString = process.env.DATABASE_URL!
const adapter = new PrismaNeon({ connectionString })

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  adapter,
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error']
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
