import { NextResponse } from 'next/server'
import { getFaceShapes } from '@/data/glasses'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const shapes = await getFaceShapes()

    return NextResponse.json({
      success: true,
      data: shapes,
    })
  } catch (error) {
    console.error('Error fetching face shapes:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch face shapes' },
      { status: 500 }
    )
  }
}
