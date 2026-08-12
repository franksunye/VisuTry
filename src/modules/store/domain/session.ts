/**
 * Anonymous MerchantSession capability rules.
 * Capability tokens are opaque and unguessable; only hashes are persisted.
 */

import { createHash, randomBytes, timingSafeEqual } from 'crypto'
import type { MerchantSessionStatus } from './enums'

export const MERCHANT_SESSION_TTL_HOURS = 24
export const ANONYMOUS_SHOPPER_IDENTITY_TTL_DAYS = 180

export type MerchantSessionCapability = {
  /** Opaque token returned once to the client (cookie or header). */
  token: string
  /** SHA-256 hex hash stored in the database. */
  tokenHash: string
}

export type AnonymousShopperIdentity = {
  token: string
  tokenHash: string
}

export function createMerchantSessionCapability(): MerchantSessionCapability {
  const token = randomBytes(32).toString('base64url')
  return { token, tokenHash: hashSessionCapability(token) }
}

export function hashSessionCapability(token: string): string {
  return createHash('sha256').update(token, 'utf8').digest('hex')
}

/** Stable, opaque browser identity. Only the hash should be persisted. */
export function createAnonymousShopperIdentity(): AnonymousShopperIdentity {
  const token = randomBytes(32).toString('base64url')
  return { token, tokenHash: hashSessionCapability(token) }
}

export function verifySessionCapability(
  presentedToken: string,
  storedHash: string,
): boolean {
  if (!presentedToken || !storedHash) return false
  const presentedHash = hashSessionCapability(presentedToken)
  try {
    return timingSafeEqual(
      Buffer.from(presentedHash, 'hex'),
      Buffer.from(storedHash, 'hex'),
    )
  } catch {
    return false
  }
}

export function computeSessionExpiresAt(
  from: Date = new Date(),
  ttlHours: number = MERCHANT_SESSION_TTL_HOURS,
): Date {
  return new Date(from.getTime() + ttlHours * 60 * 60 * 1000)
}

export function isSessionOperable(input: {
  status: MerchantSessionStatus
  expiresAt: Date
  now?: Date
}): boolean {
  const now = input.now ?? new Date()
  if (input.status !== 'ACTIVE') return false
  return input.expiresAt.getTime() > now.getTime()
}

/** A raw merchantSessionId from the client is never sufficient authorization. */
export function sessionIdAloneIsNotAuthorization(): true {
  return true
}
