import { NextResponse } from 'next/server'
import { getCategories } from '@/data/glasses'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const categories = await getCategories()

    return NextResponse.json({
      success: true,
      data: categories,
    })
  } catch (error) {
    console.error('Error fetching categories:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch categories' },
      { status: 500 }
    )
  }
}
