import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { revalidateTag } from 'next/cache'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { TryOnType, type User } from '@prisma/client'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getRemainingQuotaCount } from '@/lib/quota'
import { logger, getRequestContext } from '@/lib/logger'
import { submitTryOnTask } from '@/lib/tryon-service'
import { getTryOnConfig } from '@/config/try-on-types'
import {
  DEFAULT_TOP_PICK_PRESET_IDS,
  getTopPickPresetById,
  type GlassesPreset,
} from '@/config/glasses-presets'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const MAX_PRESETS_PER_BATCH = 4

async function createPresetFile(preset: GlassesPreset) {
  const assetPath = join(process.cwd(), 'public', preset.assetPath)
  const buffer = await readFile(assetPath)
  return new File([new Uint8Array(buffer)], `${preset.id}.jpg`, { type: 'image/jpeg' })
}

function buildPresetPrompt(preset: GlassesPreset) {
  const config = getTryOnConfig('GLASSES')
  return `${config.aiPrompt}

Frame compare preset:
- Use the provided item image as a ${preset.name} eyewear reference.
- Render it as ${preset.promptHint}.
- Keep every comparison image realistic, consistent, and shopping-friendly.
- Do not change the person's face, expression, head size, background, or photo composition.`
}

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

async function processPresetTask({
  user,
  userImageFile,
  batchMetadata,
  preset,
  index,
}: {
  user: User
  userImageFile: File
  batchMetadata: Record<string, unknown>
  preset: GlassesPreset
  index: number
}) {
  const itemImageFile = await createPresetFile(preset)
  const prompt = buildPresetPrompt(preset)
  const batchId = String(batchMetadata.batchId)
  const metadata: Record<string, unknown> = {
    ...batchMetadata,
    framePresetId: preset.id,
    framePresetName: preset.name,
    framePresetStyle: preset.style,
    batchIndex: index,
  }

  try {
    const result = await submitTryOnTask(
      user,
      userImageFile,
      itemImageFile,
      TryOnType.GLASSES,
      prompt,
      {
        clientSubmissionId: `${batchId}:${preset.id}`,
        forceServiceType: 'grsai',
        metadata,
      },
    )

    return {
      taskId: result.taskId,
      status: result.status === 'submitted' ? 'processing' : result.status,
      resultImageUrl: result.resultImageUrl ?? null,
      errorMessage: result.error ?? null,
      preset: {
        id: preset.id,
        name: preset.name,
        style: preset.style,
        assetPath: preset.assetPath,
      },
    }
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    logger.error('api', 'Frame compare preset failed', err, {
      userId: user.id,
      batchId,
      presetId: preset.id,
    })

    return {
      taskId: `${batchId}-${preset.id}-failed`,
      status: 'failed',
      resultImageUrl: null,
      errorMessage: err.message,
      preset: {
        id: preset.id,
        name: preset.name,
        style: preset.style,
        assetPath: preset.assetPath,
      },
    }
  }
}

async function runWithConcurrency<T, R>(
  items: T[],
  limit: number,
  worker: (item: T, index: number) => Promise<R>
) {
  const results: R[] = []
  let cursor = 0

  async function runner() {
    while (cursor < items.length) {
      const index = cursor
      cursor += 1
      results[index] = await worker(items[index], index)
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, runner))
  return results
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
    const userImage = formData.get('userImage')

    if (!(userImage instanceof File) || userImage.size === 0) {
      return NextResponse.json(
        { success: false, error: 'A front-facing photo is required' },
        { status: 400 },
      )
    }

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
    const batchMetadata = {
      batchId,
      source: 'frame-compare',
      serviceType: 'grsai',
      batchSize: presets.length,
    }

    const tasks = await runWithConcurrency(presets, 2, (preset, index) =>
      processPresetTask({
        user,
        userImageFile: userImage,
        batchMetadata,
        preset,
        index,
      })
    )

    revalidateTag(`user-${user.id}`)

    return NextResponse.json({
      success: true,
      data: {
        batchId,
        requiredCredits,
        creditsUsed: 0,
        remainingCreditsBefore: remainingCredits,
        tasks,
      },
    })
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    logger.error('api', 'Frame compare batch failed', err, ctx)
    return NextResponse.json(
      { success: false, error: err.message || 'Internal server error' },
      { status: 500 },
    )
  }
}
