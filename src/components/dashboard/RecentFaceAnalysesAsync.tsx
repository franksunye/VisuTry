import { prisma } from '@/lib/prisma'
import { RecentFaceAnalyses } from './RecentFaceAnalyses'
import { perfLogger } from '@/lib/performance-logger'
import { serializeFaceAnalysisTask } from '@/lib/face-analysis-service'

interface RecentFaceAnalysesAsyncProps {
  userId: string
  locale: string
}

export async function RecentFaceAnalysesAsync({ userId, locale }: RecentFaceAnalysesAsyncProps) {
  perfLogger.start('dashboard-async:recent-face-analyses')

  try {
    const tasks = await perfLogger.measure(
      'dashboard-async:getFaceAnalysisTasks',
      () =>
        prisma.faceAnalysisTask.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
          take: 6,
          select: {
            id: true,
            status: true,
            userImageUrl: true,
            detectedShape: true,
            confidence: true,
            basicResult: true,
            fullResult: true,
            reportUnlocked: true,
            errorMessage: true,
            createdAt: true,
          },
        }),
      { userId }
    )

    perfLogger.end('dashboard-async:recent-face-analyses', { count: tasks.length })

    return (
      <RecentFaceAnalyses
        locale={locale}
        analyses={tasks.map((task) => serializeFaceAnalysisTask(task))}
      />
    )
  } catch (error) {
    perfLogger.end('dashboard-async:recent-face-analyses', { error: true })
    console.error('Error loading recent face analyses:', error)
    return <RecentFaceAnalyses locale={locale} analyses={[]} />
  }
}
