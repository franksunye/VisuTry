import { isLoopbackDatabaseUrl } from '../../src/lib/app-environment'

const LOCAL_DATABASE_IDENTITY = 'local:127.0.0.1:5433/visutry_local'
const ISOLATED_DEMO_DATABASE_NAME = /^visutry_demo_e2e_[a-z0-9_]{1,40}$/
const DEMO_SLUG = 'visutry-demo-optical'
const DEMO_NAME = 'VisuTry Demo Optical'
const ACCEPTED_CLASSIFICATION_SOURCES = new Set([
  'LOCAL_DEMO_FIXTURE',
  'WHITEPAPER_DEMO_PHASE_2B_2B',
])
const LOCAL_MOCK_BLOB_ORIGIN = 'https://mock-blob-storage.vercel.app'

function safeMerchantPathSegment(merchantId: string): boolean {
  return /^[A-Za-z0-9_-]{1,128}$/.test(merchantId)
}

export function localDemoShopperMediaPrefixes(merchantId: string): string[] {
  if (!safeMerchantPathSegment(merchantId)) {
    throw new Error('Refusing: Demo Merchant id is not a safe Local media path segment.')
  }
  return [
    `store/${merchantId}/sessions/`,
    `tryon/user/store/${merchantId}/`,
    `tryon/item/store/${merchantId}/`,
    `tryon/result/store/${merchantId}/`,
  ]
}

export function isLocalDemoShopperMediaPathname(pathname: string, merchantId: string): boolean {
  if (!safeMerchantPathSegment(merchantId)
    || !pathname
    || pathname.startsWith('/')
    || pathname.includes('\\')
    || pathname.includes('\0')) return false

  const segments = pathname.split('/')
  if (segments.some((segment) => !segment || segment === '.' || segment === '..')) return false
  const uuid = '[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}'
  const taskId = '[A-Za-z0-9_-]{1,128}'
  const merchant = merchantId

  if (segments.length === 5
    && segments[0] === 'store'
    && segments[1] === merchant
    && segments[2] === 'sessions'
    && /^[A-Za-z0-9_-]{1,128}$/.test(segments[3])) {
    return new RegExp(`^photo-${uuid}\\.(?:jpg|png|webp)$`, 'i').test(segments[4])
  }

  if (segments.length === 5
    && segments[0] === 'tryon'
    && (segments[1] === 'user' || segments[1] === 'item')
    && segments[2] === 'store'
    && segments[3] === merchant) {
    return new RegExp(`^${taskId}-v\\d+-${uuid}$`, 'i').test(segments[4])
  }

  if (segments.length === 5
    && segments[0] === 'tryon'
    && segments[1] === 'result'
    && segments[2] === 'store'
    && segments[3] === merchant) {
    return new RegExp(`^${taskId}\\.png$`, 'i').test(segments[4])
  }

  return false
}

export function localDemoShopperMediaPathnameFromReference(
  reference: string | null | undefined,
  merchantId: string,
): string | null {
  if (!reference) return null
  let pathname: string

  if (/^https?:\/\//i.test(reference)) {
    let url: URL
    try {
      url = new URL(reference)
    } catch {
      return null
    }
    if (url.origin !== LOCAL_MOCK_BLOB_ORIGIN) return null
    try {
      pathname = url.pathname.slice(1).split('/').map((segment) => decodeURIComponent(segment)).join('/')
    } catch {
      throw new Error('Refusing: a Local mock media reference has invalid path encoding.')
    }
  } else {
    pathname = reference
  }

  if (isLocalDemoShopperMediaPathname(pathname, merchantId)) return pathname
  const isWithinDemoShopperNamespace = localDemoShopperMediaPrefixes(merchantId)
    .some((prefix) => pathname.startsWith(prefix))
  if (isWithinDemoShopperNamespace) {
    throw new Error('Refusing: a Demo shopper media reference does not match an approved Local path shape.')
  }
  return null
}

