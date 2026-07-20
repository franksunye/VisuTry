import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { revalidateTag } from 'next/cache'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getRemainingQuotaCount } from '@/lib/quota'
import { getRequestContext, logger } from '@/lib/logger'
import {
  getTopPickPresetById,
  type StyleIntent,
  type StyleOccasion,
} from '@/config/glasses-presets'
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
    const styleIntent = formData.get('styleIntent')
    const occasion = formData.get('occasion')
    const category = formData.get('category')
    const lookKey = formData.get('lookKey')
    const batchSize = Number(formData.get('batchSize') || 4)
    const batchIndex = Number(formData.get('batchIndex') || 0)

    if (!(userImage instanceof File) || userImage.size === 0) {
      return NextResponse.json({ success: false, error: 'A front-facing photo is required' }, { status: 400 })
    }
    if (typeof framePresetId !== 'string' || typeof batchId !== 'string' || typeof styleIntent !== 'string') {
      return NextResponse.json({ success: false, error: 'Missing Style Explorer task data' }, { status: 400 })
    }

    const preset = getTopPickPresetById(framePresetId)
    if (!preset?.isStyleExplorerEnabled) {
      return NextResponse.json({ success: false, error: 'Invalid Style Explorer frame preset' }, { status: 400 })
    }
    if (getRemainingQuotaCount(user) < 1) {
      return NextResponse.json({ success: false, error: 'No credits remaining' }, { status: 403 })
    }

    const task = await submitCompareFrameTask({
      user,
      userImageFile: userImage,
      preset,
      index: Number.isFinite(batchIndex) ? batchIndex : 0,
      batchMetadata: {
        batchId,
        source: 'style-explorer',
        serviceType: 'grsai',
        styleIntent: styleIntent as StyleIntent,
        occasion: typeof occasion === 'string' && occasion ? occasion as StyleOccasion : undefined,
        category,
        lookKey: typeof lookKey === 'string' ? lookKey : `${styleIntent}-${preset.id}`,
        batchSize: Number.isFinite(batchSize) ? batchSize : 4,
        submissionStaggerMs: FRAME_COMPARE_SUBMISSION_STAGGER_MS,
      },
    })

    revalidateTag(`user-${user.id}`)
    return NextResponse.json({ success: true, data: { batchId, task } })
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    logger.error('api', 'Style Explorer frame dispatch failed', err, ctx)
    return NextResponse.json({ success: false, error: err.message || 'Internal server error' }, { status: 500 })
  }
}
