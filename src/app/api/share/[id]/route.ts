import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
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

    // 只有完成的任务才能分享
    if (task.status !== "COMPLETED" || !task.resultImageUrl) {
      return NextResponse.json(
        { success: false, error: "试戴任务未完成或无结果" },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        id: task.id,
        type: (task as any).type || 'GLASSES', // Include type, default to GLASSES for old records
        userImageUrl: task.userImageUrl,
        itemImageUrl: (task as any).itemImageUrl || task.glassesImageUrl, // Support both field names
        glassesImageUrl: task.glassesImageUrl, // Keep for backward compatibility
        resultImageUrl: task.resultImageUrl,
        createdAt: task.createdAt,
        user: {
          name: task.user.name,
          image: task.user.image
        }
      }
    })

  } catch (error) {
    console.error("获取分享内容失败:", error)
    return NextResponse.json(
      { success: false, error: "服务器内部错误" },
      { status: 500 }
    )
  }
}
