import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getRequestContext, logger } from '@/lib/logger'
import { checkUserQuota, deductUserQuota, getNextQuotaSource } from '@/lib/quota'
import { serializeFaceAnalysisTask, submitFaceAnalysis } from '@/lib/face-analysis-service'
import { normalizeGeometryAnalysis } from '@/lib/face-landmark-metrics'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function POST(request: NextRequest) {
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

    const quotaCheck = checkUserQuota(user)
    if (!quotaCheck.allowed) {
      return NextResponse.json({ success: false, error: quotaCheck.reason }, { status: 403 })
    }

    const quotaSource = getNextQuotaSource(user)
    if (!quotaSource) {
      return NextResponse.json({ success: false, error: 'No remaining quota' }, { status: 403 })
    }

    const formData = await request.formData()
    const userImageFile = formData.get('userImage') as File | null
    const clientSubmissionId = (formData.get('clientSubmissionId') as string) || undefined
    const rawGeometry = formData.get('geometryAnalysis')
    const geometry = typeof rawGeometry === 'string'
      ? normalizeGeometryAnalysis(safeParseJson(rawGeometry))
      : null

    if (!userImageFile) {
      return NextResponse.json(
        { success: false, error: 'User image is required' },
        { status: 400 }
      )
    }

    logger.info('face-analysis', 'Submit request received', {
      userId: user.id,
      clientSubmissionId,
      fileName: userImageFile.name,
      fileSize: userImageFile.size,
      geometryStatus: geometry?.status,
      geometryQuality: geometry?.qualityScore,
    }, ctx)

    const result = await submitFaceAnalysis(user, userImageFile, {
      clientSubmissionId,
      reportUnlocked: quotaSource !== 'free_trial',
      geometry,
    })

    if (result.status === 'completed') {
      await deductUserQuota(user.id, ctx)
    }

    const task = await prisma.faceAnalysisTask.findUnique({ where: { id: result.taskId } })

    return NextResponse.json({
      success: true,
      data: {
        ...result,
        task: task ? serializeFaceAnalysisTask(task) : undefined,
      },
    })
  } catch (error) {
    logger.error('face-analysis', 'Submit API error', error as Error, ctx)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    )
  }
}

function safeParseJson(value: string): unknown {
  try {
    return JSON.parse(value)
  } catch {
    return null
  }
}
