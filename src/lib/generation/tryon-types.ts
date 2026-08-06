/**
 * Shared Try-On submission / poll contracts (Store-neutral).
 */

import type { TaskStatus } from '@prisma/client'

export type TryOnSubmissionResult = {
  taskId: string
  status: string // 'submitted' | 'completed' | 'failed'
  serviceType: string
  isAsync: boolean
  resultImageUrl?: string
  error?: string
}

export type TryOnPollResult = {
  status: TaskStatus
  resultImageUrl?: string
  progress?: number
  error?: string
  isNewCompletion?: boolean
}
