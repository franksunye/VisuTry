import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import {
  cleanupExpiredStoreAssets,
  cleanupStoreOrphanBlobs,
  createStoreRuntime,
} from '@/modules/store/application'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 300

/**
 * Cron: StoreAsset + orphan Blob retention (blob-first, retryable, blocked slow-retry).
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    logger.warn('api', 'Unauthorized cron access attempt', {
      endpoint: 'cleanup-store-assets',
    })
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()
  try {
    const runtime = createStoreRuntime()
    const assets = await cleanupExpiredStoreAssets({
      assets: runtime.assets,
      now,
      limit: 100,
      maxRounds: 5,
    })
    const orphans = await cleanupStoreOrphanBlobs({ now, limit: 100 })

    const results = { assets, orphans }
    logger.info('api', 'Cleanup store assets cron completed', results)

    return NextResponse.json({
      success: true,
      timestamp: now.toISOString(),
      results,
    })
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    logger.error('api', 'Cleanup store assets cron failed', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
