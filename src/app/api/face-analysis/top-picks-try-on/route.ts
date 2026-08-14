import { NextRequest, NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import { extname, join } from 'node:path'
import { readFile } from 'node:fs/promises'
import { TaskStatus, TryOnType, type User } from '@prisma/client'
import { requireAuthWithUser } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma'
import { getRemainingQuotaCount } from '@/lib/quota'
import { logger, getRequestContext } from '@/lib/logger'
import { submitTryOnTask } from '@/lib/tryon-service'
import { getTryOnConfig } from '@/config/try-on-types'
import { readFaceAnalysisUserImageFile } from '@/lib/face-analysis-service'
import {
  DEFAULT_TOP_PICK_PRESET_IDS,
  getTopPickPresetById,
  type GlassesPreset,
} from '@/config/glasses-presets'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const MAX_PRESETS_PER_BATCH = 4
const TOP_PICKS_SOURCE = 'face-analysis-top-picks'
const TOP_PICKS_BATCH_VERSION = 1

interface TopPicksRequestBody {
  faceAnalysisTaskId?: string
  framePresetIds?: string[]
  mode?: 'generate' | 'complete'
}

type StoredTopPickTask = {
  id: string
  status: TaskStatus
  resultImageUrl: string | null
  errorMessage: string | null
  metadata: unknown
  createdAt: Date
}

function metadataValue(metadata: unknown, key: string) {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) return undefined
  return (metadata as Record<string, unknown>)[key]
}

function normalizeTaskStatus(status: TaskStatus | string) {
  const normalized = String(status).toLowerCase()
  if (normalized === 'completed' || normalized === 'failed') return normalized
  return 'processing'
}

function normalizePresetIds(framePresetIds?: string[]) {
  const uniqueIds = Array.from(new Set(framePresetIds?.filter(Boolean) ?? []))

  for (const fallbackId of DEFAULT_TOP_PICK_PRESET_IDS) {
    if (uniqueIds.length >= MAX_PRESETS_PER_BATCH) break
    if (!uniqueIds.includes(fallbackId)) uniqueIds.push(fallbackId)
  }

  return uniqueIds.slice(0, MAX_PRESETS_PER_BATCH)
}

function getExpectedPresetIds(tasks: StoredTopPickTask[], fallbackPresetIds: string[] = []) {
  for (const task of tasks) {
    const storedIds = metadataValue(task.metadata, 'framePresetIds')
    if (Array.isArray(storedIds)) {
      const validIds = storedIds.filter((id): id is string => typeof id === 'string')
      if (validIds.length > 0) return normalizePresetIds(validIds)
    }
  }

  const taskPresetIds = tasks
    .map((task) => metadataValue(task.metadata, 'framePresetId'))
    .filter((id): id is string => typeof id === 'string')

  return normalizePresetIds([...taskPresetIds, ...fallbackPresetIds])
}

function selectLatestAttemptByPreset(tasks: StoredTopPickTask[]) {
  const latestByPreset = new Map<string, StoredTopPickTask>()

  for (const task of [...tasks].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())) {
    const presetId = metadataValue(task.metadata, 'framePresetId')
    if (typeof presetId === 'string') latestByPreset.set(presetId, task)
  }

  return latestByPreset
}

function serializeBatch({
  batchId,
  tasks,
  expectedPresetIds,
  remainingCredits,
  recovered = false,
}: {
  batchId: string
  tasks: StoredTopPickTask[]
  expectedPresetIds: string[]
  remainingCredits: number
  recovered?: boolean
}) {
  const latestByPreset = selectLatestAttemptByPreset(tasks)
  const serializedTasks = expectedPresetIds.map((presetId) => {
    const preset = getTopPickPresetById(presetId)
    const task = latestByPreset.get(presetId)

    if (!task) {
      return {
        taskId: `missing-${batchId}-${presetId}`,
        status: 'failed' as const,
        resultImageUrl: null,
        errorMessage: 'This frame was not submitted. Complete your top picks to try again.',
        preset: {
          id: presetId,
          name: preset?.name ?? 'Frame',
          style: preset?.style ?? 'Frame',
        },
      }
    }

    const normalizedStatus = normalizeTaskStatus(task.status)
    const status = normalizedStatus === 'completed' && !task.resultImageUrl
      ? 'failed'
      : normalizedStatus

    return {
      taskId: task.id,
      status,
      resultImageUrl: task.resultImageUrl,
      errorMessage: status === 'failed' && !task.errorMessage
        ? 'Generation completed without a result image. Complete your top picks to try again.'
        : task.errorMessage,
      preset: {
        id: presetId,
        name: preset?.name ?? String(metadataValue(task.metadata, 'framePresetName') || 'Frame'),
        style: preset?.style ?? String(metadataValue(task.metadata, 'framePresetStyle') || 'Frame'),
      },
    }
  })

  return {
    batchId,
    requiredCredits: expectedPresetIds.length,
    creditsUsed: serializedTasks.filter((task) => task.status === 'completed').length,
    remainingCredits,
    recovered,
    tasks: serializedTasks,
  }
}

