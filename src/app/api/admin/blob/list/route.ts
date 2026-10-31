import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/api-auth'
import { getBlobStoreConfigs, scanBlobStore } from '@/lib/blob/admin-inventory'

export const dynamic = 'force-dynamic'
const ITEMS_PER_PAGE = 50

export async function GET(request: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response

  const { searchParams } = new URL(request.url)
  const scope = searchParams.get('store') || 'public'
  const config = getBlobStoreConfigs().find(store => store.scope === scope)
  if (!config) {
    return NextResponse.json({ success: false, error: 'Invalid Blob store' }, { status: 400 })
  }
  if (!config.token) {
    return NextResponse.json(
      { success: false, error: config.unavailableReason },
      { status: 503 },
    )
  }

  const rawPage = Number(searchParams.get('page') || '1')
  const requestedPage = Number.isSafeInteger(rawPage) && rawPage > 0 ? rawPage : 1
  const search = (searchParams.get('search') || '').trim().toLowerCase().slice(0, 200)
  try {
    const inventory = await scanBlobStore(config)
    const filtered = inventory.blobs
      .filter(blob => !search || blob.pathname.toLowerCase().includes(search))
      .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())
    const total = filtered.length
    const totalPages = Math.max(1, Math.ceil(total / ITEMS_PER_PAGE))
    const currentPage = Math.min(requestedPage, totalPages)
    const files = filtered
      .slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)
      .map(blob => ({
        pathname: blob.pathname,
        sizeMB: (blob.size / (1024 * 1024)).toFixed(2),
        sizeKB: (blob.size / 1024).toFixed(1),
        uploadedAt: blob.uploadedAt,
        // Private objects must not be presented as public view links.
        url: scope === 'public' ? blob.url : null,
      }))
    return NextResponse.json({
      success: true,
      data: { files, total, totalPages, currentPage, complete: inventory.complete },
    }, { headers: { 'Cache-Control': 'private, no-store' } })
  } catch {
    return NextResponse.json(
      { success: false, error: 'Unable to list Blob files' },
      { status: 503 },
    )
  }
}
