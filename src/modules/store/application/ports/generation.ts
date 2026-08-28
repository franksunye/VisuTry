/**
 * Narrow generation port — Store calls existing Try-On only through this seam.
 */

import type { TryOnActor } from '../../domain/actor'
import type { UsagePolicy } from '../../domain/usage-policy'

type StoreGenerationSubmitBase = {
  actor: TryOnActor
  usagePolicy: UsagePolicy
  userImage: File | Blob
  itemImage: File | Blob
  idempotencyKey: string
  clientSubmissionId: string
  prompt?: string
  storeOrigin: 'STORE_DEMO' | 'STORE_PILOT'
  userId?: string | null
  /** Consumer-entitlement history follows the Consumer retention policy. */
  expiresAt?: Date
  onProviderAccepted?: () => Promise<void>
  telemetryOrigin?: 'STORE' | 'CAMPAIGN'
  storeId?: string | null
  campaignId?: string | null
}

export type StoreGenerationSubmitInput = StoreGenerationSubmitBase &
  (
    | {
        /** Generation uploads into this already-claimed task row. */
        preClaimedTaskId: string
        /** Fences stale dispatch owners. */
        dispatchLease: { owner: string; version: number }
      }
    | {
        preClaimedTaskId?: undefined
        dispatchLease?: undefined
      }
  )

export type StoreGenerationSubmitResult = {
  taskId: string
  status: string
  reusedExisting: boolean
}

export interface StoreGenerationPort {
  findExistingByIdempotencyKey(
    idempotencyKey: string,
    merchantId: string,
  ): Promise<StoreGenerationSubmitResult | null>
  submit(input: StoreGenerationSubmitInput): Promise<StoreGenerationSubmitResult>
  getStatus(taskId: string, merchantId: string): Promise<{
    taskId: string
    status: string
    resultImageUrl?: string | null
    errorMessage?: string | null
  }>
}
