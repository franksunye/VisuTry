import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    // 检查用户认证
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json(
        { success: false, error: "未授权访问" },
        { status: 401 }
      )
    }

    // 获取查询参数
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "10")
    const status = searchParams.get("status") // 可选的状态过滤

    const skip = (page - 1) * limit

    // 构建查询条件
    const where: any = {
      userId: session.user.id
    }

    if (status) {
      where.status = status.toUpperCase()
    }

    // 获取试戴历史记录
    const [tasks, total] = await Promise.all([
      prisma.tryOnTask.findMany({
        where,
        orderBy: {
          createdAt: "desc"
        },
        skip,
        take: limit,
        select: {
          id: true,
          status: true,
          userImageUrl: true,
          glassesImageUrl: true,
          resultImageUrl: true,
          errorMessage: true,
          createdAt: true,
          updatedAt: true,
          metadata: true
        }
      }),
      prisma.tryOnTask.count({ where })
    ])

    // 计算分页信息
    const totalPages = Math.ceil(total / limit)
    const hasNext = page < totalPages
    const hasPrev = page > 1

    return NextResponse.json({
      success: true,
      data: {
        tasks: tasks.map(task => ({
          ...task,
          status: task.status.toLowerCase()
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext,
          hasPrev
        }
      }
    })

  } catch (error) {
    console.error("获取试戴历史失败:", error)
    return NextResponse.json(
      { success: false, error: "服务器内部错误" },
      { status: 500 }
    )
  }
}
