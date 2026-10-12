/**
 * Legacy Pilot Delivery Kit seeding is LOCAL QA only. Merchant commercial
 * provisioning uses authenticated canonical application commands; a string
 * confirmation must never turn a script into Production database authority.
 */
export function assertLocalPilotSeedTarget(input: {
  appEnv?: string
  nodeEnv?: string
  vercelEnv?: string
  databaseUrl?: string
  databaseUrlUnpooled?: string
  confirmation?: string
}): void {
  if (input.appEnv !== 'local' ||
      input.nodeEnv === 'production' ||
      input.vercelEnv === 'production') {
    throw new Error('Pilot seed writes are restricted to APP_ENV=local and non-production runtimes.')
  }
  if (input.confirmation !== 'local-test-only') {
    throw new Error('Pilot seed writes require STORE_SEED_CONFIRM=local-test-only.')
  }
  let expectedDatabase: string | null = null
  for (const [name, raw] of [
    ['DATABASE_URL', input.databaseUrl],
    ['DATABASE_URL_UNPOOLED', input.databaseUrlUnpooled],
  ] as const) {
    if (!raw) throw new Error(`Pilot seed requires an explicit local ${name}.`)
    let parsed: URL
    try { parsed = new URL(raw) } catch { throw new Error(`Pilot seed ${name} is not a valid database URL.`) }
    const host = parsed.hostname.toLowerCase().replace(/^\[|\]$/gu, '')
    const local = host === 'localhost' || host === '127.0.0.1' || host === '::1'
    let db: string
    try { db = decodeURIComponent(parsed.pathname.slice(1)) }
    catch { throw new Error(`Pilot seed ${name} has an invalid database name.`) }
    if (!['postgres:', 'postgresql:'].includes(parsed.protocol) ||
        !local || parsed.search || parsed.hash ||
        !/^visutry_local(?:_[a-z0-9_]+)?$/u.test(db)) {
      throw new Error(`Pilot seed ${name} must target an explicitly named loopback visutry_local TEST database without connection overrides.`)
    }
    if (expectedDatabase !== null && db !== expectedDatabase) {
      throw new Error('Pilot seed database targets must refer to the same local TEST database.')
    }
    expectedDatabase = db
  }
}
