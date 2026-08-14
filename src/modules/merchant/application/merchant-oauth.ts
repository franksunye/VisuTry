import { createHash, randomBytes, timingSafeEqual } from 'node:crypto'
import { prisma } from '@/lib/prisma'
import { requireMerchantMembership } from './merchant-access'
import {
  CIMD_FETCH_TIMEOUT_MS,
  CIMD_MAX_DOCUMENT_BYTES,
  fetchPinnedCimdDocument,
  resolveAndPinCimdHost,
} from './merchant-cimd-network'
import {
  InvalidAgentCredentialError,
  MERCHANT_AGENT_SCOPES,
  normalizeMerchantAgentScopes,
  type MerchantAgentScope,
} from '../domain/agent-credentials'
import type { AgentMerchantActor } from '../domain/actor'

export const MCP_OAUTH_ISSUER_PATH = '/api/mcp/oauth'
export const MCP_OAUTH_AUTHORIZE_PATH = `${MCP_OAUTH_ISSUER_PATH}/authorize`
export const MCP_OAUTH_TOKEN_PATH = `${MCP_OAUTH_ISSUER_PATH}/token`
export const MCP_OAUTH_REGISTER_PATH = `${MCP_OAUTH_ISSUER_PATH}/register`
export const MCP_OAUTH_REVOKE_PATH = `${MCP_OAUTH_ISSUER_PATH}/revoke`
export const MCP_OAUTH_SCOPE_VALUES = [...MERCHANT_AGENT_SCOPES] as const
export const MCP_OAUTH_DEFAULT_SCOPES: MerchantAgentScope[] = [
  'merchant:read',
  'catalog:read',
  'experience:read',
  'analytics:read',
]
export const MCP_OAUTH_ACCESS_TOKEN_TTL_SECONDS = 60 * 60
export const MCP_OAUTH_REFRESH_TOKEN_TTL_SECONDS = 30 * 24 * 60 * 60
export const MCP_OAUTH_AUTHORIZATION_CODE_TTL_SECONDS = 5 * 60
export const MCP_OAUTH_REQUEST_TTL_SECONDS = 10 * 60
export const MCP_OAUTH_DCR_REQUESTS_PER_MINUTE = 20
const MCP_OAUTH_DCR_WINDOW_MS = 60_000
const CIMD_DEFAULT_CACHE_SECONDS = 5 * 60
const CIMD_MAX_CACHE_SECONDS = 60 * 60

export class MerchantOAuthError extends Error {
  readonly code: string
  readonly httpStatus: number
  readonly retryAfterSeconds?: number

  constructor(code: string, message: string, httpStatus = 400, retryAfterSeconds?: number) {
    super(message)
    this.name = 'MerchantOAuthError'
    this.code = code
    this.httpStatus = httpStatus
    this.retryAfterSeconds = retryAfterSeconds
  }
}

export type OAuthClientMetadata = {
  clientId: string
  clientName: string
  redirectUris: string[]
  tokenEndpointAuthMethod: string
}

export type OAuthAuthorizationRequest = {
  requestId: string
  clientId: string
  redirectUri: string
  scopes: MerchantAgentScope[]
  resource: string
  state: string | null
  codeChallenge: string
  codeChallengeMethod: string
  userId: string | null
  expiresAt: Date
}

function hashToken(token: string): string {
  return createHash('sha256').update(token, 'utf8').digest('hex')
}

function constantTimeEqual(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left)
  const rightBuffer = Buffer.from(right)
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer)
}

function randomToken(prefix: string, bytes = 32): string {
  return `${prefix}${randomBytes(bytes).toString('base64url')}`
}

type CimdCacheEntry = { client: OAuthClientMetadata; expiresAt: number }
const cimdCache = new Map<string, CimdCacheEntry>()

