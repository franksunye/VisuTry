import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

interface ImportFrame {
  id: string
  name: string
  description?: string
  imageUrl?: string
  brand?: string
  model?: string
  category?: string
  style?: string
  material?: string
  color?: string
  price?: number
  isActive?: boolean
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
    const { frames, mode = 'create' } = body

    if (!frames || !Array.isArray(frames)) {
      return NextResponse.json(
        { error: 'Invalid request - frames array required' },
        { status: 400 }
      )
    }

    if (frames.length === 0) {
      return NextResponse.json(
        { error: 'No frames to import' },
        { status: 400 }
      )
    }

    if (frames.length > 1000) {
      return NextResponse.json(
        { error: 'Too many frames - maximum 1000 per import' },
        { status: 400 }
      )
    }

    const results = {
      total: frames.length,
      created: 0,
      updated: 0,
      skipped: 0,
      errors: [] as string[],
    }

    for (const frameData of frames) {
      try {
        // Validation
        if (!frameData.id || !frameData.name) {
          results.errors.push(`Frame missing required fields (id or name): ${JSON.stringify(frameData)}`)
          results.skipped++
          continue
        }

        const data = {
          id: frameData.id,
          name: frameData.name,
          description: frameData.description || null,
          imageUrl: frameData.imageUrl || null,
          brand: frameData.brand || null,
          model: frameData.model || null,
          category: frameData.category || null,
          style: frameData.style || null,
          material: frameData.material || null,
          color: frameData.color || null,
          price: frameData.price ? parseFloat(String(frameData.price)) : null,
          isActive: frameData.isActive !== undefined ? frameData.isActive : true,
        }

        if (mode === 'upsert') {
          // Upsert: create or update
          await prisma.glassesFrame.upsert({
            where: { id: frameData.id },
            create: data,
            update: {
              name: data.name,
              description: data.description,
              imageUrl: data.imageUrl,
              brand: data.brand,
              model: data.model,
              category: data.category,
              style: data.style,
              material: data.material,
              color: data.color,
              price: data.price,
              isActive: data.isActive,
            },
          })
          
          // Check if it was created or updated
          const existing = await prisma.glassesFrame.findUnique({
            where: { id: frameData.id },
            select: { createdAt: true, updatedAt: true },
          })
          
          if (existing && existing.createdAt.getTime() === existing.updatedAt.getTime()) {
            results.created++
          } else {
            results.updated++
          }
        } else {
          // Create only mode
          const existing = await prisma.glassesFrame.findUnique({
            where: { id: frameData.id },
          })

          if (existing) {
            results.errors.push(`Frame with ID ${frameData.id} already exists`)
            results.skipped++
            continue
          }

          await prisma.glassesFrame.create({
            data,
          })
          results.created++
        }
      } catch (error: any) {
        results.errors.push(`Error processing frame ${frameData.id}: ${error.message}`)
        results.skipped++
      }
    }

    return NextResponse.json({
      success: true,
      results,
    })
  } catch (error) {
    console.error('Error importing frames:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