async function findLatestBatch(userId: string, faceAnalysisTaskId: string) {
  const latestTask = await prisma.tryOnTask.findFirst({
    where: {
      userId,
      AND: [
        { metadata: { path: ['source'], equals: TOP_PICKS_SOURCE } },
        { metadata: { path: ['faceAnalysisTaskId'], equals: faceAnalysisTaskId } },
      ],
    },
    orderBy: { createdAt: 'desc' },
    select: { metadata: true },
  })

  const batchId = metadataValue(latestTask?.metadata, 'batchId')
  if (typeof batchId !== 'string' || !batchId) return null

  const tasks = await prisma.tryOnTask.findMany({
    where: {
      userId,
      AND: [
        { metadata: { path: ['source'], equals: TOP_PICKS_SOURCE } },
        { metadata: { path: ['batchId'], equals: batchId } },
      ],
    },
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      status: true,
      resultImageUrl: true,
      errorMessage: true,
      metadata: true,
      createdAt: true,
    },
  })

  return { batchId, tasks }
}

async function getOwnedCompletedAnalysis(userId: string, faceAnalysisTaskId: string) {
  return prisma.faceAnalysisTask.findFirst({
    where: {
      id: faceAnalysisTaskId,
      userId,
      status: TaskStatus.COMPLETED,
      reportUnlocked: true,
    },
    select: {
      id: true,
      userImageUrl: true,
      metadata: true,
      detectedShape: true,
    },
  })
}

