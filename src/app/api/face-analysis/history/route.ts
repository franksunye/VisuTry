import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api-auth-runtime'
import { getRequestContext, logger } from '@/lib/logger'
import { serializeFaceAnalysisTask } from '@/lib/face-analysis-serialization-cloudflare'
import { getFaceAnalysisHistory } from '@/data/protected-reads-cloudflare'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const ctx = getRequestContext(request)
  try {
    const auth = await requireAuth()
    if (!auth.ok) return auth.response
    const userId = auth.userId

    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '10', 10)))
    const skip = (page - 1) * limit

    const result = await getFaceAnalysisHistory({ userId, page, limit })
    const tasks = result.tasks
    const total = result.total

    const data = tasks.map((task) => serializeFaceAnalysisTask(task))

    return NextResponse.json({
      success: true,
      data: {
        tasks: data,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    })
  } catch (error) {
    logger.error('face-analysis', 'History API error', error as Error, ctx)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
