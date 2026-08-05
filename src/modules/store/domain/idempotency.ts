/**
 * Store generation and intent idempotency helpers.
 */

export function buildStoreGenerationIdempotencyKey(input: {
  merchantSessionId: string
  merchantFrameId: string
  clientSubmissionId: string
}): string {
  const { merchantSessionId, merchantFrameId, clientSubmissionId } = input
  if (!merchantSessionId || !merchantFrameId || !clientSubmissionId) {
    throw new Error('Store idempotency key requires session, frame, and clientSubmissionId')
  }
  return `store:${merchantSessionId}:${merchantFrameId}:${clientSubmissionId}`
}

export function buildStoreEventIdempotencyKey(input: {
  type: string
  merchantId: string
  merchantSessionId?: string | null
  merchantFrameId?: string | null
  tryOnTaskId?: string | null
  clientActionId?: string | null
}): string {
  const parts = [
    'evt',
    input.type,
    input.merchantId,
    input.merchantSessionId ?? '-',
    input.merchantFrameId ?? '-',
    input.tryOnTaskId ?? '-',
    input.clientActionId ?? '-',
  ]
  return parts.join(':')
}

export function buildIntentIdempotencyKey(input: {
  type: string
  merchantId: string
  merchantSessionId: string
  merchantFrameId?: string | null
  clientActionId: string
}): string {
  return [
    'intent',
    input.type,
    input.merchantId,
    input.merchantSessionId,
    input.merchantFrameId ?? '-',
    input.clientActionId,
  ].join(':')
}
