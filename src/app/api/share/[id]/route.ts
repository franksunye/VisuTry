import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { publicTryOnShareResultPath } from "@/lib/tryon-media"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const taskId = params.id

    // 获取试戴任务
    const task = await prisma.tryOnTask.findUnique({
      where: { id: taskId },
      select: {
        id: true,
        type: true,
        status: true,
        resultImageUrl: true,
        createdAt: true,
        user: {
          select: {
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
        // This legacy public DTO has no authenticated source-media capability.
        // Do not expose persisted storage references; the result uses the
        // existing public share reader instead.
        userImageUrl: null,
        itemImageUrl: null,
        glassesImageUrl: null,
        resultImageUrl: publicTryOnShareResultPath(task.id),
        createdAt: task.createdAt,
        user: {
          name: task.user?.name ?? null,
          image: task.user?.image ?? null
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
