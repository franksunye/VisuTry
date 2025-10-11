import { PrismaClient } from '@prisma/client'
import { Pool, neonConfig } from '@neondatabase/serverless'
import { PrismaNeon } from '@prisma/adapter-neon'
import ws from 'ws'

// 配置 Neon Serverless Driver（WebSocket 连接，延迟更低）
neonConfig.webSocketConstructor = ws

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
  pool: Pool | undefined
}

// 创建连接池（复用连接，避免每次建立新连接）
// 这是解决 Serverless 环境慢的关键
const pool = globalForPrisma.pool ?? new Pool({ connectionString: process.env.DATABASE_URL })
if (process.env.NODE_ENV !== 'production') globalForPrisma.pool = pool

// 使用 Neon Adapter 创建 Prisma Client
const adapter = new PrismaNeon(pool)
export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  adapter,
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error']
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
