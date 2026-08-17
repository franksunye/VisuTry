import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { PUBLIC_CATALOG_CACHE_CONTROL } from '@/lib/public-http-cache'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const frame = await prisma.glassesFrame.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        name: true,
        description: true,
        imageUrl: true,
        category: true,
        brand: true,
        model: true,
        style: true,
        material: true,
        color: true,
        price: true,
        isActive: true,
        faceShapes: {
          select: {
            reason: true,
            faceShape: {
              select: { name: true, displayName: true },
            },
          },
        },
        categories: {
          select: {
            category: {
              select: { name: true, displayName: true },
            },
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
    }, {
      headers: { 'Cache-Control': PUBLIC_CATALOG_CACHE_CONTROL },
    })
  } catch (error) {
    console.error('Error fetching frame:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch frame' },
      { status: 500 }
    )
  }
}
