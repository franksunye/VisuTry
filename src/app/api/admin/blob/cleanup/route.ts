import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/api-auth'

/**
 * The legacy orphan sweep only checked a subset of database URL columns and
 * could delete active Merchant/Face Analysis/private media. Do not expose a
 * destructive public-store-wide sweep without authoritative lifecycle data.
 */
export async function POST() {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response
  return NextResponse.json({
    success: false,
    error: 'Generic orphan cleanup is disabled; use lifecycle retention cleanup',
  }, { status: 409 })
}
