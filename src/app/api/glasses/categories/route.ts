import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { PUBLIC_CATALOG_CACHE_CONTROL } from '@/lib/public-http-cache'

export async function GET() {
  try {
    const categories = await prisma.glassesCategory.findMany({
      orderBy: { name: 'asc' },
    })

    return NextResponse.json({
      success: true,
      data: categories,
    }, {
      headers: { 'Cache-Control': PUBLIC_CATALOG_CACHE_CONTROL },
    })
  } catch (error) {
    console.error('Error fetching categories:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch categories' },
      { status: 500 }
    )
  }
}
