import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const shapes = await prisma.faceShape.findMany({
      orderBy: { name: 'asc' },
    })

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

