import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/api-auth'

/**
 * Generic URL deletion cannot prove the file is unreferenced by Consumer,
 * Merchant, StoreAsset, Face Analysis or in-flight workflows. Fail closed.
 * Task/asset-specific retention jobs remain the supported deletion path.
 */
export async function POST() {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response
  return NextResponse.json({
    success: false,
    error: 'Generic Blob deletion is disabled; use lifecycle retention cleanup',
  }, { status: 409 })
}
