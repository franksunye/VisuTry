import { createReadinessPrismaClient, printJson, redactErrorMessage } from './lib/postgres-readiness'
import { assertDrDatabaseSafety, parseProvider, requireDrConnection, requireHaLocalEnvironment, redactUrl, type DrProvider } from './lib/postgres-dr'
import { checkProviderHealth, type HealthResult } from './lib/postgres-health'

function variablePrefix(provider: DrProvider): string {
  return `P4_DR_${provider.toUpperCase()}_DATABASE`
}

async function main(): Promise<void> {
  requireHaLocalEnvironment()
  const activeProvider = process.env.ACTIVE_DB_PROVIDER
    ? parseProvider(process.env.ACTIVE_DB_PROVIDER, 'ACTIVE_DB_PROVIDER')
    : undefined
  const observedProviders = process.env.P4_OBSERVED_AUTHORITY_PROVIDERS
    ? process.env.P4_OBSERVED_AUTHORITY_PROVIDERS.split(',').map((value) => parseProvider(value, 'observed authority provider'))
    : activeProvider
      ? [activeProvider]
      : []
  if (observedProviders.length !== 1 || (activeProvider && observedProviders[0] !== activeProvider)) {
    printJson({
      result: 'FAIL',
      readOnly: true,
      authority: {
        activeProvider: activeProvider ?? 'UNKNOWN',
        observedProviders,
        status: 'UNKNOWN',
        detail: 'Exactly one observed authority must match ACTIVE_DB_PROVIDER.',
      },
    })
    process.exitCode = 1
    return
  }

  const requested = process.argv.find((argument) => argument.startsWith('--target='))?.split('=', 2)[1]
  const providers = requested
    ? [parseProvider(requested, '--target')]
    : (['supabase', 'neon_a', 'neon_b'] as DrProvider[])
  const results: HealthResult[] = []
  for (const provider of providers) {
    const prefix = variablePrefix(provider)
    const url = process.env[`${prefix}_URL`]
    const identity = process.env[`${prefix}_IDENTITY`]
    const expectedEnvironment = process.env[`${prefix}_ENVIRONMENT`]
    if (!url || !identity) {
      results.push({ provider, status: 'UNKNOWN', detail: `${prefix}_URL and ${prefix}_IDENTITY are required.` })
      continue
    }
    const connection = requireDrConnection(`${prefix}_URL`, `${prefix}_IDENTITY`)
    const client = createReadinessPrismaClient(connection.url)
    try {
      await assertDrDatabaseSafety(
        client,
        connection.url,
        connection.identity,
        expectedEnvironment,
        process.env.P4_DR_HEALTH_ALLOW_UNMARKED === '1',
      )
    } catch (error) {
      results.push({
        provider,
        status: 'DEGRADED',
        database: redactUrl(connection.url),
        databaseIdentity: connection.identity,
        detail: redactErrorMessage(error).slice(0, 240),
      })
      await client.$disconnect()
      continue
    }
    await client.$disconnect()
    results.push(await checkProviderHealth(provider, connection.url, connection.identity, expectedEnvironment))
  }
  printJson({
    result: results.every((result) => result.status === 'HEALTHY') ? 'PASS' : 'FAIL',
    readOnly: true,
    authority: {
      activeProvider: activeProvider ?? 'UNKNOWN',
      observedProviders,
      status: 'SINGLE_AUTHORITY',
    },
    providers: results,
  })
  if (results.some((result) => result.status !== 'HEALTHY')) process.exitCode = 1
}

main().catch((error) => {
  console.error(`PostgreSQL DR health check failed: ${redactErrorMessage(error)}`)
  process.exitCode = 1
})
