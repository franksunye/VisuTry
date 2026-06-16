import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getRemainingQuotaCount } from '@/lib/quota'
import { getRequestContext, logger } from '@/lib/logger'
import {
  DEFAULT_TOP_PICK_PRESET_IDS,
  getTopPickPresetById,
  type GlassesPreset,
} from '@/config/glasses-presets'
import { FRAME_COMPARE_SUBMISSION_STAGGER_MS } from '@/lib/compare-tryon-server'

export const dynamic = 'force-dynamic'
export const maxDuration = 10

const MAX_PRESETS_PER_BATCH = 4

function parsePresetIds(formData: FormData) {
  const raw = formData.get('framePresetIds')
  let ids: string[] = []

  if (typeof raw === 'string' && raw.trim()) {
    try {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) {
        ids = parsed.filter((id): id is string => typeof id === 'string')
      }
    } catch {
      ids = raw.split(',').map((id) => id.trim()).filter(Boolean)
    }
  }

  if (ids.length === 0) {
    ids = [...DEFAULT_TOP_PICK_PRESET_IDS]
  }

  return Array.from(new Set(ids)).slice(0, MAX_PRESETS_PER_BATCH)
}

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
    const presetIds = parsePresetIds(formData)
    const presets = presetIds.map(getTopPickPresetById).filter(Boolean) as GlassesPreset[]

    if (presets.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No valid frame presets were provided' },
        { status: 400 },
      )
    }

    const requiredCredits = presets.length
    const remainingCredits = getRemainingQuotaCount(user)
    if (remainingCredits < requiredCredits) {
      return NextResponse.json(
        {
          success: false,
          error: `Frame compare requires ${requiredCredits} credits.`,
          data: {
            requiredCredits,
            remainingCredits,
          },
        },
        { status: 403 },
      )
    }

    const batchId = `frame-compare-${user.id}-${Date.now()}`

    return NextResponse.json({
      success: true,
      data: {
        batchId,
        requiredCredits,
        creditsUsed: 0,
        remainingCreditsBefore: remainingCredits,
        submissionStaggerMs: FRAME_COMPARE_SUBMISSION_STAGGER_MS,
        presets: presets.map((preset, index) => ({
          id: preset.id,
          name: preset.name,
          style: preset.style,
          assetPath: preset.assetPath,
          batchIndex: index,
        })),
        tasks: [],
      },
    })
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    logger.error('api', 'Frame compare batch init failed', err, ctx)
    return NextResponse.json(
      { success: false, error: err.message || 'Internal server error' },
      { status: 500 },
    )
  }
}
