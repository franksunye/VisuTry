import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getRemainingQuotaCount } from '@/lib/quota'
import { getRequestContext, logger } from '@/lib/logger'
import {
  getTopPickPresetById,
  type StyleIntent,
  type StyleOccasion,
} from '@/config/glasses-presets'
import type { StyleExplorerCategoryFilter } from '@/lib/style-explorer/types'
import { getStyleLookCopy } from '@/lib/style-explorer/look-copy'
import { FRAME_COMPARE_SUBMISSION_STAGGER_MS } from '@/lib/compare-tryon-server'

export const dynamic = 'force-dynamic'
export const maxDuration = 10

const STYLE_INTENTS = new Set<StyleIntent>(['professional', 'minimal', 'classic', 'creative', 'bold', 'vacation'])
const OCCASIONS = new Set<StyleOccasion>(['everyday', 'work', 'weekend', 'outdoor'])
const CATEGORIES = new Set<StyleExplorerCategoryFilter>(['all', 'optical', 'sunglasses'])

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

    const body = await request.json()
    const styleIntent = body.styleIntent as StyleIntent
    const occasion = body.occasion as StyleOccasion | undefined
    const category = body.category as StyleExplorerCategoryFilter
    const presetIds = Array.from(new Set(Array.isArray(body.presetIds) ? body.presetIds : []))
      .filter((id): id is string => typeof id === 'string')

    if (!STYLE_INTENTS.has(styleIntent) || !CATEGORIES.has(category) || (occasion && !OCCASIONS.has(occasion))) {
      return NextResponse.json({ success: false, error: 'Invalid Style Explorer configuration' }, { status: 400 })
    }
    if (presetIds.length !== 4) {
      return NextResponse.json({ success: false, error: 'Style Explorer requires exactly 4 frames' }, { status: 400 })
    }

    const presets = presetIds.map(getTopPickPresetById)
    if (presets.some((preset) => !preset?.isStyleExplorerEnabled)) {
      return NextResponse.json({ success: false, error: 'Invalid Style Explorer frame preset' }, { status: 400 })
    }
    if (category !== 'all' && presets.some((preset) => preset?.category !== category)) {
      return NextResponse.json({ success: false, error: 'A frame does not match the selected category' }, { status: 400 })
    }

    const requiredCredits = 4
    const remainingCredits = getRemainingQuotaCount(user)
    if (remainingCredits < requiredCredits) {
      return NextResponse.json({
        success: false,
        error: 'Style Explorer requires 4 credits.',
        data: { requiredCredits, remainingCredits },
      }, { status: 403 })
    }

    const batchId = `style-explorer-${user.id}-${Date.now()}`
    return NextResponse.json({
      success: true,
      data: {
        batchId,
        requiredCredits,
        creditsUsed: 0,
        remainingCreditsBefore: remainingCredits,
        submissionStaggerMs: FRAME_COMPARE_SUBMISSION_STAGGER_MS,
        presets: presets.map((preset, batchIndex) => {
          const frame = preset!
          return {
            id: frame.id,
            name: frame.name,
            style: frame.style,
            assetPath: frame.assetPath,
            batchIndex,
            lookKey: `${styleIntent}-${frame.id}`,
            look: getStyleLookCopy(frame, styleIntent, occasion),
          }
        }),
        tasks: [],
      },
    })
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    logger.error('api', 'Style Explorer batch init failed', err, ctx)
    return NextResponse.json({ success: false, error: err.message || 'Internal server error' }, { status: 500 })
  }
}
