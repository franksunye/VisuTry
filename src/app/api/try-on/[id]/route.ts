import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/api-auth"
import { prisma } from "@/lib/prisma"

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 检查用户认证
    const auth = await requireAuth()
    if (!auth.ok) return auth.response
    const userId = auth.userId

    const taskId = params.id

    // 获取试戴任务
    const task = await prisma.tryOnTask.findUnique({
      where: { id: taskId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true
          }
        }
      }
    })

    if (!task) {
      return NextResponse.json(
        { success: false, error: "试戴任务不存在" },
        { status: 404 }
      )
    }

    // 检查权限：只有任务创建者可以查看
    if (task.userId !== userId) {
      return NextResponse.json(
        { success: false, error: "无权访问此任务" },
        { status: 403 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        id: task.id,
        type: (task as any).type || 'GLASSES', // Include type field, default to GLASSES for old records
        status: task.status.toLowerCase(),
        userImageUrl: task.userImageUrl,
        itemImageUrl: (task as any).itemImageUrl || task.glassesImageUrl, // Support both field names
        glassesImageUrl: task.glassesImageUrl, // Keep for backward compatibility
        resultImageUrl: task.resultImageUrl,
        errorMessage: task.errorMessage,
        createdAt: task.createdAt,
        updatedAt: task.updatedAt
      }
    })

  } catch (error) {
    console.error("获取试戴任务失败:", error)
    return NextResponse.json(
      { success: false, error: "服务器内部错误" },
      { status: 500 }
    )
  }
}

// 删除试戴任务
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 检查用户认证
    const auth = await requireAuth()
    if (!auth.ok) return auth.response
    const userId = auth.userId

    const taskId = params.id

    // 获取试戴任务
    const task = await prisma.tryOnTask.findUnique({
      where: { id: taskId }
    })

    if (!task) {
      return NextResponse.json(
        { success: false, error: "试戴任务不存在" },
        { status: 404 }
      )
    }

    // 检查权限：只有任务创建者可以删除
    if (task.userId !== userId) {
      return NextResponse.json(
        { success: false, error: "无权删除此任务" },
        { status: 403 }
      )
    }

    // 删除任务
    await prisma.tryOnTask.delete({
      where: { id: taskId }
    })

    return NextResponse.json({
      success: true,
      message: "试戴任务已删除"
    })

  } catch (error) {
    console.error("删除试戴任务失败:", error)
    return NextResponse.json(
      { success: false, error: "服务器内部错误" },
      { status: 500 }
    )
  }
}
