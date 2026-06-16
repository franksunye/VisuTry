import { TaskStatus } from '@prisma/client'
import { getTopPickPresetById } from '@/config/glasses-presets'

export function normalizeCompareTaskStatus(status: TaskStatus | string) {
  const normalized = String(status).toLowerCase()
  if (normalized === 'completed' || normalized === 'failed') return normalized
  return 'processing'
}

export function toCompareTaskResponse(task: {
  id: string
  status: TaskStatus | string
  resultImageUrl?: string | null
  errorMessage?: string | null
  metadata?: unknown
}) {
  const metadata = (task.metadata ?? {}) as Record<string, unknown>
  const presetId = typeof metadata.framePresetId === 'string' ? metadata.framePresetId : ''
  const preset = presetId ? getTopPickPresetById(presetId) : undefined

  return {
    taskId: task.id,
    status: normalizeCompareTaskStatus(task.status),
    resultImageUrl: task.resultImageUrl ?? null,
    errorMessage: task.errorMessage ?? null,
    preset: {
      id: preset?.id ?? presetId,
      name: preset?.name ?? (typeof metadata.framePresetName === 'string' ? metadata.framePresetName : 'Frame'),
      style: preset?.style ?? (typeof metadata.framePresetStyle === 'string' ? metadata.framePresetStyle : 'Frame'),
      assetPath: preset?.assetPath ?? '',
    },
  }
}