function cacheSeconds(cacheControlValue: string | undefined): number {
  const cacheControl = cacheControlValue || ''
  const maxAge = cacheControl.match(/(?:^|,)\s*max-age=(\d+)/iu)?.[1]
  const seconds = maxAge ? Number(maxAge) : CIMD_DEFAULT_CACHE_SECONDS
  return Math.max(1, Math.min(Number.isFinite(seconds) ? seconds : CIMD_DEFAULT_CACHE_SECONDS, CIMD_MAX_CACHE_SECONDS))
}

async function loadCimdClientMetadata(clientId: string): Promise<OAuthClientMetadata> {
  const cached = cimdCache.get(clientId)
  if (cached && cached.expiresAt > Date.now()) return cached.client
  let response: Awaited<ReturnType<typeof fetchPinnedCimdDocument>>
  try {
    const pinnedHost = await resolveAndPinCimdHost(clientId)
    response = await fetchPinnedCimdDocument(pinnedHost, {
      timeoutMs: CIMD_FETCH_TIMEOUT_MS,
      maxBytes: CIMD_MAX_DOCUMENT_BYTES,
    })
  } catch {
    throw new MerchantOAuthError('invalid_client', 'The CIMD metadata document could not be fetched.', 400)
  }
  if (response.status < 200 || response.status >= 300 || !response.contentType.toLowerCase().startsWith('application/json')) {
    throw new MerchantOAuthError('invalid_client', 'The CIMD metadata document is unavailable or not JSON.', 400)
  }
  const contentLength = Number(response.contentLength || 0)
  if (contentLength > CIMD_MAX_DOCUMENT_BYTES) {
    throw new MerchantOAuthError('invalid_client', 'The CIMD metadata document is too large.', 400)
  }
  const body = response.body
  if (Buffer.byteLength(body, 'utf8') > CIMD_MAX_DOCUMENT_BYTES) {
    throw new MerchantOAuthError('invalid_client', 'The CIMD metadata document is too large.', 400)
  }
  let metadata: Record<string, unknown>
  try {
    metadata = JSON.parse(body) as Record<string, unknown>
  } catch {
    throw new MerchantOAuthError('invalid_client', 'The CIMD metadata document is not valid JSON.', 400)
  }
  if (metadata.client_id !== clientId) {
    throw new MerchantOAuthError('invalid_client', 'The CIMD metadata client_id must match the URL exactly.', 400)
  }
  if (typeof metadata.client_name !== 'string' || !metadata.client_name.trim()) {
    throw new MerchantOAuthError('invalid_client', 'The CIMD metadata document requires client_name.', 400)
  }
  if (!Array.isArray(metadata.redirect_uris) || metadata.redirect_uris.length === 0) {
    throw new MerchantOAuthError('invalid_client', 'The CIMD metadata document requires redirect_uris.', 400)
  }
  const redirectUris = [...new Set(metadata.redirect_uris.map(validateRedirectUri))]
  if (metadata.application_type !== undefined && metadata.application_type !== 'native' && metadata.application_type !== 'web') {
    throw new MerchantOAuthError('invalid_client', 'The CIMD application_type is invalid.', 400)
  }
  if (metadata.application_type === 'native' && redirectUris.some((uri) => !isLocalhostRedirectUri(uri))) {
    throw new MerchantOAuthError('invalid_client', 'CIMD native clients must use localhost HTTP redirect URIs.', 400)
  }
  if (metadata.application_type === 'web' && redirectUris.some((uri) => new URL(uri).protocol !== 'https:')) {
    throw new MerchantOAuthError('invalid_client', 'CIMD web clients must use HTTPS redirect URIs.', 400)
  }
  validateRegistrationArray(metadata.grant_types, ['authorization_code', 'refresh_token'], 'grant_types', 'authorization_code')
  validateRegistrationArray(metadata.response_types, ['code'], 'response_types', 'code')
  if (metadata.token_endpoint_auth_method !== undefined && metadata.token_endpoint_auth_method !== 'none') {
    throw new MerchantOAuthError('invalid_client', 'Only public PKCE clients are supported.', 400)
  }
  const client = {
    clientId,
    clientName: metadata.client_name.trim().slice(0, 160),
    redirectUris,
    tokenEndpointAuthMethod: 'none',
  }
  cimdCache.set(clientId, { client, expiresAt: Date.now() + cacheSeconds(response.cacheControl) * 1000 })
  return client
}

