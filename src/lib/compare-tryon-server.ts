import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { TaskStatus, TryOnType, type User } from '@prisma/client'
import { getTryOnConfig } from '@/config/try-on-types'
import { type GlassesPreset } from '@/config/glasses-presets'
import { logger } from '@/lib/logger'
import { submitTryOnTask } from '@/lib/tryon-service'
import { toCompareTaskResponse } from '@/lib/compare-tryon'

export const FRAME_COMPARE_SUBMISSION_STAGGER_MS = 3000

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

export async function submitCompareFrameTask({
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

    return toCompareTaskResponse({
      id: result.taskId,
      status: result.status === 'submitted' ? 'processing' : result.status,
      resultImageUrl: result.resultImageUrl ?? null,
      errorMessage: result.error ?? null,
      metadata,
    })
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    logger.error('api', 'Frame compare preset failed', err, {
      userId: user.id,
      batchId,
      presetId: preset.id,
    })

    return toCompareTaskResponse({
      id: `${batchId}-${preset.id}-failed`,
      status: TaskStatus.FAILED,
      resultImageUrl: null,
      errorMessage: err.message,
      metadata,
    })
  }
}