async function createPresetFile(preset: GlassesPreset) {
  const assetPath = join(process.cwd(), 'public', preset.assetPath)
  const buffer = await readFile(assetPath)
  const extension = extname(preset.assetPath).toLowerCase()
  const type = extension === '.png' ? 'image/png' : extension === '.webp' ? 'image/webp' : 'image/jpeg'
  return new File([new Uint8Array(buffer)], `${preset.id}${extension || '.jpg'}`, { type })
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

async function processPresetTask({
  user,
  userImageFile,
  batchMetadata,
  preset,
  index,
  attempt,
}: {
  user: User
  userImageFile: File
  batchMetadata: Record<string, unknown>
  preset: GlassesPreset
  index: number
  attempt: number
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
    attempt,
  }

  try {
    await submitTryOnTask(user, userImageFile, itemImageFile, TryOnType.GLASSES, prompt, {
      clientSubmissionId: `${batchId}:${preset.id}:${attempt}`,
      enforceIdempotency: true,
      forceServiceType: 'grsai',
      metadata,
    })
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    logger.error('api', 'Top picks try-on preset failed', err, {
      userId: user.id,
      batchId,
      presetId: preset.id,
      attempt,
    })
  }
}

async function runWithConcurrency<T>(
  items: T[],
  limit: number,
  worker: (item: T, index: number) => Promise<void>,
) {
  let cursor = 0

  async function runner() {
    while (cursor < items.length) {
      const index = cursor
      cursor += 1
      await worker(items[index], index)
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, runner))
}

export async function GET(request: NextRequest) {
  const ctx = getRequestContext(request)

  try {
    const auth = await requireAuthWithUser()
    if (!auth.ok) return auth.response

    const faceAnalysisTaskId = request.nextUrl.searchParams.get('faceAnalysisTaskId')
    if (!faceAnalysisTaskId) {
      return NextResponse.json({ success: false, error: 'faceAnalysisTaskId is required' }, { status: 400 })
    }

    const faceAnalysisTask = await getOwnedCompletedAnalysis(auth.user.id, faceAnalysisTaskId)
    if (!faceAnalysisTask) {
      return NextResponse.json(
        { success: false, error: 'Completed unlocked face analysis report was not found' },
        { status: 404 },
      )
    }

    const batch = await findLatestBatch(auth.user.id, faceAnalysisTaskId)
    if (!batch) return NextResponse.json({ success: true, data: null })

    const expectedPresetIds = getExpectedPresetIds(batch.tasks)
    return NextResponse.json({
      success: true,
      data: serializeBatch({
        batchId: batch.batchId,
        tasks: batch.tasks,
        expectedPresetIds,
        remainingCredits: getRemainingQuotaCount(auth.user),
        recovered: true,
      }),
    })
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    logger.error('api', 'Top picks try-on recovery failed', err, ctx)
    return NextResponse.json(
      { success: false, error: err.message || 'Internal server error' },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  const ctx = getRequestContext(request)

  try {
    const auth = await requireAuthWithUser()
    if (!auth.ok) return auth.response
    const user = auth.user

    const body = (await request.json()) as TopPicksRequestBody
    if (!body.faceAnalysisTaskId) {
      return NextResponse.json({ success: false, error: 'faceAnalysisTaskId is required' }, { status: 400 })
    }

    const faceAnalysisTask = await getOwnedCompletedAnalysis(user.id, body.faceAnalysisTaskId)
    if (!faceAnalysisTask) {
      return NextResponse.json(
        { success: false, error: 'Completed unlocked face analysis report was not found' },
        { status: 404 },
      )
    }

    const requestedPresetIds = normalizePresetIds(body.framePresetIds)
    const existingBatch = await findLatestBatch(user.id, faceAnalysisTask.id)
    const batchId = existingBatch?.batchId ?? `face-top-picks-${faceAnalysisTask.id}-v${TOP_PICKS_BATCH_VERSION}`
    const existingTasks = existingBatch?.tasks ?? []
    const expectedPresetIds = getExpectedPresetIds(existingTasks, requestedPresetIds)
    const latestByPreset = selectLatestAttemptByPreset(existingTasks)
    const hasActiveTasks = Array.from(latestByPreset.values()).some(
      (task) => normalizeTaskStatus(task.status) === 'processing',
    )

    // Ordinary generation is idempotent for an Analysis task. Existing results,
    // including partial results, must be recovered instead of silently creating
    // another four-credit batch.
    if ((body.mode ?? 'generate') === 'generate' && existingTasks.length > 0) {
      return NextResponse.json({
        success: true,
        data: serializeBatch({
          batchId,
          tasks: existingTasks,
          expectedPresetIds,
          remainingCredits: getRemainingQuotaCount(user),
          recovered: true,
        }),
      })
    }

    // Never retry failed slots while another slot is still active. This keeps a
    // second click or network retry from racing the original batch submission.
    if (body.mode === 'complete' && hasActiveTasks) {
      return NextResponse.json({
        success: true,
        data: serializeBatch({
          batchId,
          tasks: existingTasks,
          expectedPresetIds,
          remainingCredits: getRemainingQuotaCount(user),
          recovered: true,
        }),
      })
    }

    const targetPresetIds = body.mode === 'complete'
      ? expectedPresetIds.filter((presetId) => {
          const task = latestByPreset.get(presetId)
          return !task
            || normalizeTaskStatus(task.status) === 'failed'
            || (normalizeTaskStatus(task.status) === 'completed' && !task.resultImageUrl)
        })
      : expectedPresetIds
    const presets = targetPresetIds.map(getTopPickPresetById).filter(Boolean) as GlassesPreset[]

    if (presets.length === 0) {
      return NextResponse.json({
        success: true,
        data: serializeBatch({
          batchId,
          tasks: existingTasks,
          expectedPresetIds,
          remainingCredits: getRemainingQuotaCount(user),
          recovered: true,
        }),
      })
    }

    const remainingCredits = getRemainingQuotaCount(user)
    if (remainingCredits < presets.length) {
      return NextResponse.json(
        {
          success: false,
          error: `Top picks try-on requires ${presets.length} credits.`,
          data: { requiredCredits: presets.length, remainingCredits },
        },
        { status: 403 },
      )
    }

    const batchMetadata = {
      batchId,
      batchVersion: TOP_PICKS_BATCH_VERSION,
      source: TOP_PICKS_SOURCE,
      serviceType: 'grsai',
      faceAnalysisTaskId: faceAnalysisTask.id,
      faceShape: faceAnalysisTask.detectedShape,
      batchSize: expectedPresetIds.length,
      framePresetIds: expectedPresetIds,
    }
    const userImageFile = await readFaceAnalysisUserImageFile({
      taskId: faceAnalysisTask.id,
      userImageUrl: faceAnalysisTask.userImageUrl,
      metadata: faceAnalysisTask.metadata,
    })

    await runWithConcurrency(presets, 2, async (preset) => {
      const batchIndex = expectedPresetIds.indexOf(preset.id)
      const previousAttempts = existingTasks.filter(
        (task) => metadataValue(task.metadata, 'framePresetId') === preset.id,
      ).length
      await processPresetTask({
        user,
        userImageFile,
        batchMetadata,
        preset,
        index: batchIndex,
        attempt: previousAttempts + 1,
      })
    })

    const persistedBatch = await findLatestBatch(user.id, faceAnalysisTask.id)
    const persistedTasks = persistedBatch?.tasks ?? existingTasks
    revalidateTag(`user-${user.id}`)

    return NextResponse.json({
      success: true,
      data: serializeBatch({
        batchId,
        tasks: persistedTasks,
        expectedPresetIds,
        remainingCredits: getRemainingQuotaCount(user),
      }),
    })
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    logger.error('api', 'Top picks try-on batch failed', err, ctx)
    return NextResponse.json(
      { success: false, error: err.message || 'Internal server error' },
      { status: 500 },
    )
  }
}
