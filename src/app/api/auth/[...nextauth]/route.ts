// IMPORTANT: Setup proxy BEFORE NextAuth
import "@/lib/proxy-setup"

import NextAuth from "next-auth"
import { authOptions } from "@/lib/auth-runtime"
import { logger } from "@/lib/logger"

// CRITICAL: Force Node.js runtime (not Edge) for Prisma compatibility
// Edge Runtime requires prisma:// protocol, but we're using direct PostgreSQL connection
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const handler = NextAuth(authOptions)

/**
 * Record only slow/aborted session requests. This is intentionally outside
 * NextAuth's auth flow and never changes the response or error handling.
 */
async function timedHandler(req: Request, context: unknown) {
  const startedAt = Date.now()
  const action = new URL(req.url).pathname.split('/').filter(Boolean).pop()

  try {
    return await handler(req, context as any)
  } finally {
    if (action === 'session') {
      const durationMs = Date.now() - startedAt
      const aborted = req.signal.aborted

      if (aborted || durationMs > 500) {
        logger.warn('auth', 'NextAuth session request slow or aborted', {
          durationMs,
          aborted,
          method: req.method,
        })
      }
    }
  }
}

export { timedHandler as GET, timedHandler as POST }
