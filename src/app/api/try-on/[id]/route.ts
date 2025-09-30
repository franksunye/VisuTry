import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 检查用户认证
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: "未授权访问" },
        { status: 401 }
      )
    }

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
    if (task.userId !== session.user.id) {
      return NextResponse.json(
        { success: false, error: "无权访问此任务" },
        { status: 403 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        id: task.id,
        status: task.status.toLowerCase(),
        userImageUrl: task.userImageUrl,
        glassesImageUrl: task.glassesImageUrl,
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
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: "未授权访问" },
        { status: 401 }
      )
    }

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
    if (task.userId !== session.user.id) {
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
