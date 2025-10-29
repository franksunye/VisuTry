import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const frame = await prisma.glassesFrame.findUnique({
      where: { id: params.id },
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
    })

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

