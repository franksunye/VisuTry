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

// 🔍 性能监控：记录 Prisma 查询日志
const logLevels = process.env.NODE_ENV === 'development'
  ? ['query', 'error', 'warn'] as const
  : ['error'] as const

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  // adapter: adapter, // 暂时禁用适配器以解决类型兼容性问题
  log: logLevels.map(level => ({
    level,
    emit: 'event'
  }))
})

// 🔍 监听查询事件，记录慢查询
if (process.env.NODE_ENV === 'production') {
  (prisma as any).$on('query', (e: any) => {
    const duration = e.duration
    if (duration > 1000) {
      console.error(`🔴 [Prisma] SLOW QUERY (${duration}ms):`, e.query)
    } else if (duration > 500) {
      console.warn(`🟡 [Prisma] Slow query (${duration}ms):`, e.query)
    } else if (duration > 200) {
      console.info(`🟢 [Prisma] Query (${duration}ms):`, e.query)
    }
  })
}

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// 🔥 数据库连接预热
// 在应用启动时立即建立连接，避免首次查询时的冷启动延迟
if (process.env.NODE_ENV === 'production') {
  prisma.$connect()
    .then(() => {
      console.log('✅ [Prisma] Database connection established')
    })
    .catch((error) => {
      console.error('❌ [Prisma] Failed to connect to database:', error)
    })
}
