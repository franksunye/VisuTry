import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { PUBLIC_CATALOG_CACHE_CONTROL } from '@/lib/public-http-cache'

function toPublicFrame(frame: {
  id: string
  name: string
  imageUrl: string
  category: string | null
  brand: string | null
  model: string | null
  style: string | null
  material: string | null
  color: string | null
  faceShapes: Array<{ faceShape: { name: string; displayName: string } }>
  categories: Array<{ category: { name: string; displayName: string } }>
}) {
  return {
    id: frame.id,
    name: frame.name,
    imageUrl: frame.imageUrl,
    category: frame.category,
    brand: frame.brand,
    model: frame.model,
    style: frame.style,
    material: frame.material,
    color: frame.color,
    faceShapes: frame.faceShapes.map((item) => ({
      name: item.faceShape.name,
      displayName: item.faceShape.displayName,
    })),
    categories: frame.categories.map((item) => ({
      name: item.category.name,
      displayName: item.category.displayName,
    })),
  }
}

export async function GET() {
  try {
    const frames = await prisma.glassesFrame.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        imageUrl: true,
        category: true,
        brand: true,
        model: true,
        style: true,
        material: true,
        color: true,
        faceShapes: {
          select: {
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
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({
      success: true,
      data: frames.map(toPublicFrame),
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
