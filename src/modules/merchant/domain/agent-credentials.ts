import { createHash, randomBytes, timingSafeEqual } from 'node:crypto'

export const MERCHANT_AGENT_SCOPES = [
  'merchant:read',
  'merchant:write',
  'catalog:read',
  'catalog:write',
  'experience:read',
  'experience:write',
  'analytics:read',
] as const

export type MerchantAgentScope = (typeof MERCHANT_AGENT_SCOPES)[number]

export const MERCHANT_AGENT_KEY_PREFIX = 'vt_live_'
const KEY_ID_BYTES = 8
const SECRET_BYTES = 32
const KEY_ID_LENGTH = KEY_ID_BYTES * 2
export const MERCHANT_AGENT_LOOKUP_PREFIX_LENGTH = MERCHANT_AGENT_KEY_PREFIX.length + KEY_ID_LENGTH
export const MAX_ACTIVE_MERCHANT_AGENT_CREDENTIALS = 5
export const LAST_USED_UPDATE_INTERVAL_MS = 15 * 60 * 1000

export class InvalidAgentCredentialError extends Error {
  readonly code = 'INVALID_AGENT_CREDENTIAL'
  readonly httpStatus = 401

  constructor() {
    super('Invalid agent credential.')
    this.name = 'InvalidAgentCredentialError'
  }
}

export class AgentScopeError extends Error {
  readonly code = 'AGENT_SCOPE_REQUIRED'
  readonly httpStatus = 403

  constructor(scope: MerchantAgentScope) {
    super(`Agent scope required: ${scope}`)
    this.name = 'AgentScopeError'
  }
}

export class AgentCredentialLimitError extends Error {
  readonly code = 'AGENT_CREDENTIAL_LIMIT_REACHED'
  readonly httpStatus = 409

  constructor() {
    super('The merchant has reached the active agent credential limit.')
    this.name = 'AgentCredentialLimitError'
  }
}

export function isMerchantAgentScope(value: unknown): value is MerchantAgentScope {
  return typeof value === 'string' && (MERCHANT_AGENT_SCOPES as readonly string[]).includes(value)
}

export function normalizeMerchantAgentScopes(input?: readonly string[] | null): MerchantAgentScope[] {
  const scopes = input == null ? [...MERCHANT_AGENT_SCOPES] : [...new Set(input)]
  if (scopes.length === 0 || scopes.some((scope) => !isMerchantAgentScope(scope))) {
    throw new Error('Invalid agent scope.')
  }
  return scopes as MerchantAgentScope[]
}

export function createAgentSecret(): { secret: string; keyPrefix: string; secretHash: string } {
  const keyPrefix = `${MERCHANT_AGENT_KEY_PREFIX}${randomBytes(KEY_ID_BYTES).toString('hex')}`
  const secret = `${keyPrefix}_${randomBytes(SECRET_BYTES).toString('base64url')}`
  return { secret, keyPrefix, secretHash: hashAgentSecret(secret) }
}

/** Reuses the repository's existing high-entropy token pattern: SHA-256 is stable and cheap for indexed candidate lookup. */
export function hashAgentSecret(secret: string): string {
  return createHash('sha256').update(secret, 'utf8').digest('hex')
}

export function verifyAgentSecret(secret: string, expectedHash: string): boolean {
  if (!/^[0-9a-f]{64}$/u.test(expectedHash)) return false
  const actual = Buffer.from(hashAgentSecret(secret), 'hex')
  const expected = Buffer.from(expectedHash, 'hex')
  return actual.length === expected.length && timingSafeEqual(actual, expected)
}

export function keyPrefixForSecret(secret: string): string | null {
  const match = new RegExp(`^(${MERCHANT_AGENT_KEY_PREFIX}[0-9a-f]{${KEY_ID_LENGTH}})_[A-Za-z0-9_-]{32,}$`, 'u').exec(secret)
  return match?.[1] ?? null
}

export function maskAgentSecret(secretOrPrefix: string): string {
  const prefix = keyPrefixForSecret(secretOrPrefix) ?? (secretOrPrefix.startsWith(MERCHANT_AGENT_KEY_PREFIX) ? secretOrPrefix : '')
  return prefix ? `${prefix}_••••••••` : '••••••••'
}
