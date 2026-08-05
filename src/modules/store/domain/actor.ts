/**
 * Generation actor context for the shared Try-On seam.
 * Server-owned — never accept actor kind from untrusted client input.
 */

export type ConsumerTryOnActor = {
  kind: 'consumer'
  userId: string
}

export type StoreTryOnActor = {
  kind: 'store'
  merchantId: string
  merchantSessionId: string
  merchantFrameId: string
}

export type TryOnActor = ConsumerTryOnActor | StoreTryOnActor

export function isStoreActor(actor: TryOnActor): actor is StoreTryOnActor {
  return actor.kind === 'store'
}

export function isConsumerActor(actor: TryOnActor): actor is ConsumerTryOnActor {
  return actor.kind === 'consumer'
}

/**
 * Reject client-shaped Store metadata used to obtain free generation.
 * Attribution fields on a request are never sufficient without a verified session capability.
 */
export function assertTrustedStoreActor(actor: StoreTryOnActor): void {
  if (!actor.merchantId || !actor.merchantSessionId || !actor.merchantFrameId) {
    throw new Error('Store actor requires merchantId, merchantSessionId, and merchantFrameId')
  }
}