export async function consumeMcpOAuthDcrRateLimit(input: { identity: string; now?: Date; limit?: number }): Promise<void> {
  const now = input.now ?? new Date()
  const windowStart = new Date(Math.floor(now.getTime() / MCP_OAUTH_DCR_WINDOW_MS) * MCP_OAUTH_DCR_WINDOW_MS)
  const secret = process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET || 'visutry-mcp-dcr-rate-limit'
  const bucketHash = hashToken(`${secret}\u0000${input.identity.slice(0, 256)}`)
  const row = await prisma.merchantOAuthDcrCounter.upsert({
    where: { bucketHash_windowStart: { bucketHash, windowStart } },
    create: { bucketHash, windowStart, count: 1 },
    update: { count: { increment: 1 } },
    select: { count: true },
  })
  const limit = input.limit ?? MCP_OAUTH_DCR_REQUESTS_PER_MINUTE
  if (row.count > limit) {
    const retryAfterSeconds = Math.max(1, Math.ceil((windowStart.getTime() + MCP_OAUTH_DCR_WINDOW_MS - now.getTime()) / 1000))
    throw new MerchantOAuthError('rate_limited', 'OAuth client registration rate limit exceeded.', 429, retryAfterSeconds)
  }
}

export function canonicalMcpResource(requestOrigin?: string): string {
  const configured = process.env.MCP_RESOURCE_URL || process.env.NEXT_PUBLIC_MCP_RESOURCE_URL
  if (configured) return configured.replace(/\/$/u, '')
  const origin = (requestOrigin || process.env.NEXTAUTH_URL || 'http://localhost:3000').replace(/\/$/u, '')
  return `${origin}/api/mcp`
}

export function oauthIssuer(requestOrigin?: string): string {
  const configured = process.env.MCP_OAUTH_ISSUER_URL
  if (configured) return configured.replace(/\/$/u, '')
  const origin = (requestOrigin || process.env.NEXTAUTH_URL || 'http://localhost:3000').replace(/\/$/u, '')
  return origin
}

function normalizeScopes(scope: string | string[] | undefined): MerchantAgentScope[] {
  const values = Array.isArray(scope) ? scope : typeof scope === 'string' ? scope.split(/\s+/u).filter(Boolean) : MCP_OAUTH_DEFAULT_SCOPES
  try {
    return normalizeMerchantAgentScopes(values)
  } catch {
    throw new MerchantOAuthError('invalid_scope', 'One or more requested scopes are not supported.', 400)
  }
}

function validateRedirectUri(value: unknown): string {
  if (typeof value !== 'string' || value.length > 2000) {
    throw new MerchantOAuthError('invalid_request', 'redirect_uri is required.', 400)
  }
  let parsed: URL
  try {
    parsed = new URL(value)
  } catch {
    throw new MerchantOAuthError('invalid_request', 'redirect_uri must be an absolute URL.', 400)
  }
  const isLocalhost = parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1' || parsed.hostname === '[::1]'
  if (parsed.username || parsed.password || parsed.hash) {
    throw new MerchantOAuthError('invalid_request', 'redirect_uri cannot contain credentials or a fragment.', 400)
  }
  if (parsed.protocol !== 'https:' && !(isLocalhost && parsed.protocol === 'http:')) {
    throw new MerchantOAuthError('invalid_request', 'redirect_uri must use HTTPS, except localhost development clients.', 400)
  }
  if (isLocalhost) parsed.hostname = 'localhost'
  return parsed.toString()
}

