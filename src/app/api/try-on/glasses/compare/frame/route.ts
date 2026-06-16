import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { revalidateTag } from 'next/cache'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getRemainingQuotaCount } from '@/lib/quota'
import { getRequestContext, logger } from '@/lib/logger'
import { getTopPickPresetById } from '@/config/glasses-presets'
import {
  FRAME_COMPARE_SUBMISSION_STAGGER_MS,
  submitCompareFrameTask,
} from '@/lib/compare-tryon-server'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function POST(request: NextRequest) {
  const ctx = getRequestContext(request)

  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized access' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({ where: { id: session.user.id } })
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })
    }

    const formData = await request.formData()
    const userImage = formData.get('userImage')
    const framePresetId = formData.get('framePresetId')
    const batchId = formData.get('batchId')
    const batchSize = Number(formData.get('batchSize') || 1)
    const batchIndex = Number(formData.get('batchIndex') || 0)
    const requiredCredits = Number(formData.get('requiredCredits') || 1)

    if (!(userImage instanceof File) || userImage.size === 0) {
      return NextResponse.json(
        { success: false, error: 'A front-facing photo is required' },
        { status: 400 },
      )
    }

    if (typeof framePresetId !== 'string' || !framePresetId) {
      return NextResponse.json(
        { success: false, error: 'framePresetId is required' },
        { status: 400 },
      )
    }

    if (typeof batchId !== 'string' || !batchId) {
      return NextResponse.json(
        { success: false, error: 'batchId is required' },
        { status: 400 },
      )
    }

    const preset = getTopPickPresetById(framePresetId)
    if (!preset) {
      return NextResponse.json(
        { success: false, error: 'Invalid frame preset' },
        { status: 400 },
      )
    }

    const remainingCredits = getRemainingQuotaCount(user)
    const effectiveRequiredCredits = Number.isFinite(requiredCredits) && requiredCredits > 0 ? requiredCredits : 1
    if (remainingCredits < effectiveRequiredCredits) {
      return NextResponse.json(
        {
          success: false,
          error: `Frame compare requires ${effectiveRequiredCredits} credits.`,
          data: {
            requiredCredits: effectiveRequiredCredits,
            remainingCredits,
          },
        },
        { status: 403 },
      )
    }

    const task = await submitCompareFrameTask({
      user,
      userImageFile: userImage,
      preset,
      index: Number.isFinite(batchIndex) ? batchIndex : 0,
      batchMetadata: {
        batchId,
        source: 'frame-compare',
        serviceType: 'grsai',
        batchSize: Number.isFinite(batchSize) ? batchSize : 1,
        submissionStaggerMs: FRAME_COMPARE_SUBMISSION_STAGGER_MS,
      },
    })

    revalidateTag(`user-${user.id}`)

    return NextResponse.json({
      success: true,
      data: {
        batchId,
        task,
      },
    })
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    logger.error('api', 'Frame compare frame dispatch failed', err, ctx)
    return NextResponse.json(
      { success: false, error: err.message || 'Internal server error' },
      { status: 500 },
    )
  }
}
