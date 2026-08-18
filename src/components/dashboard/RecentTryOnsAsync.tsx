import { prisma } from "@/lib/prisma"
import { RecentTryOns } from "./RecentTryOns"
import { perfLogger } from "@/lib/performance-logger"
import { tryOnMediaPath } from '@/lib/tryon-media'

interface RecentTryOnsAsyncProps {
  userId: string
}

/**
 * 异步加载最近试戴记录组件
 * 用于 Suspense 流式渲染
 */
export async function RecentTryOnsAsync({ userId }: RecentTryOnsAsyncProps) {
  perfLogger.start('dashboard-async:recent-tryons')

  try {
    const recentTryOns = await perfLogger.measure(
      'dashboard-async:getUserTasks',
      () => prisma.tryOnTask.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 6,
        select: {
          id: true,
          status: true,
          userImageUrl: true,
          resultImageUrl: true,
          createdAt: true,
          metadata: true,
        },
      }),
      { userId }
    )

    const protectedTryOns = recentTryOns.map((task) => ({
      ...task,
      userImageUrl: task.userImageUrl ? tryOnMediaPath(task.id, 'user') : '',
      resultImageUrl: task.resultImageUrl ? tryOnMediaPath(task.id, 'result') : null,
    }))

    perfLogger.end('dashboard-async:recent-tryons', {
      count: protectedTryOns.length,
    })

    return <RecentTryOns tryOns={protectedTryOns} />
  } catch (error) {
    perfLogger.end('dashboard-async:recent-tryons', { error: true })
    console.error('Error loading recent try-ons:', error)

    return <RecentTryOns tryOns={[]} />
  }
}
