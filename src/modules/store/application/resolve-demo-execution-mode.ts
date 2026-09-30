import { resolveLocalDemoProviderPolicy } from '@/lib/local-demo-provider-policy'
import { StoreDomainError } from '../domain'
import { isCanonicalVisuTryDemo, type DemoTryOnExecutionMode } from '../domain/prepared-demo-results'
import type { MerchantRecord } from './ports/repositories'

/**
 * Demo mode is server-selected. PREPARED_DEMO is the default in every
 * environment; LIVE_PROVIDER is accepted only through the existing, explicitly
 * armed Local provider-smoke path. Ordinary merchants keep LIVE_TRYON.
 */
export function resolveStoreTryOnExecutionMode(
  merchant: MerchantRecord,
  env: Record<string, string | undefined> = process.env,
): DemoTryOnExecutionMode {
  if (!isCanonicalVisuTryDemo(merchant)) return 'LIVE_TRYON'

  const requested = env.VISUTRY_LOCAL_DEMO_EXECUTION_MODE?.trim().toUpperCase() || 'PREPARED_DEMO'
  if (requested === 'PREPARED_DEMO') return 'PREPARED_DEMO'
  if (requested !== 'LIVE_PROVIDER') {
    throw new StoreDomainError('CAPABILITY_DISABLED', 'The Demo Try-On mode is not configured.', 503)
  }

  const provider = resolveLocalDemoProviderPolicy(env)
  const explicitlyAuthorized = env.VISUTRY_LOCAL_DEMO_PROVIDER_SMOKE === '1'
    && env.VISUTRY_LOCAL_DEMO_PROVIDER_SMOKE_AUTHORIZED === '1'
    && provider.kind === 'grsai'
    && env.APP_ENV === 'local'
    && env.VERCEL_ENV === undefined
    && env.NODE_ENV !== 'production'

  if (!explicitlyAuthorized) {
    throw new StoreDomainError('CAPABILITY_DISABLED', 'Live Demo generation is available only through the authorized Local provider-smoke command.', 403)
  }
  return 'LIVE_PROVIDER'
}
