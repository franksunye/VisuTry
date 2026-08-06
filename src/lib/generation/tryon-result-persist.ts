/**
 * Store persist registration for GrsAI success handling (ADR-007).
 * Shared core stays Store-neutral; Store registers its persist handler at runtime.
 */

import type { TaskStatus } from '@prisma/client'
import type { TryOnPollResult } from './tryon-types'

export type { TryOnPollResult }

export type GrsaiSucceededPersistInput = {
  taskId: string
  origin: string
  userId: string | null
  merchantId: string | null
  pollImageUrl: string
  pollProgress?: number
  pollMetadata?: Record<string, unknown>
  externalPollMetadata: Record<string, unknown>
  latestBeforePersist: {
    status: TaskStatus
    resultImageUrl: string | null
    metadata: unknown
    resultPersistLeaseOwner: string | null
    resultPersistLeaseUntil: Date | null
    resultPersistVersion: number
  } | null
}

export type GrsaiSucceededPersistHandler = (
  input: GrsaiSucceededPersistInput,
) => Promise<TryOnPollResult>

let storeGrsaiSucceededPersistHandler: GrsaiSucceededPersistHandler | null = null

export function registerStoreGrsaiSucceededPersistHandler(
  handler: GrsaiSucceededPersistHandler,
): void {
  storeGrsaiSucceededPersistHandler = handler
}

export function getStoreGrsaiSucceededPersistHandler(): GrsaiSucceededPersistHandler | null {
  return storeGrsaiSucceededPersistHandler
}

export function isStoreTryOnOrigin(origin: string): boolean {
  return origin === 'STORE_DEMO' || origin === 'STORE_PILOT'
}

/** Test helper — clears Store persist registration. */
export function __resetStoreGrsaiSucceededPersistHandlerForTests(): void {
  storeGrsaiSucceededPersistHandler = null
}
