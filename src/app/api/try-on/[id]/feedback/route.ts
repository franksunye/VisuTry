import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/api-auth"
import { prisma } from "@/lib/prisma"

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 检查用户认证
    const auth = await requireAuth()
    if (!auth.ok) return auth.response
    const userId = auth.userId

    const taskId = params.id
    const body = await request.json()
    const { liked, rating, comment } = body

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

    // 检查权限：只有任务创建者可以提供反馈
    if (task.userId !== userId) {
      return NextResponse.json(
        { success: false, error: "无权对此任务提供反馈" },
        { status: 403 }
      )
    }

    // 更新任务的反馈信息
    const metadata = task.metadata as any || {}
    metadata.feedback = {
      liked: liked,
      rating: rating,
      comment: comment,
      submittedAt: new Date().toISOString()
    }

    await prisma.tryOnTask.update({
      where: { id: taskId },
      data: {
        metadata: metadata
      }
    })

    return NextResponse.json({
      success: true,
      message: "反馈已保存，感谢您的评价！"
    })

  } catch (error) {
    console.error("保存反馈失败:", error)
    return NextResponse.json(
      { success: false, error: "服务器内部错误" },
      { status: 500 }
    )
  }
}
