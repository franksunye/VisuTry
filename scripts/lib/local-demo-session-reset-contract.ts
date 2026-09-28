import { isLoopbackDatabaseUrl } from '../../src/lib/app-environment'

const LOCAL_DATABASE_IDENTITY = 'local:127.0.0.1:5433/visutry_local'
const DEMO_SLUG = 'visutry-demo-optical'
const DEMO_NAME = 'VisuTry Demo Optical'
const ACCEPTED_CLASSIFICATION_SOURCES = new Set([
  'LOCAL_DEMO_FIXTURE',
  'WHITEPAPER_DEMO_PHASE_2B_2B',
])

export function localDemoTryOnTaskScope(merchantId: string, taskIds: readonly string[]) {
  return {
    merchantId,
    tryOnTaskId: { in: [...taskIds] },
  }
}

function assertDatabaseTarget(value: string | undefined, name: string): void {
  if (!value) throw new Error(`Refusing: ${name} must target the canonical Local database.`)
  let parsed: URL
  try {
    parsed = new URL(value)
  } catch {
    throw new Error(`Refusing: ${name} is not a valid PostgreSQL URL.`)
  }
  if (!isLoopbackDatabaseUrl(value)
    || parsed.hostname !== '127.0.0.1'
    || parsed.port !== '5433'
    || parsed.pathname !== '/visutry_local') {
    throw new Error(`Refusing: ${name} must target 127.0.0.1:5433/visutry_local.`)
  }
}

export function assertLocalDemoSessionResetEnvironment(env: Record<string, string | undefined>): void {
  if (env.APP_ENV?.trim().toLowerCase() !== 'local' || env.VERCEL_ENV) {
    throw new Error('Refusing: session reset requires explicit APP_ENV=local outside Vercel.')
  }
  if (env.NODE_ENV === 'production') throw new Error('Refusing: NODE_ENV=production is not allowed.')
  if (env.ENABLE_MOCKS?.trim().toLowerCase() !== 'true') {
    throw new Error('Refusing: Local TEST mock mode must be enabled.')
  }
  if (env.STRIPE_MERCHANT_BILLING_MODE?.trim().toLowerCase() !== 'test') {
    throw new Error('Refusing: Stripe Merchant billing mode must be TEST.')
  }
  if (env.STRIPE_SECRET_KEY && !env.STRIPE_SECRET_KEY.startsWith('sk_test_')) {
    throw new Error('Refusing: a non-TEST Stripe secret is present.')
  }
  if (env.VISUTRY_DATABASE_IDENTITY !== LOCAL_DATABASE_IDENTITY) {
    throw new Error('Refusing: the canonical Local database marker must be explicitly configured.')
  }

  assertDatabaseTarget(env.DATABASE_URL, 'DATABASE_URL')
  if (env.DATABASE_URL_UNPOOLED) assertDatabaseTarget(env.DATABASE_URL_UNPOOLED, 'DATABASE_URL_UNPOOLED')

  for (const key of ['NEXTAUTH_URL', 'NEXT_PUBLIC_SITE_URL'] as const) {
    let parsed: URL
    try {
      parsed = new URL(env[key] || '')
    } catch {
      throw new Error(`Refusing: ${key} must point to the Local Demo application.`)
    }
    if (parsed.protocol !== 'http:' || parsed.hostname !== '127.0.0.1' || parsed.port !== '3001') {
      throw new Error(`Refusing: ${key} must point to http://127.0.0.1:3001.`)
    }
  }

  if (env.MCP_RESOURCE_URL) {
    let parsed: URL
    try {
      parsed = new URL(env.MCP_RESOURCE_URL)
    } catch {
      throw new Error('Refusing: MCP_RESOURCE_URL is invalid.')
    }
    if (parsed.protocol !== 'http:' || parsed.hostname !== '127.0.0.1' || parsed.port !== '3001') {
      throw new Error('Refusing: MCP_RESOURCE_URL must be absent or point to the Local Demo application.')
    }
  }
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

export async function assertDemoServerStopped(
  isListening: (host: string, port: number) => Promise<boolean>,
): Promise<void> {
  if (await isListening('127.0.0.1', 3001)) {
    throw new Error('Refusing: stop the Local Demo app before reset to avoid racing active Local shopper writes.')
  }
}
