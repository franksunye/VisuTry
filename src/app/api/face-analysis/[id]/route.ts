import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma'
import { getRequestContext, logger } from '@/lib/logger'
import { getFaceAnalysisTaskForUser } from '@/lib/face-analysis-service'

export const dynamic = 'force-dynamic'

type RouteParams = { params: { id: string } }

export async function GET(request: NextRequest, { params }: RouteParams) {
  const ctx = getRequestContext(request)
  try {
    const auth = await requireAuth()
    if (!auth.ok) return auth.response
    const userId = auth.userId

    const task = await getFaceAnalysisTaskForUser(params.id, userId)
    if (!task) {
      return NextResponse.json({ success: false, error: 'Task not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: task })
  } catch (error) {
    logger.error('face-analysis', 'GET task error', error as Error, ctx)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const ctx = getRequestContext(request)
  try {
    const auth = await requireAuth()
    if (!auth.ok) return auth.response
    const userId = auth.userId

    const deleted = await prisma.faceAnalysisTask.deleteMany({
      where: { id: params.id, userId: userId },
    })

    if (deleted.count === 0) {
      return NextResponse.json({ success: false, error: 'Task not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('face-analysis', 'DELETE task error', error as Error, ctx)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