export function assertResource(resource: string | null | undefined, expected: string): string {
  if (!resource) {
    throw new MerchantOAuthError('invalid_target', 'The OAuth resource parameter is required.', 400)
  }
  if (resource !== expected) {
    throw new MerchantOAuthError('invalid_target', 'The OAuth resource does not match the VisuTry MCP endpoint.', 400)
  }
  return expected
}

export async function registerMcpOAuthClient(input: {
  clientName?: unknown
  redirectUris?: unknown
  tokenEndpointAuthMethod?: unknown
  grantTypes?: unknown
  responseTypes?: unknown
  applicationType?: unknown
}): Promise<OAuthClientMetadata> {
  const clientName = typeof input.clientName === 'string' && input.clientName.trim()
    ? input.clientName.trim().slice(0, 160)
    : 'MCP client'
  if (!Array.isArray(input.redirectUris) || input.redirectUris.length === 0 || input.redirectUris.length > 20) {
    throw new MerchantOAuthError('invalid_client_metadata', 'redirect_uris must contain between 1 and 20 URLs.', 400)
  }
  const redirectUris = [...new Set(input.redirectUris.map(validateRedirectUri))]
  if (input.applicationType !== undefined && input.applicationType !== 'native' && input.applicationType !== 'web') {
    throw new MerchantOAuthError('invalid_client_metadata', 'application_type must be native or web.', 400)
  }
  if (input.applicationType === 'native' && redirectUris.some((uri) => !isLocalhostRedirectUri(uri))) {
    throw new MerchantOAuthError('invalid_client_metadata', 'Native clients must use localhost HTTP redirect URIs.', 400)
  }
  if (input.applicationType === 'web' && redirectUris.some((uri) => new URL(uri).protocol !== 'https:')) {
    throw new MerchantOAuthError('invalid_client_metadata', 'Web clients must use HTTPS redirect URIs.', 400)
  }
  validateRegistrationArray(input.grantTypes, ['authorization_code', 'refresh_token'], 'grant_types', 'authorization_code')
  validateRegistrationArray(input.responseTypes, ['code'], 'response_types', 'code')
  if (input.tokenEndpointAuthMethod && input.tokenEndpointAuthMethod !== 'none') {
    throw new MerchantOAuthError('invalid_client_metadata', 'Only public PKCE clients are supported.', 400)
  }
  const client = await prisma.merchantOAuthClient.create({
    data: {
      clientId: `mcp_${randomBytes(18).toString('base64url')}`,
      clientName,
      redirectUris,
      tokenEndpointAuthMethod: 'none',
    },
  })
  return {
    clientId: client.clientId,
    clientName: client.clientName,
    redirectUris: client.redirectUris,
    tokenEndpointAuthMethod: client.tokenEndpointAuthMethod,
  }
}

