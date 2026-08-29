
import { assertDatabaseEnvironment, databaseIdentityFromUrl } from '@/lib/app-environment'

export const PREVIEW_QA_CLASSIFICATION_SOURCE = 'G4C_PREVIEW_QA_HARNESS'
export const PREVIEW_QA_REASON_PREFIX = 'G4-C Preview QA harness'
export const PREVIEW_QA_ENVIRONMENT = 'preview' as const

export const PREVIEW_QA_MERCHANTS = Object.freeze({
  'QA-FREE': { slug: 'g4c-qa-free', name: 'G4-C QA-FREE' },
  'QA-PILOT': { slug: 'g4c-qa-pilot', name: 'G4-C QA-PILOT' },
  'QA-SUBSCRIPTION': { slug: 'g4c-qa-subscription', name: 'G4-C QA-SUBSCRIPTION' },
  'QA-USAGE': { slug: 'g4c-qa-usage', name: 'G4-C QA-USAGE' },
} as const)

export type PreviewQaMerchantAlias = keyof typeof PREVIEW_QA_MERCHANTS

export const PREVIEW_QA_USAGE_THRESHOLDS = [69, 70, 90, 100] as const
export type PreviewQaUsageThreshold = (typeof PREVIEW_QA_USAGE_THRESHOLDS)[number]

export class PreviewQaGuardError extends Error {
  readonly code: string

  constructor(code: string, message: string) {
    super(message)
    this.name = 'PreviewQaGuardError'
    this.code = code
  }
}

export type PreviewQaEnvironment = {
  environment: typeof PREVIEW_QA_ENVIRONMENT
  stripeMode: 'test'
  qaFlag: '1'
}

type PreviewEnvironmentMetadataClient = Parameters<typeof assertDatabaseEnvironment>[0]['client']

function hasProductionHost(value: string | undefined): boolean {
  if (!value) return false
  try {
    const host = new URL(value).hostname.toLowerCase()
    return host === 'visutry.com' || host === 'www.visutry.com'
  } catch {
    return value.toLowerCase().includes('www.visutry.com') || value.toLowerCase().includes('visutry.com')
  }
}

/** Fail closed before any database or Stripe operation. */
export function validatePreviewQaEnvironment(env: Record<string, string | undefined> = process.env): PreviewQaEnvironment {
  if (env.VERCEL_ENV?.trim().toLowerCase() === 'production') {
    throw new PreviewQaGuardError('PRODUCTION_FORBIDDEN', 'Preview QA harness refuses to run in Production.')
  }
  if (hasProductionHost(env.NEXT_PUBLIC_SITE_URL) || hasProductionHost(env.NEXT_PUBLIC_APP_URL)) {
    throw new PreviewQaGuardError('PRODUCTION_HOST_FORBIDDEN', 'Preview QA harness refuses a production application URL.')
  }
  if (env.VERCEL_ENV?.trim().toLowerCase() !== PREVIEW_QA_ENVIRONMENT) {
    throw new PreviewQaGuardError('PREVIEW_ENV_REQUIRED', 'Preview QA harness requires VERCEL_ENV=preview.')
  }
  if (env.APP_ENV?.trim().toLowerCase() !== PREVIEW_QA_ENVIRONMENT) {
    throw new PreviewQaGuardError('APP_ENV_REQUIRED', 'Preview QA harness requires APP_ENV=preview.')
  }
  if (env.VISUTRY_PREVIEW_QA !== '1') {
    throw new PreviewQaGuardError('QA_FLAG_REQUIRED', 'Set VISUTRY_PREVIEW_QA=1 to enable the Preview QA harness.')
  }
  if (env.STRIPE_MERCHANT_BILLING_MODE?.trim().toLowerCase() !== 'test') {
    throw new PreviewQaGuardError('STRIPE_TEST_REQUIRED', 'Preview QA requires STRIPE_MERCHANT_BILLING_MODE=test.')
  }
  if (!(env.STRIPE_SECRET_KEY?.trim() ?? '').startsWith('sk_test_')) {
    throw new PreviewQaGuardError('STRIPE_TEST_KEY_REQUIRED', 'Preview QA requires a Stripe TEST secret key.')
  }
  const configuredIdentity = env.VISUTRY_DATABASE_IDENTITY?.trim()
  if (!configuredIdentity) {
    throw new PreviewQaGuardError('DATABASE_IDENTITY_REQUIRED', 'Preview QA requires VISUTRY_DATABASE_IDENTITY.')
  }
  const actualIdentity = databaseIdentityFromUrl(env.DATABASE_URL)
  if (!actualIdentity) throw new PreviewQaGuardError('DATABASE_URL_REQUIRED', 'Preview QA requires a valid DATABASE_URL.')
  return { environment: PREVIEW_QA_ENVIRONMENT, stripeMode: 'test', qaFlag: '1' }
}

/** Database marker check used before every Preview QA read or mutation. */
export async function assertPreviewQaDatabaseIdentity(client: PreviewEnvironmentMetadataClient, env: Record<string, string | undefined> = process.env) {
  validatePreviewQaEnvironment(env)
  try {
    return await assertDatabaseEnvironment({
      client,
      expectedEnvironment: 'preview',
      expectedDatabaseIdentity: env.VISUTRY_DATABASE_IDENTITY!.trim(),
    })
  } catch (error) {
    throw new PreviewQaGuardError('DATABASE_IDENTITY_MISMATCH', error instanceof Error ? error.message : String(error))
  }
}

export function parsePreviewQaMerchantAlias(value: unknown): PreviewQaMerchantAlias {
  const normalized = String(value ?? '').trim().toUpperCase()
  if (!(normalized in PREVIEW_QA_MERCHANTS)) {
    throw new PreviewQaGuardError('QA_MERCHANT_REQUIRED', `Merchant must be one of: ${Object.keys(PREVIEW_QA_MERCHANTS).join(', ')}.`)
  }
  return normalized as PreviewQaMerchantAlias
}

export function assertPreviewQaMerchant(row: { id: string; classification: string }, alias?: PreviewQaMerchantAlias): void {
  const classification = row.classification.trim().toUpperCase()
  if (classification === 'REAL') {
    throw new PreviewQaGuardError('REAL_MERCHANT_FORBIDDEN', `Refusing to mutate REAL Merchant ${row.id}.`)
  }
  if (classification !== 'TEST') {
    throw new PreviewQaGuardError('TEST_MERCHANT_REQUIRED', `Preview QA requires classification TEST; Merchant ${row.id} is ${classification || 'UNKNOWN'}.`)
  }
  if (alias && !PREVIEW_QA_MERCHANTS[alias]) {
    throw new PreviewQaGuardError('QA_MERCHANT_REQUIRED', 'Target is not a supported Preview QA Merchant.')
  }
}

export function usageCountForThreshold(included: number, percentage: PreviewQaUsageThreshold): number {
  if (!Number.isInteger(included) || included <= 0) throw new PreviewQaGuardError('USAGE_LIMIT_REQUIRED', 'The canonical AI Commerce Session limit must be a positive integer.')
  const used = Math.round(included * percentage / 100)
  if (Math.round((used / included) * 100) !== percentage) throw new PreviewQaGuardError('THRESHOLD_UNREPRESENTABLE', `${percentage}% cannot be represented for an allowance of ${included}.`)
  return used
}
