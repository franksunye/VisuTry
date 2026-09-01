import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import {
  printJson,
  redactErrorMessage,
  requireEnvironmentVariable,
} from './lib/postgres-readiness'
import {
  parseProvider,
  requireDrAuthorization,
  requireDrConnection,
  requireHaLocalEnvironment,
  redactUrl,
  type DrProvider,
} from './lib/postgres-dr'
import { checkProviderHealth } from './lib/postgres-health'

const execFileAsync = promisify(execFile)

function providerPrefix(provider: DrProvider): string {
  return `P4_DR_${provider.toUpperCase()}_DATABASE`
}

/**
 * One scheduled health/backup tick. Scheduling is intentionally external so
 * this command cannot become an automatic failover loop.
 */
async function main(): Promise<void> {
  requireHaLocalEnvironment()
  requireDrAuthorization('P4_DR_WATCH_ALLOW')
  requireDrAuthorization('P4_DR_BACKUP_ALLOW')
  const provider = parseProvider(requireEnvironmentVariable('ACTIVE_DB_PROVIDER'), 'ACTIVE_DB_PROVIDER')
  const prefix = providerPrefix(provider)
  const connection = requireDrConnection(`${prefix}_URL`, `${prefix}_IDENTITY`)
  const expectedEnvironment = requireEnvironmentVariable(`${prefix}_ENVIRONMENT`)

  const health = await checkProviderHealth(provider, connection.url, connection.identity, expectedEnvironment)
  if (health.status !== 'HEALTHY') {
    printJson({
      result: 'FAIL',
      automaticFailover: false,
      backupTriggered: false,
      health,
    })
    process.exitCode = 1
    return
  }

  const backupDir = requireEnvironmentVariable('P4_DR_BACKUP_DIR')
  const result = await execFileAsync(
    'npx',
    ['--no-install', 'tsx', 'scripts/postgres-dr-backup.ts'],
    {
      cwd: process.cwd(),
      env: {
        ...process.env,
        APP_ENV: 'local',
        P4_DR_BACKUP_ALLOW: '1',
        P4_DR_SOURCE_PROVIDER: provider,
        P4_DR_SOURCE_DATABASE_URL: connection.url,
        P4_DR_SOURCE_DATABASE_IDENTITY: connection.identity,
        P4_DR_EXPECTED_SOURCE_ENVIRONMENT: expectedEnvironment,
        P4_DR_BACKUP_DIR: backupDir,
      },
      maxBuffer: 8 * 1024 * 1024,
    },
  )
  process.stdout.write(result.stdout)
  printJson({
    result: 'PASS',
    automaticFailover: false,
    backupTriggered: true,
    provider,
    sourceDatabase: redactUrl(connection.url),
    backupDirectory: backupDir,
  })
}

main().catch((error) => {
  console.error(`PostgreSQL DR watch failed: ${redactErrorMessage(error)}`)
  process.exitCode = 1
})
