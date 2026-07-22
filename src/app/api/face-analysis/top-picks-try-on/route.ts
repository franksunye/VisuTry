import { NextRequest, NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { TaskStatus, TryOnType, type User } from '@prisma/client'
import { requireAuthWithUser } from '@/lib/api-auth'
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

interface TopPicksRequestBody {
  faceAnalysisTaskId?: string
  framePresetIds?: string[]
}

async function createPresetFile(preset: GlassesPreset) {
  const assetPath = join(process.cwd(), 'public', preset.assetPath)
  const buffer = await readFile(assetPath)
  return new File([new Uint8Array(buffer)], `${preset.id}.jpg`, { type: 'image/jpeg' })
}

async function createUserImageFile(userImageUrl: string) {
  const response = await fetch(userImageUrl)
  if (!response.ok) {
    throw new Error(`Failed to load face analysis photo: ${response.status}`)
  }

  const blob = await response.blob()
  const mimeType = blob.type || 'image/jpeg'
  const extension = mimeType.split('/')[1] || 'jpg'
  return new File([blob], `face-analysis-user-photo.${extension}`, { type: mimeType })
}

function buildPresetPrompt(preset: GlassesPreset) {
  const config = getTryOnConfig('GLASSES')
  return `${config.aiPrompt}

Top-pick preset:
- Use the provided item image as a ${preset.name} eyewear reference.
- Render it as ${preset.promptHint}.
- Keep the output realistic and shopping-comparison friendly.
- Do not change the person's face, expression, head size, background, or photo composition.`
}

function normalizePresetIds(framePresetIds?: string[]) {
  const uniqueIds = Array.from(new Set(framePresetIds?.filter(Boolean) ?? []))

  for (const fallbackId of DEFAULT_TOP_PICK_PRESET_IDS) {
    if (uniqueIds.length >= MAX_PRESETS_PER_BATCH) break
    if (!uniqueIds.includes(fallbackId)) {
      uniqueIds.push(fallbackId)
    }
  }

  return uniqueIds.slice(0, MAX_PRESETS_PER_BATCH)
}

async function processPresetTask({
  user,
  userImageFile,
  userId,
  batchMetadata,
  preset,
  index,
}: {
  user: User
  userImageFile: File
  userId: string
  batchMetadata: Record<string, unknown>
  preset: GlassesPreset
  index: number
}) {
  if (!user) {
    throw new Error('User not found')
  }

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
      },
    }
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    logger.error('api', 'Top picks try-on preset failed', err, {
      userId,
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
    const auth = await requireAuthWithUser()
    if (!auth.ok) return auth.response
    const user = auth.user

    const body = (await request.json()) as TopPicksRequestBody
    if (!body.faceAnalysisTaskId) {
      return NextResponse.json(
        { success: false, error: 'faceAnalysisTaskId is required' },
        { status: 400 }
      )
    }

    const presetIds = normalizePresetIds(body.framePresetIds)
    const presets = presetIds.map(getTopPickPresetById).filter(Boolean) as GlassesPreset[]

    if (presets.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No valid frame presets were provided' },
        { status: 400 }
      )
    }

    const faceAnalysisTask = await prisma.faceAnalysisTask.findFirst({
      where: {
        id: body.faceAnalysisTaskId,
        userId: user.id,
        status: TaskStatus.COMPLETED,
        reportUnlocked: true,
      },
      select: {
        id: true,
        userImageUrl: true,
        detectedShape: true,
      },
    })

    if (!faceAnalysisTask) {
      return NextResponse.json(
        { success: false, error: 'Completed unlocked face analysis report was not found' },
        { status: 404 }
      )
    }

    const requiredCredits = presets.length
    const remainingCredits = getRemainingQuotaCount(user)
    if (remainingCredits < requiredCredits) {
      return NextResponse.json(
        {
          success: false,
          error: `Top picks try-on requires ${requiredCredits} credits.`,
          data: {
            requiredCredits,
            remainingCredits,
          },
        },
        { status: 403 }
      )
    }

    const batchId = `face-top-picks-${faceAnalysisTask.id}-${Date.now()}`
    const batchMetadata = {
      batchId,
      source: 'face-analysis-top-picks',
      serviceType: 'grsai',
      faceAnalysisTaskId: faceAnalysisTask.id,
      faceShape: faceAnalysisTask.detectedShape,
      batchSize: presets.length,
    }
    const userImageFile = await createUserImageFile(faceAnalysisTask.userImageUrl)

    const tasks = await runWithConcurrency(presets, 2, (preset, index) =>
      processPresetTask({
        user,
        userImageFile,
        userId: user.id,
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
    logger.error('api', 'Top picks try-on batch failed', err)
    return NextResponse.json(
      { success: false, error: err.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