function isLocalhostRedirectUri(uri: string): boolean {
  const parsed = new URL(uri)
  return parsed.protocol === 'http:' && (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1' || parsed.hostname === '[::1]')
}

function validateRegistrationArray(input: unknown, allowed: string[], field: string, required: string): void {
  if (input === undefined) return
  if (!Array.isArray(input) || input.length === 0 || input.some((value) => typeof value !== 'string' || !allowed.includes(value)) || !input.includes(required)) {
    throw new MerchantOAuthError('invalid_client_metadata', `${field} must include only supported values and include ${required}.`, 400)
  }
}

export async function getMcpOAuthClient(clientId: string): Promise<OAuthClientMetadata> {
  if (isCimdClientId(clientId)) return loadCimdClientMetadata(clientId)
  const client = await prisma.merchantOAuthClient.findUnique({ where: { clientId } })
  if (!client) throw new MerchantOAuthError('invalid_client', 'Unknown OAuth client.', 400)
  return {
    clientId: client.clientId,
    clientName: client.clientName,
    redirectUris: client.redirectUris,
    tokenEndpointAuthMethod: client.tokenEndpointAuthMethod,
  }
}

function isCimdClientId(clientId: string): boolean {
  if (typeof clientId !== 'string' || clientId.length > 2048) return false
  try {
    const parsed = new URL(clientId)
    return parsed.protocol === 'https:'
      && parsed.pathname !== '/'
      && !parsed.username
      && !parsed.password
      && !parsed.search
      && !parsed.hash
  } catch {
    return false
  }
}

export function assertRegisteredRedirectUri(client: OAuthClientMetadata, redirectUri: string): string {
  const normalized = validateRedirectUri(redirectUri)
  const isRegistered = client.redirectUris.some((registeredUri) => {
    try {
      return validateRedirectUri(registeredUri) === normalized
    } catch {
      return false
    }
  })
  if (!isRegistered) {
    throw new MerchantOAuthError('invalid_request', 'redirect_uri is not registered for this client.', 400)
  }
  return normalized
}

export async function createMcpOAuthAuthorizationRequest(input: {
  clientId: string
  redirectUri: string
  responseType: string
  scope?: string
  resource?: string | null
  state?: string | null
  codeChallenge: string
  codeChallengeMethod: string
  expectedResource: string
}): Promise<OAuthAuthorizationRequest> {
  if (input.responseType !== 'code') {
    throw new MerchantOAuthError('unsupported_response_type', 'Only response_type=code is supported.', 400)
  }
  if (!input.codeChallenge || input.codeChallenge.length > 200) {
    throw new MerchantOAuthError('invalid_request', 'code_challenge is required.', 400)
  }
  if (input.codeChallengeMethod !== 'S256') {
    throw new MerchantOAuthError('invalid_request', 'Only PKCE S256 is supported.', 400)
  }
  const client = await getMcpOAuthClient(input.clientId)
  const redirectUri = assertRegisteredRedirectUri(client, input.redirectUri)
  const scopes = normalizeScopes(input.scope)
  const resource = assertResource(input.resource, input.expectedResource)
  const requestId = randomToken('mcp_req_', 24)
  const expiresAt = new Date(Date.now() + MCP_OAUTH_REQUEST_TTL_SECONDS * 1000)
  const row = await prisma.merchantOAuthAuthorizationRequest.create({
    data: {
      requestId,
      clientId: client.clientId,
      redirectUri,
      scopes,
      resource,
      state: input.state || null,
      codeChallenge: input.codeChallenge,
      codeChallengeMethod: input.codeChallengeMethod,
      expiresAt,
    },
  })
  return {
    requestId: row.requestId,
    clientId: row.clientId,
    redirectUri: validateRedirectUri(row.redirectUri),
    scopes: normalizeMerchantAgentScopes(row.scopes),
    resource: row.resource || resource,
    state: row.state,
    codeChallenge: row.codeChallenge,
    codeChallengeMethod: row.codeChallengeMethod,
    userId: row.userId,
    expiresAt: row.expiresAt,
  }
}

export async function getMcpOAuthAuthorizationRequest(requestId: string): Promise<OAuthAuthorizationRequest> {
  const row = await prisma.merchantOAuthAuthorizationRequest.findUnique({ where: { requestId } })
  if (!row || row.expiresAt.getTime() <= Date.now()) {
    throw new MerchantOAuthError('invalid_request', 'The OAuth authorization request expired.', 400)
  }
  return {
    requestId: row.requestId,
    clientId: row.clientId,
    redirectUri: row.redirectUri,
    scopes: normalizeMerchantAgentScopes(row.scopes),
    resource: row.resource || '',
    state: row.state,
    codeChallenge: row.codeChallenge,
    codeChallengeMethod: row.codeChallengeMethod,
    userId: row.userId,
    expiresAt: row.expiresAt,
  }
}

export async function attachMcpOAuthAuthorizationRequestUser(requestId: string, userId: string): Promise<void> {
  await prisma.merchantOAuthAuthorizationRequest.update({ where: { requestId }, data: { userId } })
}

function requiresMerchantManager(scopes: readonly MerchantAgentScope[]): boolean {
  return scopes.some((scope) => scope.endsWith(':write'))
}

export async function approveMcpOAuthAuthorization(input: {
  requestId: string
  userId: string
  merchantId: string
}): Promise<{ redirectUri: string; code: string; state: string | null }> {
  const request = await getMcpOAuthAuthorizationRequest(input.requestId)
  if (request.userId && request.userId !== input.userId) {
    throw new MerchantOAuthError('access_denied', 'This authorization request belongs to another user.', 403)
  }
  const membership = await prisma.merchantMembership.findUnique({
    where: { userId_merchantId: { userId: input.userId, merchantId: input.merchantId } },
    select: { id: true, role: true },
  })
  if (!membership || (requiresMerchantManager(request.scopes) && membership.role !== 'OWNER' && membership.role !== 'ADMIN')) {
    throw new MerchantOAuthError('access_denied', 'You do not have permission to grant the requested merchant scopes.', 403)
  }
  const code = randomToken('mcp_code_', 32)
  await prisma.$transaction(async (tx) => {
    await tx.merchantOAuthAuthorizationCode.create({
      data: {
        codeHash: hashToken(code),
        clientId: request.clientId,
        userId: input.userId,
        merchantId: input.merchantId,
        redirectUri: request.redirectUri,
        scopes: request.scopes,
        resource: request.resource,
        codeChallenge: request.codeChallenge,
        codeChallengeMethod: request.codeChallengeMethod,
        expiresAt: new Date(Date.now() + MCP_OAUTH_AUTHORIZATION_CODE_TTL_SECONDS * 1000),
      },
    })
    await tx.merchantOAuthAuthorizationRequest.delete({ where: { requestId: input.requestId } })
  })
  return { redirectUri: request.redirectUri, code, state: request.state }
}

function verifyPkce(codeVerifier: string, codeChallenge: string): boolean {
  const actual = createHash('sha256').update(codeVerifier, 'utf8').digest('base64url')
  return constantTimeEqual(actual, codeChallenge)
}

type OAuthTokenClient = Pick<typeof prisma, 'merchantOAuthAccessToken' | 'merchantOAuthRefreshToken'>
type OAuthFamilyTransactionClient = OAuthTokenClient & Pick<typeof prisma, 'merchantOAuthAuthorization'>

async function revokeMcpOAuthAuthorizationFamily(tx: OAuthFamilyTransactionClient, authorizationId: string, revokedAt = new Date()): Promise<void> {
  await tx.merchantOAuthAuthorization.update({
    where: { id: authorizationId },
    data: { status: 'REVOKED', revokedAt },
  })
  await tx.merchantOAuthAccessToken.updateMany({
    where: { authorizationId, revokedAt: null },
    data: { revokedAt },
  })
  await tx.merchantOAuthRefreshToken.updateMany({
    where: { authorizationId, revokedAt: null },
    data: { revokedAt },
  })
}

async function issueMcpTokens(input: {
  authorizationId: string
  tx?: OAuthTokenClient
  now?: Date
}): Promise<{ accessToken: string; refreshToken: string; expiresIn: number }> {
  const client = input.tx || prisma
  const now = input.now || new Date()
  const accessToken = randomToken('mcp_at_', 32)
  const refreshToken = randomToken('mcp_rt_', 48)
  await client.merchantOAuthAccessToken.create({
    data: {
      tokenHash: hashToken(accessToken),
      authorizationId: input.authorizationId,
      expiresAt: new Date(now.getTime() + MCP_OAUTH_ACCESS_TOKEN_TTL_SECONDS * 1000),
    },
  })
  await client.merchantOAuthRefreshToken.create({
    data: {
      tokenHash: hashToken(refreshToken),
      authorizationId: input.authorizationId,
      expiresAt: new Date(now.getTime() + MCP_OAUTH_REFRESH_TOKEN_TTL_SECONDS * 1000),
    },
  })
  return { accessToken, refreshToken, expiresIn: MCP_OAUTH_ACCESS_TOKEN_TTL_SECONDS }
}

export async function exchangeMcpOAuthCode(input: {
  clientId: string
  code: string
  redirectUri: string
  codeVerifier: string
  resource?: string | null
  expectedResource: string
}) {
  if (!input.codeVerifier) throw new MerchantOAuthError('invalid_grant', 'code_verifier is required.', 400)
  const client = await getMcpOAuthClient(input.clientId)
  const redirectUri = assertRegisteredRedirectUri(client, input.redirectUri)
  const row = await prisma.merchantOAuthAuthorizationCode.findUnique({ where: { codeHash: hashToken(input.code) } })
  if (!row || row.clientId !== client.clientId || validateRedirectUri(row.redirectUri) !== redirectUri || row.usedAt || row.expiresAt.getTime() <= Date.now()) {
    throw new MerchantOAuthError('invalid_grant', 'The authorization code is invalid or expired.', 400)
  }
  assertResource(input.resource, input.expectedResource)
  assertResource(row.resource, input.expectedResource)
  if (row.codeChallengeMethod !== 'S256' || !verifyPkce(input.codeVerifier, row.codeChallenge)) {
    throw new MerchantOAuthError('invalid_grant', 'PKCE verification failed.', 400)
  }
  const result = await prisma.$transaction(async (tx) => {
    const claimed = await tx.merchantOAuthAuthorizationCode.updateMany({ where: { id: row.id, usedAt: null }, data: { usedAt: new Date() } })
    if (claimed.count !== 1) throw new MerchantOAuthError('invalid_grant', 'The authorization code was already used.', 400)
    const authorization = await tx.merchantOAuthAuthorization.create({
      data: {
        clientId: row.clientId,
        userId: row.userId,
        merchantId: row.merchantId,
        scopes: row.scopes,
        resource: row.resource || input.expectedResource,
      },
    })
    const tokens = await issueMcpTokens({ authorizationId: authorization.id, tx })
    return { authorization, tokens }
  })
  return { ...result.tokens, scope: row.scopes.join(' '), resource: row.resource || input.expectedResource }
}

export async function refreshMcpOAuthToken(input: { refreshToken: string; resource?: string | null; expectedResource: string }) {
  assertResource(input.resource, input.expectedResource)
  const row = await prisma.merchantOAuthRefreshToken.findUnique({
    where: { tokenHash: hashToken(input.refreshToken) },
    include: { authorization: true },
  })
  if (!row || row.expiresAt.getTime() <= Date.now() || row.authorization.status !== 'ACTIVE' || row.authorization.resource !== input.expectedResource) {
    throw new MerchantOAuthError('invalid_grant', 'The refresh token is invalid or expired.', 400)
  }
  if (row.revokedAt) {
    await prisma.$transaction(async (tx) => revokeMcpOAuthAuthorizationFamily(tx, row.authorizationId))
    throw new MerchantOAuthError('invalid_grant', 'Refresh token reuse detected; fresh authorization is required.', 400)
  }
  const result = await prisma.$transaction(async (tx) => {
    const claimed = await tx.merchantOAuthRefreshToken.updateMany({ where: { id: row.id, revokedAt: null }, data: { revokedAt: new Date(), lastUsedAt: new Date() } })
    if (claimed.count !== 1) {
      await revokeMcpOAuthAuthorizationFamily(tx, row.authorizationId)
      return null
    }
    const tokens = await issueMcpTokens({ authorizationId: row.authorizationId, tx })
    await tx.merchantOAuthRefreshToken.update({ where: { tokenHash: hashToken(tokens.refreshToken) }, data: { rotatedFromId: row.id } })
    await tx.merchantOAuthAuthorization.update({ where: { id: row.authorizationId }, data: { lastUsedAt: new Date() } })
    return tokens
  })
  if (!result) throw new MerchantOAuthError('invalid_grant', 'Refresh token reuse detected; fresh authorization is required.', 400)
  return { ...result, scope: row.authorization.scopes.join(' '), resource: row.authorization.resource }
}

export async function revokeMcpOAuthToken(rawToken: string): Promise<void> {
  const hash = hashToken(rawToken)
  await prisma.$transaction([
    prisma.merchantOAuthAccessToken.updateMany({ where: { tokenHash: hash, revokedAt: null }, data: { revokedAt: new Date() } }),
    prisma.merchantOAuthRefreshToken.updateMany({ where: { tokenHash: hash, revokedAt: null }, data: { revokedAt: new Date() } }),
  ])
}

export async function listMerchantOAuthAuthorizations(input: { userId: string; merchantId: string }) {
  await requireMerchantMembership({ userId: input.userId, merchantId: input.merchantId, roles: ['OWNER', 'ADMIN'] })
  return prisma.merchantOAuthAuthorization.findMany({
    where: { merchantId: input.merchantId },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      clientId: true,
      userId: true,
      merchantId: true,
      scopes: true,
      status: true,
      createdAt: true,
      lastUsedAt: true,
      revokedAt: true,
    },
  })
}

