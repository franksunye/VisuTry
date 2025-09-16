import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { mockGlassesFrames, isMockMode } from "@/lib/mocks"

export async function GET() {
  try {
    // Use mock data in test mode
    if (isMockMode) {
      console.log('🧪 Mock Frames API: Returning mock glasses frames')
      return NextResponse.json({
        success: true,
        data: mockGlassesFrames
      })
    }

    const frames = await prisma.glassesFrame.findMany({
      where: {
        isActive: true
      },
      orderBy: {
        createdAt: "desc"
      }
    })

    return NextResponse.json({
      success: true,
      data: frames
    })
  } catch (error) {
    console.error("Failed to fetch glasses frames:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch glasses frames" },
      { status: 500 }
    )
  }
}

// Create new glasses frame (admin function)
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, description, imageUrl, category, brand } = body

    if (!name || !imageUrl) {
      return NextResponse.json(
        { success: false, error: "Name and image URL are required" },
        { status: 400 }
      )
    }

    const frame = await prisma.glassesFrame.create({
      data: {
        name,
        description,
        imageUrl,
        category,
        brand,
        isActive: true
      }
    })

    return NextResponse.json({
      success: true,
      data: frame
    })
  } catch (error) {
    console.error("Failed to create glasses frame:", error)
    return NextResponse.json(
      { success: false, error: "Failed to create glasses frame" },
      { status: 500 }
    )
  }
}
