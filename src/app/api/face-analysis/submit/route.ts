import { NextRequest, NextResponse } from 'next/server'
import { requireAuthWithUser } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma'
import { getRequestContext, getRequestLanguageContext, logger } from '@/lib/logger'
import { checkUserQuota, deductUserQuota, getNextQuotaSource } from '@/lib/quota'
import { serializeFaceAnalysisTask, submitFaceAnalysis } from '@/lib/face-analysis-service'
import { normalizeGeometryAnalysis } from '@/lib/face-landmark-metrics'
import { isValidLocale } from '@/i18n'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function POST(request: NextRequest) {
  const ctx = getRequestContext(request)
  const languageContext = getRequestLanguageContext(request)
  try {
    const auth = await requireAuthWithUser()
    if (!auth.ok) return auth.response
    const user = auth.user

    const quotaCheck = checkUserQuota(user)
    if (!quotaCheck.allowed) {
      logger.warn('face-analysis', 'Face analysis quota denied', {
        userId: user.id,
        reason: quotaCheck.reason,
      }, ctx)
      return NextResponse.json({ success: false, error: quotaCheck.reason }, { status: 403 })
    }

    const quotaSource = getNextQuotaSource(user)
    if (!quotaSource) {
      logger.warn('face-analysis', 'Face analysis quota denied', {
        userId: user.id,
        reason: 'No remaining quota',
      }, ctx)
      return NextResponse.json({ success: false, error: 'No remaining quota' }, { status: 403 })
    }

    const formData = await request.formData()
    const userImageFile = formData.get('userImage') as File | null
    const clientSubmissionId = (formData.get('clientSubmissionId') as string) || undefined
    const rawSiteLocale = formData.get('siteLocale')
    const siteLocale = typeof rawSiteLocale === 'string' && isValidLocale(rawSiteLocale)
      ? rawSiteLocale
      : undefined
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
      ...(siteLocale ? { site_locale: siteLocale } : {}),
    }, languageContext)

    const result = await submitFaceAnalysis(user, userImageFile, {
      clientSubmissionId,
      reportUnlocked: quotaSource !== 'free_trial',
      geometry,
    })

    if (result.status === 'completed') {
      await deductUserQuota(user.id, ctx)
      logger.info('face-analysis', 'Face analysis submit completed', {
        userId: user.id,
        taskId: result.taskId,
        quotaSource,
        reportUnlocked: result.reportUnlocked,
        detectedShape: result.basicResult?.faceShape,
        ...(siteLocale ? { site_locale: siteLocale } : {}),
      }, languageContext)
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
