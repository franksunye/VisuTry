import { NextRequest, NextResponse } from 'next/server'
import { TaskStatus } from '@prisma/client'
import { requireAuth } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma'
import { getRequestContext, logger } from '@/lib/logger'
import { serveFaceAnalysisSourcePhoto } from '@/lib/face-analysis-source-photo'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

type RouteParams = { params: Promise<{ id: string }> }

export async function GET(request: NextRequest, props: RouteParams) {
  const params = await props.params;
  const ctx = getRequestContext(request)

  try {
    const auth = await requireAuth()
    if (!auth.ok) return auth.response

    const task = await prisma.faceAnalysisTask.findFirst({
      where: {
        id: params.id,
        userId: auth.userId,
        status: TaskStatus.COMPLETED,
        reportUnlocked: true,
      },
      select: { userImageUrl: true, metadata: true, expiresAt: true },
    })

    if (!task?.userImageUrl) {
      return NextResponse.json({ success: false, error: 'Photo not found' }, { status: 404 })
    }

    if (task.expiresAt && task.expiresAt.getTime() <= Date.now()) {
      return NextResponse.json({ success: false, error: 'Photo not found' }, { status: 404 })
    }

    return await serveFaceAnalysisSourcePhoto(task, { respectBusinessExpiry: true })
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    logger.error('face-analysis', 'Failed to restore source photo', err, ctx)
    return NextResponse.json(
      { success: false, error: 'Face Analysis photo is unavailable' },
      { status: 502 },
    )
  }
}
