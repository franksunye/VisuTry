import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const frames = await prisma.glassesFrame.findMany({
      where: { isActive: true },
      include: {
        faceShapes: {
          include: {
            faceShape: true,
          },
        },
        categories: {
          include: {
            category: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

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

