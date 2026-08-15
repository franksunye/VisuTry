import { NextResponse } from 'next/server'
import { getActiveFrames } from '@/data/glasses'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const frames = await getActiveFrames()

    return NextResponse.json({
      success: true,
      data: frames,
    })
  } catch (error) {
    console.error('Error fetching frames:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch frames' },
      { status: 500 }
    )
  }
}
