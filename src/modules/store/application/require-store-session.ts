/**
 * Resolve and authorize a merchant-scoped shopper session.
 */

import {
  isSessionOperable,
  sessionExpired,
  sessionUnauthorized,
  verifySessionCapability,
} from '../domain'
import type { MerchantSessionRecord, MerchantSessionRepository } from './ports/repositories'

export async function requireOperableStoreSession(input: {
  sessions: MerchantSessionRepository
  merchantId: string
  merchantSessionId: string
  capabilityToken: string | null
}): Promise<MerchantSessionRecord> {
  if (!input.capabilityToken) {
    throw sessionUnauthorized()
  }

  const session = await input.sessions.findByMerchantAndId(
    input.merchantId,
    input.merchantSessionId,
  )
  if (!session) {
    throw sessionUnauthorized()
  }

  if (!verifySessionCapability(input.capabilityToken, session.capabilityTokenHash)) {
    throw sessionUnauthorized()
  }

  if (!isSessionOperable({ status: session.status, expiresAt: session.expiresAt })) {
    await input.sessions.markExpired(input.merchantId, input.merchantSessionId)
    throw sessionExpired()
  }

  return session
}
