import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { PUBLIC_CATALOG_CACHE_CONTROL } from '@/lib/public-http-cache'

export async function GET() {
  try {
    const brands = await prisma.glassesFrame.findMany({
      where: { isActive: true },
      distinct: ['brand'],
      select: { brand: true },
      orderBy: { brand: 'asc' },
    })

    const brandList = brands
      .map(b => b.brand)
      .filter((brand): brand is string => brand !== null && brand !== undefined)

    return NextResponse.json({
      success: true,
      data: brandList,
    }, {
      headers: { 'Cache-Control': PUBLIC_CATALOG_CACHE_CONTROL },
    })
  } catch (error) {
    console.error('Error fetching brands:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch brands' },
      { status: 500 }
    )
  }
}
