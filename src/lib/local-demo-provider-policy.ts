export type LocalDemoProviderPolicy =
  | { kind: 'not-local-demo' }
  | { kind: 'blocked' }
  | { kind: 'grsai'; apiKey: string; baseUrl: string }
  | { kind: 'misconfigured'; reason: string }

const APPROVED_GRSAI_HOST = 'grsaiapi.com'

export function resolveLocalDemoProviderPolicy(
  env: Record<string, string | undefined> = process.env,
): LocalDemoProviderPolicy {
  if (env.VISUTRY_LOCAL_DEMO_RUNTIME !== '1') return { kind: 'not-local-demo' }
  if (env.APP_ENV !== 'local' || env.VERCEL_ENV) {
    return { kind: 'misconfigured', reason: 'Local Demo runtime requires APP_ENV=local outside Vercel.' }
  }

  const mode = env.VISUTRY_LOCAL_DEMO_PROVIDER_MODE?.trim().toLowerCase() || 'blocked'
  if (mode === 'blocked') return { kind: 'blocked' }
  if (mode !== 'grsai') {
    return { kind: 'misconfigured', reason: 'Local Demo provider mode must be blocked or grsai.' }
  }

  const apiKey = env.GRSAI_API_KEY?.trim()
  if (!apiKey) {
    return { kind: 'misconfigured', reason: 'Armed Local Demo requires an explicit GRSAI_API_KEY.' }
  }
  if (!env.GRSAI_BASE_URL?.trim()) {
    return { kind: 'misconfigured', reason: 'Armed Local Demo requires an explicit GRSAI_BASE_URL.' }
  }

  let base: URL
  try {
    base = new URL(env.GRSAI_BASE_URL)
  } catch {
    return { kind: 'misconfigured', reason: 'GRSAI_BASE_URL is not a valid URL.' }
  }
  if (
    base.protocol !== 'https:' ||
    base.hostname.toLowerCase() !== APPROVED_GRSAI_HOST ||
    base.username || base.password || base.search || base.hash ||
    (base.pathname !== '/' && base.pathname !== '')
  ) {
    return { kind: 'misconfigured', reason: `GRSAI_BASE_URL must use the approved https://${APPROVED_GRSAI_HOST} origin.` }
  }

  return { kind: 'grsai', apiKey, baseUrl: `https://${APPROVED_GRSAI_HOST}` }
}

export function isLocalDemoDecisionResultFixtureEnabled(
  env: Record<string, string | undefined> = process.env,
): boolean {
  return env.APP_ENV === 'local' &&
    env.VERCEL_ENV === undefined &&
    env.VISUTRY_LOCAL_DEMO_RUNTIME === '1' &&
    env.ENABLE_MOCKS === 'true' &&
    env.TEST_MODE === 'true' &&
    env.P1_M5_LOCAL_DECISION_RESULT_E2E === '1' &&
    env.NODE_ENV !== 'production'
}

export function localDemoGeminiDispatchAllowed(
  env: Record<string, string | undefined> = process.env,
): boolean {
  return env.VISUTRY_LOCAL_DEMO_RUNTIME !== '1'
}
