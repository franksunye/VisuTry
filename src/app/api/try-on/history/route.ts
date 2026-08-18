import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/api-auth-runtime"
import { isMockMode } from "@/lib/mocks"
import { MockDatabase } from "@/lib/mocks/database"
import { getConsumerTryOnHistory } from '@/data/protected-reads-cloudflare'
import { tryOnClientMetadata, tryOnMediaUrls } from '@/lib/tryon-media'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth()
    if (!auth.ok) return auth.response
    const userId = auth.userId

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "10")
    const status = searchParams.get("status")
    const skip = (page - 1) * limit

    let tasks, total

    if (isMockMode) {
      console.log('🧪 Mock Try-On History: Using mock database')
      const allTasks = await MockDatabase.findUserTryOnTasks(userId)
      let filteredTasks = allTasks
      if (status) {
        filteredTasks = allTasks.filter(task => task.status.toLowerCase() === status.toLowerCase())
      }
      total = filteredTasks.length
      tasks = filteredTasks
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(skip, skip + limit)
    } else {
      const result = await getConsumerTryOnHistory({
        userId,
        page,
        limit,
        status: status ? status.toUpperCase() : null,
      })
      tasks = result.tasks
      total = result.total
    }

    const totalPages = Math.ceil(total / limit)
    const hasNext = page < totalPages
    const hasPrev = page > 1

    return NextResponse.json({
      success: true,
      data: {
        tasks: tasks.map((task: any) => {
          const media = tryOnMediaUrls(task)
          return {
            ...task,
            status: task.status.toLowerCase(),
            userImageUrl: media.userImageUrl,
            itemImageUrl: media.itemImageUrl,
            glassesImageUrl: media.glassesImageUrl,
            resultImageUrl: media.resultImageUrl,
            metadata: tryOnClientMetadata(task.metadata),
          }
        }),
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext,
          hasPrev,
        },
      },
    })
  } catch (error) {
    console.error("获取试戴历史失败:", error)
    return NextResponse.json(
      { success: false, error: "服务器内部错误" },
      { status: 500 }
    )
  }
}
