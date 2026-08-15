import { NextResponse } from 'next/server'
import { getFrameById } from '@/data/glasses'

export const dynamic = 'force-dynamic'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const frame = await getFrameById(params.id)

    if (!frame) {
      return NextResponse.json(
        { success: false, error: 'Frame not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: frame,
    })
  } catch (error) {
    console.error('Error fetching frame:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch frame' },
      { status: 500 }
    )
  }
}
