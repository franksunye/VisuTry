import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      )
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '20', 10)
    const search = searchParams.get('search') || ''

    try {
      const offset = (page - 1) * limit

      // Build where clause
      const where = search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' as const } },
              { brand: { contains: search, mode: 'insensitive' as const } },
              { model: { contains: search, mode: 'insensitive' as const } },
            ],
          }
        : {}

      // Fetch frames and total count
      const [frames, total] = await Promise.all([
        prisma.glassesFrame.findMany({
          where,
          take: limit,
          skip: offset,
          orderBy: { createdAt: 'desc' },
        }),
        prisma.glassesFrame.count({ where }),
      ])

      const totalPages = Math.ceil(total / limit)

      return NextResponse.json({
        frames,
        total,
        page,
        totalPages,
      })
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      console.error('Error fetching frames:', error)
      logger.error('api', 'Error fetching frames', err, { page, limit })
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    console.error('Error in GET handler:', error)
    logger.error('api', 'Error in GET handler', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // @ts-ignore
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const {
      id,
      name,
      description,
      imageUrl,
      brand,
      model,
      category,
      style,
      material,
      color,
      price,
      isActive,
    } = body

    try {
      // Validation
      if (!id || !name) {
        return NextResponse.json(
          { error: 'ID and name are required' },
          { status: 400 }
        )
      }

      // Check if ID already exists
      const existing = await prisma.glassesFrame.findUnique({
        where: { id },
      })

      if (existing) {
        return NextResponse.json(
          { error: 'Frame with this ID already exists' },
          { status: 409 }
        )
      }

      // Create frame
      const frame = await prisma.glassesFrame.create({
        data: {
          id,
          name,
          description: description || null,
          imageUrl: imageUrl || null,
          brand: brand || null,
          model: model || null,
          category: category || null,
          style: style || null,
          material: material || null,
          color: color || null,
          price: price ? parseFloat(price) : null,
          isActive: isActive !== undefined ? isActive : true,
        },
      })

      logger.info('api', 'Frame created successfully', { frameId: frame.id, name: frame.name })
      return NextResponse.json({
        success: true,
        frame,
      })
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      console.error('Error creating frame:', error)
      logger.error('api', 'Error creating frame', err, { frameId: id, name })
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    console.error('Error in POST handler:', error)
    logger.error('api', 'Error in POST handler', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