export async function revokeMerchantOAuthAuthorization(input: { userId: string; merchantId: string; authorizationId: string }) {
  await requireMerchantMembership({ userId: input.userId, merchantId: input.merchantId, roles: ['OWNER', 'ADMIN'] })
  const authorization = await prisma.merchantOAuthAuthorization.findFirst({ where: { id: input.authorizationId, merchantId: input.merchantId } })
  if (!authorization) throw new MerchantOAuthError('not_found', 'OAuth authorization was not found.', 404)
  const revokedAt = new Date()
  await prisma.$transaction([
    prisma.merchantOAuthAuthorization.update({ where: { id: authorization.id }, data: { status: 'REVOKED', revokedAt } }),
    prisma.merchantOAuthAccessToken.updateMany({ where: { authorizationId: authorization.id, revokedAt: null }, data: { revokedAt } }),
    prisma.merchantOAuthRefreshToken.updateMany({ where: { authorizationId: authorization.id, revokedAt: null }, data: { revokedAt } }),
    prisma.merchantOperationAudit.create({
      data: {
        merchantId: input.merchantId,
        actorType: 'HUMAN',
        actorId: input.userId,
        action: 'oauth.authorization.revoked',
        resourceType: 'MerchantOAuthAuthorization',
        resourceId: authorization.id,
        result: 'SUCCESS',
      },
    }),
  ])
  return { id: authorization.id, status: 'REVOKED' as const, revokedAt }
}

