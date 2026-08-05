/**
 * Narrow generation port — Store calls existing Try-On only through this seam.
 */

import type { TryOnActor } from '../../domain/actor'
import type { UsagePolicy } from '../../domain/usage-policy'

export type StoreGenerationSubmitInput = {
  actor: TryOnActor
  usagePolicy: UsagePolicy
  userImage: File | Blob
  itemImage: File | Blob
  idempotencyKey: string
  clientSubmissionId: string
  prompt?: string
}

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
