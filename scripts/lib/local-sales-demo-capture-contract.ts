import { resolveLocalDemoProviderPolicy } from '../../src/lib/local-demo-provider-policy'
import { resolveRuntimePostgresProvider } from '../../src/lib/postgres-runtime'

export type LocalSalesDemoScene = {
  id: string
  name: string
  file: string
  purpose: string
}

export const LOCAL_SALES_DEMO_SCENES: LocalSalesDemoScene[] = [
  {
    id: '01',
    name: 'Store Entry',
    file: '01-store-entry.webm',
    purpose: 'Establish the working VisuTry Demo Optical Store and shopper entry.',
  },
  {
    id: '02',
    name: 'Face Intelligence',
    file: '02-face-intelligence.webm',
    purpose: 'Show on-device Face Intelligence and the shopper fit summary.',
  },
  {
    id: '03',
    name: 'Recommendation',
    file: '03-recommendation.webm',
    purpose: 'Show the real deterministic personalized recommendation state.',
  },
  {
    id: '04',
    name: 'Frame Selection',
    file: '04-frame-selection.webm',
    purpose: 'Show catalog selection and reach Try-On entry without submitting.',
  },
]

function assertLocalUrl(value: string | undefined, expectedPort: number, label: string): void {
  if (!value) throw new Error(`${label} is required and must point to Local loopback.`)
  let parsed: URL
  try {
    parsed = new URL(value)
  } catch {
    throw new Error(`${label} must be a valid Local loopback URL.`)
  }
  if (!['127.0.0.1', 'localhost'].includes(parsed.hostname) || Number(parsed.port) !== expectedPort) {
    throw new Error(`${label} must use the approved Local loopback port ${expectedPort}.`)
  }
}

function assertLocalDatabaseUrl(value: string | undefined, label: string): void {
  if (!value) throw new Error(`${label} is required and must use Local PostgreSQL.`)
  let parsed: URL
  try {
    parsed = new URL(value)
  } catch {
    throw new Error(`${label} must be a valid Local PostgreSQL URL.`)
  }
  const host = parsed.hostname.toLowerCase().replace(/^\[|\]$/g, '')
  const database = decodeURIComponent(parsed.pathname.replace(/^\//, ''))
  if (!['127.0.0.1', 'localhost', '::1'].includes(host) || Number(parsed.port || 5432) !== 5433 || database !== 'visutry_local') {
    throw new Error(`${label} must point to 127.0.0.1:5433/visutry_local.`)
  }
}

export function assertLocalSalesDemoCaptureEnvironment(env: Record<string, string | undefined>): void {
  if (env.CI) throw new Error('Sales-demo scene capture is local-only and refuses CI.')
  if (env.VERCEL || env.VERCEL_ENV) throw new Error('Sales-demo scene capture refuses Vercel environments.')
  if (env.APP_ENV !== 'local') throw new Error('APP_ENV=local is required for sales-demo scene capture.')
  if (env.NODE_ENV === 'production') throw new Error('Sales-demo scene capture refuses NODE_ENV=production.')
  if (env.VISUTRY_LOCAL_DEMO_RUNTIME !== '1') throw new Error('The Local Demo runtime marker is required.')
  if (env.VISUTRY_LOCAL_DEMO_PROVIDER_MODE !== 'blocked') throw new Error('Provider mode must remain blocked for sales-demo capture.')
  if (resolveLocalDemoProviderPolicy(env).kind !== 'blocked') throw new Error('Local Demo provider gate did not resolve to blocked.')

  assertLocalDatabaseUrl(env.DATABASE_URL, 'DATABASE_URL')
  assertLocalDatabaseUrl(env.DATABASE_URL_UNPOOLED || env.DATABASE_URL, 'DATABASE_URL_UNPOOLED')
  if (env.VISUTRY_DATABASE_IDENTITY !== 'local:127.0.0.1:5433/visutry_local') {
    throw new Error('The canonical LOCAL database identity marker is required.')
  }
  if (resolveRuntimePostgresProvider(env) !== 'PRISMA_PG') {
    throw new Error('The Local PrismaPg runtime is required for sales-demo capture.')
  }

  assertLocalUrl(env.NEXTAUTH_URL, 3001, 'NEXTAUTH_URL')
  assertLocalUrl(env.NEXT_PUBLIC_SITE_URL, 3001, 'NEXT_PUBLIC_SITE_URL')
  if (env.STRIPE_MERCHANT_BILLING_MODE?.toLowerCase() !== 'test') {
    throw new Error('Merchant Stripe mode must be TEST for Local sales-demo capture.')
  }
  if (env.STRIPE_SECRET_KEY && !env.STRIPE_SECRET_KEY.startsWith('sk_test_')) {
    throw new Error('A LIVE Stripe key is not allowed for Local sales-demo capture.')
  }
}

export function assertTryOnSubmissionCount(actual: number): void {
  if (actual !== 0) throw new Error(`Sales-demo capture must stop before Try-On submission; observed ${actual}.`)
}
