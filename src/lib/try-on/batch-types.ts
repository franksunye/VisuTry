/**
 * Shared types and utilities for batch try-on flows.
 *
 * Used by both StyleExplorerInterface and FrameCompareInterface
 * to eliminate duplicate type definitions and helper functions.
 */

// ── Types ──────────────────────────────────────────────

export type BatchTaskStatus = 'queued' | 'processing' | 'completed' | 'failed'

export interface BatchTaskPreset {
  id: string
  name: string
  style: string
  assetPath: string
  [key: string]: unknown
}

export interface BatchTask<TPreset extends BatchTaskPreset = BatchTaskPreset> {
  taskId: string
  status: BatchTaskStatus
  resultImageUrl: string | null
  errorMessage: string | null
  preset: TPreset
}

export interface BatchResult<TPreset extends BatchTaskPreset = BatchTaskPreset> {
  batchId: string
  requiredCredits: number
  remainingCreditsBefore: number
  recovered?: boolean
  startedAt?: string
  userImageUrl?: string | null
  tasks: BatchTask<TPreset>[]
}

// ── Utilities ──────────────────────────────────────────

/** Stagger between dispatching frames in a batch (ms). */
export const FRAME_DISPATCH_STAGGER_MS = 3000

/** Delay helper for staggered dispatch. */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms))
}

/**
 * Normalize any status string from the API into a BatchTaskStatus.
 * Handles uppercase, mixed-case, and unknown values gracefully.
 */
export function normalizeTryOnStatus(status: unknown): BatchTaskStatus {
  const s = String(status).toLowerCase()
  if (s === 'queued' || s === 'completed' || s === 'failed') return s
  return 'processing'
}

/**
 * Create a queued placeholder task for a preset that hasn't been dispatched yet.
 */
export function createQueuedTask<TPreset extends BatchTaskPreset>(
  batchId: string,
  preset: TPreset,
  index: number,
): BatchTask<TPreset> {
  return {
    taskId: `queued-${batchId}-${preset.id}-${index}`,
    status: 'queued',
    resultImageUrl: null,
    errorMessage: null,
    preset,
  }
}

/**
 * Count active (queued + processing) tasks in a batch.
 */
export function countActiveTasks<TPreset extends BatchTaskPreset>(
  tasks: BatchTask<TPreset>[],
): number {
  return tasks.filter(
    (t) =>
      t.status === 'processing' &&
      !t.taskId.startsWith('queued-') &&
      !t.taskId.includes('-failed'),
  ).length
}
