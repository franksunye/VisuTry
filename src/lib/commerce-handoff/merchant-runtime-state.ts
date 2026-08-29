/**
 * Same-tab Store/Campaign resume payload.
 *
 * Persist durable identifiers only — never private image bytes or result blobs.
 * Result pixels are re-queried from the server with the saved task IDs.
 */

import { isPersistablePreviewUrl } from '@/lib/commerce-handoff/merchant-runtime-preview'

export type MerchantRuntimeTryOnTaskRef = {
  merchantFrameId: string
  taskId: string
}

const MAX_TASK_REFS = 8
const MAX_ID_LENGTH = 200

function isSafeId(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0 && value.length <= MAX_ID_LENGTH
}

export function parseMerchantRuntimeTryOnTasks(value: unknown): MerchantRuntimeTryOnTaskRef[] {
  if (!Array.isArray(value)) return []
  const tasks: MerchantRuntimeTryOnTaskRef[] = []
  const seen = new Set<string>()
  for (const entry of value) {
    if (tasks.length >= MAX_TASK_REFS) break
    if (!entry || typeof entry !== 'object') continue
    const merchantFrameId = (entry as { merchantFrameId?: unknown }).merchantFrameId
    const taskId = (entry as { taskId?: unknown }).taskId
    if (!isSafeId(merchantFrameId) || !isSafeId(taskId)) continue
    const key = `${merchantFrameId}:${taskId}`
    if (seen.has(key)) continue
    seen.add(key)
    tasks.push({ merchantFrameId, taskId })
  }
  return tasks
}

export type MerchantRuntimeContinuationState = {
  merchantId: string
  merchantSessionId: string
  expiresAt: string
  photoPreview: string
  recommendations: unknown[]
  selectedIds: string[]
  selectionSaved: true
  batchId: string | null
  tryOnTasks: MerchantRuntimeTryOnTaskRef[]
}

export function parseMerchantRuntimeContinuationState(
  raw: unknown,
  nowMs = Date.now(),
): MerchantRuntimeContinuationState | null {
  if (!raw || typeof raw !== 'object') return null
  const value = raw as Partial<MerchantRuntimeContinuationState>
  if (
    !isSafeId(value.merchantId) ||
    !isSafeId(value.merchantSessionId) ||
    typeof value.expiresAt !== 'string' ||
    new Date(value.expiresAt).getTime() <= nowMs ||
    typeof value.photoPreview !== 'string' ||
    !isPersistablePreviewUrl(value.photoPreview) ||
    !Array.isArray(value.recommendations) ||
    !Array.isArray(value.selectedIds) ||
    value.selectionSaved !== true
  ) {
    return null
  }

  const selectedIds = value.selectedIds.filter((id): id is string => isSafeId(id))
  if (value.recommendations.length === 0 || selectedIds.length === 0) return null

  return {
    merchantId: value.merchantId,
    merchantSessionId: value.merchantSessionId,
    expiresAt: value.expiresAt,
    photoPreview: value.photoPreview,
    recommendations: value.recommendations,
    selectedIds,
    selectionSaved: true,
    batchId: typeof value.batchId === 'string' && isSafeId(value.batchId) ? value.batchId : null,
    tryOnTasks: parseMerchantRuntimeTryOnTasks(value.tryOnTasks),
  }
}

export function serializeMerchantRuntimeContinuationState(
  state: MerchantRuntimeContinuationState,
): string {
  return JSON.stringify({
    merchantId: state.merchantId,
    merchantSessionId: state.merchantSessionId,
    expiresAt: state.expiresAt,
    photoPreview: state.photoPreview,
    recommendations: state.recommendations,
    selectedIds: state.selectedIds,
    selectionSaved: true,
    batchId: state.batchId,
    tryOnTasks: parseMerchantRuntimeTryOnTasks(state.tryOnTasks),
  })
}