export function assertLocalDemoShopperMediaPathname(pathname: string, merchantId: string): void {
  if (!isLocalDemoShopperMediaPathname(pathname, merchantId)) {
    throw new Error('Refusing: Local media cleanup found an object outside the exact Demo shopper namespaces.')
  }
}

export function localDemoTryOnTaskScope(merchantId: string, taskIds: readonly string[]) {
  return {
    merchantId,
    tryOnTaskId: { in: [...taskIds] },
  }
}

export function resolveLocalDemoDatabaseIdentity(env: Record<string, string | undefined>): string {
  const value = env.DATABASE_URL
  if (!value) throw new Error('Refusing: DATABASE_URL must target an approved loopback Local Demo database.')
  let parsed: URL
  try {
    parsed = new URL(value)
  } catch {
    throw new Error('Refusing: DATABASE_URL is not a valid PostgreSQL URL.')
  }
  const databaseName = decodeURIComponent(parsed.pathname.replace(/^\//, ''))
  const port = parsed.port || '5432'
  if (!isLoopbackDatabaseUrl(value) || parsed.hostname !== '127.0.0.1' || !/^\d{1,5}$/.test(port)) {
    throw new Error('Refusing: Local Demo database must use 127.0.0.1 and a valid loopback port.')
  }
  const identity = `local:127.0.0.1:${port}/${databaseName}`
  const canonical = identity === LOCAL_DATABASE_IDENTITY
  const isolated = env.VISUTRY_LOCAL_DEMO_ISOLATED_DATABASE === '1'
    && ISOLATED_DEMO_DATABASE_NAME.test(databaseName)
    && identity !== LOCAL_DATABASE_IDENTITY
  if (!canonical && !isolated) {
    throw new Error('Refusing: use the canonical Local Demo database or an explicitly marked visutry_demo_e2e_* database.')
  }
  if (env.VISUTRY_DATABASE_IDENTITY !== identity) {
    throw new Error('Refusing: Local Demo database identity marker must exactly match DATABASE_URL.')
  }
  return identity
}

function assertDatabaseTarget(value: string | undefined, name: string, expectedIdentity: string): void {
  if (!value) throw new Error(`Refusing: ${name} must target the same approved loopback Local Demo database.`)
  let parsed: URL
  try {
    parsed = new URL(value)
  } catch {
    throw new Error(`Refusing: ${name} is not a valid PostgreSQL URL.`)
  }
  const expected = new URL(`postgresql://${expectedIdentity.replace(/^local:/, '')}`)
  if (!isLoopbackDatabaseUrl(value)
    || parsed.hostname !== '127.0.0.1'
    || (parsed.port || '5432') !== expected.port
    || decodeURIComponent(parsed.pathname) !== expected.pathname) {
    throw new Error(`Refusing: ${name} must target the same approved Local Demo database as DATABASE_URL.`)
  }
}

export function assertLocalDemoSessionResetEnvironment(env: Record<string, string | undefined>): string {
  if (env.APP_ENV?.trim().toLowerCase() !== 'local' || env.VERCEL_ENV || env.VERCEL) {
    throw new Error('Refusing: session reset requires explicit APP_ENV=local outside Vercel.')
  }
  if (env.NODE_ENV === 'production') throw new Error('Refusing: NODE_ENV=production is not allowed.')
  if (env.ENABLE_MOCKS?.trim().toLowerCase() !== 'true') {
    throw new Error('Refusing: Local TEST mock mode must be enabled.')
  }
  if (env.VISUTRY_LOCAL_DEMO_RUNTIME !== '1') {
    throw new Error('Refusing: Local Demo runtime marker must be enabled for reset.')
  }
  if (env.VISUTRY_LOCAL_DEMO_PROVIDER_MODE !== 'blocked') {
    throw new Error('Refusing: Local Demo providers must be blocked during reset.')
  }
  if (env.STRIPE_MERCHANT_BILLING_MODE?.trim().toLowerCase() !== 'test') {
    throw new Error('Refusing: Stripe Merchant billing mode must be TEST.')
  }
  if (env.STRIPE_SECRET_KEY && !env.STRIPE_SECRET_KEY.startsWith('sk_test_')) {
    throw new Error('Refusing: a non-TEST Stripe secret is present.')
  }
  const expectedDatabaseIdentity = resolveLocalDemoDatabaseIdentity(env)
  assertDatabaseTarget(env.DATABASE_URL, 'DATABASE_URL', expectedDatabaseIdentity)
  if (env.DATABASE_URL_UNPOOLED) assertDatabaseTarget(env.DATABASE_URL_UNPOOLED, 'DATABASE_URL_UNPOOLED', expectedDatabaseIdentity)

  const localDemoPort = env.VISUTRY_LOCAL_DEMO_PORT?.trim() || '3001'
  if (!['3001', '3002'].includes(localDemoPort)) {
    throw new Error('Refusing: VISUTRY_LOCAL_DEMO_PORT must be 3001 or 3002.')
  }

  for (const key of ['NEXTAUTH_URL', 'NEXT_PUBLIC_SITE_URL'] as const) {
    let parsed: URL
    try {
      parsed = new URL(env[key] || '')
    } catch {
      throw new Error(`Refusing: ${key} must point to the Local Demo application.`)
    }
    if (parsed.protocol !== 'http:' || parsed.hostname !== '127.0.0.1' || parsed.port !== localDemoPort) {
      throw new Error(`Refusing: ${key} must point to http://127.0.0.1:${localDemoPort}.`)
    }
  }

  if (env.MCP_RESOURCE_URL) {
    let parsed: URL
    try {
      parsed = new URL(env.MCP_RESOURCE_URL)
    } catch {
      throw new Error('Refusing: MCP_RESOURCE_URL is invalid.')
    }
    if (parsed.protocol !== 'http:' || parsed.hostname !== '127.0.0.1' || parsed.port !== localDemoPort) {
      throw new Error('Refusing: MCP_RESOURCE_URL must be absent or point to the Local Demo application.')
    }
  }
  return expectedDatabaseIdentity
}

export function assertLocalDemoMerchantIdentity(input: {
  slug: string
  name: string
  classification: string
  classificationSource: string | null
  pilotType: string
  referenceData: boolean
}): void {
  if (input.slug !== DEMO_SLUG
    || input.name !== DEMO_NAME
    || input.classification !== 'TEST'
    || !input.classificationSource
    || !ACCEPTED_CLASSIFICATION_SOURCES.has(input.classificationSource)
    || input.pilotType !== 'DEMO'
    || input.referenceData) {
    throw new Error('Refusing: target Merchant is not the dedicated Local TEST Demo fixture.')
  }
}

export function assertDemoStoreIdentity(input: {
  slug: string
  type: string
  referenceMetadata: unknown
}): void {
  const metadata = input.referenceMetadata
  if (input.slug !== 'store'
    || input.type !== 'STORE'
    || !metadata
    || typeof metadata !== 'object'
    || !('ownership' in metadata)
    || metadata.ownership !== 'VISUTRY'
    || !('purpose' in metadata)
    || !['LOCAL_DEMO', 'WHITE_PAPER_DEMO'].includes(String(metadata.purpose))) {
    throw new Error('Refusing: target experience is not the dedicated VisuTry Demo Store.')
  }
}

export function selectManagedDemoStore<T extends {
  slug: string
  type: string
  referenceMetadata: unknown
}>(experiences: T[]): T {
  const stores = experiences.filter((experience) => experience.type === 'STORE')
  if (stores.length !== 1) {
    throw new Error('Refusing: the dedicated Demo Merchant must have exactly one managed Store.')
  }
  assertDemoStoreIdentity(stores[0])
  return stores[0]
}

export async function assertDemoServerStopped(
  isListening: (host: string, port: number) => Promise<boolean>,
  port = 3001,
): Promise<void> {
  if (await isListening('127.0.0.1', port)) {
    throw new Error('Refusing: stop the Local Demo app before reset to avoid racing active Local shopper writes.')
  }
}
