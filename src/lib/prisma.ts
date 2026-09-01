// Vercel runs these API routes on the Node.js runtime. The standard client
// entrypoint avoids the Edge/WASM loader path that can fail when the preview
// function bundle is initialized. Cloudflare builds alias this module to the
// no-Prisma stub in next.config.js, so this import remains CF-safe.
import { PrismaClient } from '@prisma/client/index'
import { createRuntimePostgresAdapter } from './postgres-runtime'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const adapter = createRuntimePostgresAdapter()

// 🔍 性能监控：记录 Prisma 查询日志
const logLevels = process.env.NODE_ENV === 'development'
  ? ['query', 'error', 'warn'] as const
  : ['error'] as const

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  adapter: adapter, // Current PostgreSQL serverless adapter
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

// Do not eagerly connect during module evaluation. Connection lifecycle is
// owned by the configured runtime adapter.
