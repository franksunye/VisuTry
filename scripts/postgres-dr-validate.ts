import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { createReadinessPrismaClient, redactErrorMessage, printJson } from './lib/postgres-readiness'
import {
  assertDrDatabaseSafety,
  requireDrAuthorization,
  requireDrConnection,
  requireHaLocalEnvironment,
  redactUrl,
} from './lib/postgres-dr'

const execFileAsync = promisify(execFile)

async function main(): Promise<void> {
  requireHaLocalEnvironment()
  requireDrAuthorization('P4_DR_VALIDATE_ALLOW')
  const source = requireDrConnection('P4_DR_SOURCE_DATABASE_URL', 'P4_DR_SOURCE_DATABASE_IDENTITY')
  const target = requireDrConnection('P4_DR_TARGET_DATABASE_URL', 'P4_DR_TARGET_DATABASE_IDENTITY')
  if (source.url === target.url) throw new Error('DB-P4 validation source and target must be different.')

  const clients = [
    { label: 'source', connection: source },
    { label: 'target', connection: target },
  ].map(({ connection }) => createReadinessPrismaClient(connection.url))
  try {
    await Promise.all([
      assertDrDatabaseSafety(
        clients[0]!,
        source.url,
        source.identity,
        process.env.P4_DR_EXPECTED_SOURCE_ENVIRONMENT?.trim(),
        process.env.P4_DR_ALLOW_UNMARKED_SOURCE === '1',
      ),
      assertDrDatabaseSafety(
        clients[1]!,
        target.url,
        target.identity,
        process.env.P4_DR_EXPECTED_TARGET_ENVIRONMENT?.trim(),
        process.env.P4_DR_ALLOW_UNMARKED_TARGET === '1',
      ),
    ])
  } finally {
    await Promise.all(clients.map((client) => client.$disconnect()))
  }

  const result = await execFileAsync(
    'npx',
    ['--no-install', 'tsx', 'scripts/postgres-data-migration-validator.ts'],
    {
      cwd: process.cwd(),
      env: {
        ...process.env,
        APP_ENV: 'local',
        P3_READINESS_CONFIRM: '1',
        P3_VALIDATION_MODE: 'all',
        P3_SOURCE_DATABASE_URL: source.url,
        P3_TARGET_DATABASE_URL: target.url,
      },
      maxBuffer: 8 * 1024 * 1024,
    },
  )
  process.stdout.write(result.stdout)
  if (result.stderr.trim()) process.stderr.write(redactErrorMessage(result.stderr))
  printJson({
    result: 'PASS',
    source: redactUrl(source.url),
    target: redactUrl(target.url),
    ledgerMutation: false,
  })
}

main().catch((error) => {
  console.error(`PostgreSQL DR validation failed: ${redactErrorMessage(error)}`)
  process.exitCode = 1
})
