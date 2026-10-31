import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/api-auth'
import {
  getBlobStoreConfigs,
  scanBlobStore,
  summarizeBlobStore,
} from '@/lib/blob/admin-inventory'

export const dynamic = 'force-dynamic'

export async function GET() {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response

  const stores = await Promise.all(getBlobStoreConfigs().map(async (config) => {
    if (!config.token) {
      return {
        scope: config.scope,
        label: config.label,
        configured: false,
        complete: false,
        totalFiles: 0,
        totalSize: 0,
        totalSizeMB: '0.00',
        error: config.unavailableReason,
      }
    }
    try {
      return summarizeBlobStore(config, await scanBlobStore(config))
    } catch {
      // One failing store must not hide the healthy store's inventory.
      return {
        scope: config.scope,
        label: config.label,
        configured: true,
        complete: false,
        totalFiles: 0,
        totalSize: 0,
        totalSizeMB: '0.00',
        error: 'Unable to read this Blob store',
      }
    }
  }))
  const totalFiles = stores.reduce((sum, store) => sum + store.totalFiles, 0)
  const totalSize = stores.reduce((sum, store) => sum + store.totalSize, 0)
  const complete = stores.every(store => store.complete)

  return NextResponse.json({
    success: true,
    data: {
      totalFiles,
      totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2),
      complete,
      stores,
    },
  }, { headers: { 'Cache-Control': 'private, no-store' } })
}
