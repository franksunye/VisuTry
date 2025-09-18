import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(request: Request) {
  try {
    // 简单的安全检查 - 在生产环境中应该使用更强的认证
    const { searchParams } = new URL(request.url)
    const adminKey = searchParams.get('key')
    
    if (adminKey !== 'seed-database-2024') {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    console.log('Starting database seeding...')

    // 眼镜框架数据
    const frames = [
      {
        name: "Classic Black Frame",
        description: "Classic black square frame glasses, suitable for all face shapes",
        imageUrl: "https://images.unsplash.com/photo-1574258495973-f010dfbb5371?w=400&h=400&fit=crop",
        category: "Square",
        brand: "Classic",
        isActive: true
      },
      {
        name: "Round Metal Frame",
        description: "Vintage style round metal frame glasses",
        imageUrl: "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=400&h=400&fit=crop",
        category: "Round",
        brand: "Vintage",
        isActive: true
      },
      {
        name: "Fashion Cat Eye",
        description: "Elegant cat eye shape, showcasing feminine charm",
        imageUrl: "https://images.unsplash.com/photo-1508296695146-257a814070b4?w=400&h=400&fit=crop",
        category: "Cat Eye",
        brand: "Fashion",
        isActive: true
      },
      {
        name: "Sport Glasses",
        description: "Lightweight sport glasses, perfect for active lifestyle",
        imageUrl: "https://images.unsplash.com/photo-1473496169904-658ba7c44d8a?w=400&h=400&fit=crop",
        category: "Sport",
        brand: "Sport",
        isActive: true
      },
      {
        name: "Clear Frame Glasses",
        description: "Fashionable clear frame design, subtle and elegant",
        imageUrl: "https://images.unsplash.com/photo-1506629905607-d9c297d3d45b?w=400&h=400&fit=crop",
        category: "Square",
        brand: "Modern",
        isActive: true
      },
      {
        name: "Vintage Round Frame",
        description: "Classic vintage round frame design with artistic flair",
        imageUrl: "https://images.unsplash.com/photo-1509695507497-903c140c43b0?w=400&h=400&fit=crop",
        category: "Round",
        brand: "Retro",
        isActive: true
      },
      {
        name: "Oversized Sunglasses",
        description: "Fashionable oversized sunglasses with UV protection",
        imageUrl: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400&h=400&fit=crop",
        category: "Sunglasses",
        brand: "Sun",
        isActive: true
      },
      {
        name: "Business Gold Frame",
        description: "Professional business gold frame glasses, showcasing taste",
        imageUrl: "https://images.unsplash.com/photo-1556306535-38febf6782e7?w=400&h=400&fit=crop",
        category: "Square",
        brand: "Business",
        isActive: true
      }
    ]

    // 检查是否已经有数据
    const existingFrames = await prisma.glassesFrame.count()
    
    if (existingFrames > 0) {
      return NextResponse.json({
        success: true,
        message: `Database already seeded with ${existingFrames} frames`,
        data: { existingFrames }
      })
    }

    // 创建眼镜框架数据
    const createdFrames = []
    for (const frame of frames) {
      const created = await prisma.glassesFrame.create({
        data: frame
      })
      createdFrames.push(created)
    }

    console.log('Database seeding completed!')

    return NextResponse.json({
      success: true,
      message: `Successfully seeded database with ${createdFrames.length} glasses frames`,
      data: {
        framesCreated: createdFrames.length,
        frames: createdFrames.map(f => ({ id: f.id, name: f.name, category: f.category }))
      }
    })

  } catch (error) {
    console.error("Database seeding failed:", error)
    return NextResponse.json(
      { 
        success: false, 
        error: "Database seeding failed",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}

// GET 方法用于检查数据库状态
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const adminKey = searchParams.get('key')
    
    if (adminKey !== 'seed-database-2024') {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    const frameCount = await prisma.glassesFrame.count()
    const userCount = await prisma.user.count()
    const taskCount = await prisma.tryOnTask.count()

    return NextResponse.json({
      success: true,
      data: {
        glassesFrames: frameCount,
        users: userCount,
        tryOnTasks: taskCount,
        databaseStatus: frameCount > 0 ? 'seeded' : 'empty'
      }
    })

  } catch (error) {
    console.error("Database status check failed:", error)
    return NextResponse.json(
      { 
        success: false, 
        error: "Database status check failed",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}
