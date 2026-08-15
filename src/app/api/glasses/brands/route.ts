import { NextResponse } from 'next/server'
import { getActiveBrands } from '@/data/glasses'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const brandList = await getActiveBrands()

    return NextResponse.json({
      success: true,
      data: brandList,
    })
  } catch (error) {
    console.error('Error fetching brands:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch brands' },
      { status: 500 }
    )
  }
}
