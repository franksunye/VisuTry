/**
 * Resolve and authorize a merchant-scoped shopper session.
 */

import {
  StoreDomainError,
  isSessionOperable,
  sessionExpired,
  sessionUnauthorized,
  verifySessionCapability,
} from '../domain'
import type { ExperienceRepository, MerchantSessionRecord, MerchantSessionRepository } from './ports/repositories'

export async function requireOperableStoreSession(input: {
  sessions: MerchantSessionRepository
  merchantId: string
  merchantSessionId: string
  capabilityToken: string | null
  /** Re-check lifecycle for a request that would create or mutate shopper activity. */
  requireShopperActions?: boolean
  experiences?: ExperienceRepository
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

  if (input.requireShopperActions && session.experienceId) {
    // Fail closed if the authoritative Experience cannot be resolved. A session
    // capability is not permission to keep operating a campaign after archive.
    if (!input.experiences) throw sessionUnauthorized()
    const experience = await input.experiences.findByMerchantAndId(input.merchantId, session.experienceId)
    if (!experience) throw sessionUnauthorized()
    if (experience.type === 'CAMPAIGN' && experience.status === 'ARCHIVED') {
      throw new StoreDomainError('CAPABILITY_DISABLED', 'This campaign has ended.', 409)
    }
  }

  return session
}
