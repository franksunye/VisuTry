import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma'
import { getRequestContext, logger } from '@/lib/logger'
import { serveFaceAnalysisSourcePhoto } from '@/lib/face-analysis-source-photo'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

type RouteParams = { params: { id: string } }

export async function GET(request: NextRequest, { params }: RouteParams) {
  const ctx = getRequestContext(request)

  try {
    const auth = await requireAdmin()
    if (!auth.ok) return auth.response

    const task = await prisma.faceAnalysisTask.findUnique({
      where: { id: params.id },
      select: { userImageUrl: true, metadata: true, expiresAt: true },
    })

    if (!task?.userImageUrl) {
      return NextResponse.json({ success: false, error: 'Photo not found' }, { status: 404 })
    }

    return await serveFaceAnalysisSourcePhoto(task, { respectBusinessExpiry: false })
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    logger.error('face-analysis', 'Failed to restore admin source photo', err, ctx)
    return NextResponse.json(
      { success: false, error: 'Face Analysis photo is unavailable' },
      { status: 502 },
    )
  }
}
