import fs from 'node:fs'
import { printJson, redactErrorMessage, requireEnvironmentVariable } from './lib/postgres-readiness'
import {
  failbackPlan,
  failoverGates,
  failoverPlan,
  parseAuthorityProviders,
  retentionPlan,
} from './lib/postgres-ha'
import { parseProvider, requireHaLocalEnvironment } from './lib/postgres-dr'

function flag(name: string): string | undefined {
  const prefix = `--${name}=`
  return process.argv.find((argument) => argument.startsWith(prefix))?.slice(prefix.length)
}

function boolEnv(name: string): boolean {
  return process.env[name] === '1'
}

function requireActiveProvider(): ReturnType<typeof parseProvider> {
  return parseProvider(requireEnvironmentVariable('ACTIVE_DB_PROVIDER'), 'ACTIVE_DB_PROVIDER')
}

async function main(): Promise<void> {
  requireHaLocalEnvironment()
  const command = process.argv[2]
  if (command === 'prepare-failover') {
    const activeProvider = requireActiveProvider()
    const targetProvider = parseProvider(flag('target') ?? '', '--target')
    const observedProviders = parseAuthorityProviders(
      process.env.P4_OBSERVED_AUTHORITY_PROVIDERS ?? activeProvider,
    )
    const backupManifest = process.env.P4_NEWEST_VALIDATED_BACKUP ?? ''
    const backupMaxAgeSeconds = Number(process.env.P4_BACKUP_MAX_AGE_SECONDS ?? 1800)
    if (!Number.isInteger(backupMaxAgeSeconds) || backupMaxAgeSeconds < 0) {
      throw new Error('P4_BACKUP_MAX_AGE_SECONDS must be a non-negative integer.')
    }
    const gates = failoverGates({
      activeProvider,
      targetProvider,
      observedProviders,
      operatorAuthorized: boolEnv('P4_FAILOVER_OPERATOR_AUTHORIZED'),
      fencingConfirmed: boolEnv('P4_FENCING_CONFIRMED'),
      writesFrozen: boolEnv('P4_WRITES_FROZEN'),
      targetValidated: boolEnv('P4_TARGET_VALIDATED'),
      targetMigrationClean: process.env.P4_TARGET_MIGRATION_STATUS === 'CLEAN',
      backupManifest,
      backupMaxAgeSeconds,
    })
    const pass = gates.every((gate) => gate.pass)
    printJson({
      result: pass ? 'PASS' : 'FAIL',
      failClosed: true,
      automaticFailover: false,
      activeProvider,
      targetProvider,
      gates,
      plan: pass ? failoverPlan(targetProvider) : [],
    })
    if (!pass) process.exitCode = 1
    return
  }

  if (command === 'validate') {
    const targetProvider = parseProvider(flag('target') ?? '', '--target')
    const pass = boolEnv('P4_TARGET_VALIDATED') && process.env.P4_TARGET_MIGRATION_STATUS === 'CLEAN'
    printJson({
      result: pass ? 'PASS' : 'FAIL',
      targetProvider,
      migrationStatus: process.env.P4_TARGET_MIGRATION_STATUS ?? 'UNKNOWN',
      targetValidated: boolEnv('P4_TARGET_VALIDATED'),
      mutation: false,
    })
    if (!pass) process.exitCode = 1
    return
  }

  if (command === 'failback-plan') {
    const sourceProvider = parseProvider(flag('from') ?? '', '--from')
    const targetProvider = parseProvider(flag('to') ?? '', '--to')
    const activeProvider = requireActiveProvider()
    const observedProviders = parseAuthorityProviders(
      process.env.P4_OBSERVED_AUTHORITY_PROVIDERS ?? activeProvider,
    )
    const pass = activeProvider === sourceProvider
      && observedProviders.length === 1
      && observedProviders[0] === sourceProvider
      && boolEnv('P4_FAILBACK_OPERATOR_AUTHORIZED')
      && boolEnv('P4_WRITES_FROZEN')
      && sourceProvider !== targetProvider
    printJson({
      result: pass ? 'PASS' : 'FAIL',
      failClosed: true,
      automaticFailover: false,
      sourceProvider,
      targetProvider,
      plan: pass ? failbackPlan(sourceProvider, targetProvider) : [],
    })
    if (!pass) process.exitCode = 1
    return
  }

  if (command === 'retention-plan') {
    const root = requireEnvironmentVariable('P4_DR_BACKUP_ROOT')
    if (!fs.existsSync(root)) throw new Error('P4_DR_BACKUP_ROOT does not exist.')
    const intervalCount = Number(process.env.P4_DR_INTERVAL_RETENTION ?? 8)
    const dailyCount = Number(process.env.P4_DR_DAILY_RETENTION ?? 7)
    const plan = retentionPlan(root, intervalCount, dailyCount)
    printJson({
      result: 'PASS',
      dryRun: true,
      intervalRetention: intervalCount,
      dailyRetention: dailyCount,
      ...plan,
      deletionPerformed: false,
    })
    return
  }

  throw new Error('Usage: postgres-ha.ts prepare-failover --target=neon-a | validate --target=neon-a | failback-plan --from=neon-a --to=supabase | retention-plan')
}

main().catch((error) => {
  console.error(`PostgreSQL HA planner failed: ${redactErrorMessage(error)}`)
  process.exitCode = 1
})
