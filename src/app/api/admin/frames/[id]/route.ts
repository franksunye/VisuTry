import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
        { error: 'Frame not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      frame,
    })
  } catch (error) {
    console.error('Error fetching frame:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Validation
    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      )
    }

    // Check if frame exists
    const existing = await prisma.glassesFrame.findUnique({
      where: { id: params.id },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Frame not found' },
        { status: 404 }
      )
    }

    // Update frame
    const frame = await prisma.glassesFrame.update({
      where: { id: params.id },
      data: {
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
        isActive: isActive !== undefined ? isActive : existing.isActive,
      },
    })

    return NextResponse.json({
      success: true,
      frame,
    })
  } catch (error) {
    console.error('Error updating frame:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Check if frame exists
    const existing = await prisma.glassesFrame.findUnique({
      where: { id: params.id },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Frame not found' },
        { status: 404 }
      )
    }

    // Delete frame (cascade will handle related records)
    await prisma.glassesFrame.delete({
      where: { id: params.id },
    })

    return NextResponse.json({
      success: true,
      message: 'Frame deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting frame:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