export async function authenticateMerchantOAuthAccessToken(rawToken: string, expectedResource: string): Promise<AgentMerchantActor> {
  const row = await prisma.merchantOAuthAccessToken.findUnique({
    where: { tokenHash: hashToken(rawToken) },
    include: { authorization: true },
  })
  if (!row || row.revokedAt || row.expiresAt.getTime() <= Date.now() || row.authorization.status !== 'ACTIVE' || row.authorization.resource !== expectedResource) {
    throw new InvalidAgentCredentialError()
  }
  await prisma.$transaction([
    prisma.merchantOAuthAccessToken.update({ where: { id: row.id }, data: { lastUsedAt: new Date() } }),
    prisma.merchantOAuthAuthorization.update({ where: { id: row.authorizationId }, data: { lastUsedAt: new Date() } }),
  ])
  return {
    actorType: 'AGENT_OAUTH',
    actorId: row.id,
    userId: row.authorization.userId,
    authorizationId: row.authorizationId,
    merchantId: row.authorization.merchantId,
    scopes: normalizeMerchantAgentScopes(row.authorization.scopes),
  }
}

export async function authenticateMerchantMcpBearer(rawToken: string, expectedResource: string): Promise<AgentMerchantActor> {
  if (rawToken.startsWith('vt_live_')) {
    const { authenticateMerchantAgentCredential } = await import('./merchant-agent-credentials')
    return authenticateMerchantAgentCredential(rawToken)
  }
  return authenticateMerchantOAuthAccessToken(rawToken, expectedResource)
}
