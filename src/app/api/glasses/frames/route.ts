import { NextResponse } from 'next/server'
import { getActiveFrames } from '@/data/glasses'
import { PUBLIC_CATALOG_CACHE_CONTROL } from '@/lib/public-http-cache'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const frames = await getActiveFrames()

    return NextResponse.json({
      success: true,
      data: frames,
    }, {
      headers: { 'Cache-Control': PUBLIC_CATALOG_CACHE_CONTROL },
    })
  } catch (error) {
    console.error('Error fetching frames:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch frames' },
      { status: 500 }
    )
  }
}
