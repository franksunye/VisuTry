import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/api-auth-runtime"
import { isMockMode } from "@/lib/mocks"
import { MockDatabase } from "@/lib/mocks/database"
import { getConsumerTryOnHistory } from '@/data/protected-reads-cloudflare'
import { tryOnClientMetadata, tryOnMediaUrls } from '@/lib/tryon-media'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // 检查用户认证
    const auth = await requireAuth()
    if (!auth.ok) return auth.response
    const userId = auth.userId

    // 获取查询参数
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "10")
    const status = searchParams.get("status") // 可选的状态过滤

    const skip = (page - 1) * limit

    // 获取试戴历史记录
    let tasks, total

    if (isMockMode) {
      console.log('🧪 Mock Try-On History: Using mock database')
      const allTasks = await MockDatabase.findUserTryOnTasks(userId)

      // 应用状态过滤
      let filteredTasks = allTasks
      if (status) {
        filteredTasks = allTasks.filter(task => task.status.toLowerCase() === status.toLowerCase())
      }

      // 应用分页
      total = filteredTasks.length
      tasks = filteredTasks
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(skip, skip + limit)
    } else {
      const result = await getConsumerTryOnHistory({ userId, page, limit, status: status ? status.toUpperCase() : null })
      tasks = result.tasks
      total = result.total
    }

    // 计算分页信息
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
