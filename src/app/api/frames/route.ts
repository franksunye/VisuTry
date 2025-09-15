import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
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
    console.error("获取眼镜框架失败:", error)
    return NextResponse.json(
      { success: false, error: "获取眼镜框架失败" },
      { status: 500 }
    )
  }
}

// 创建新的眼镜框架（管理员功能）
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, description, imageUrl, category, brand } = body

    if (!name || !imageUrl) {
      return NextResponse.json(
        { success: false, error: "名称和图片URL是必需的" },
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
    console.error("创建眼镜框架失败:", error)
    return NextResponse.json(
      { success: false, error: "创建眼镜框架失败" },
      { status: 500 }
    )
  }
}
