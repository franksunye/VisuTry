import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getRequestContext, logger } from '@/lib/logger'
import { serializeFaceAnalysisTask } from '@/lib/face-analysis-service'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const ctx = getRequestContext(request)
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: 'Unauthorized access' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({ where: { email: session.user.email } })
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '10', 10)))
    const skip = (page - 1) * limit

    const [tasks, total] = await Promise.all([
      prisma.faceAnalysisTask.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
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
      prisma.faceAnalysisTask.count({ where: { userId: user.id } }),
    ])

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
