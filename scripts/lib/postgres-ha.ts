import fs from 'node:fs'
import path from 'node:path'
import { parseProvider, type DrProvider } from './postgres-dr'

export type FailoverGateResult = {
  gate: string
  pass: boolean
  detail: string
}

export function parseAuthorityProviders(value: string): DrProvider[] {
  const providers = value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => parseProvider(item, 'observed authority provider'))
  if (providers.length === 0) throw new Error('At least one observed authority provider is required.')
  return [...new Set(providers)]
}

export function backupAgeSeconds(manifestPath: string, now = Date.now()): number {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8')) as { createdAt?: string }
  if (!manifest.createdAt) throw new Error('Backup manifest has no createdAt timestamp.')
  const createdAt = Date.parse(manifest.createdAt)
  if (!Number.isFinite(createdAt)) throw new Error('Backup manifest createdAt is invalid.')
  return Math.max(0, Math.floor((now - createdAt) / 1000))
}

export function failoverGates(options: {
  activeProvider: DrProvider
  targetProvider: DrProvider
  observedProviders: DrProvider[]
  operatorAuthorized: boolean
  fencingConfirmed: boolean
  writesFrozen: boolean
  targetValidated: boolean
  targetMigrationClean: boolean
  backupManifest: string
  backupMaxAgeSeconds: number
  now?: number
}): FailoverGateResult[] {
  const gates: FailoverGateResult[] = [
    {
      gate: 'single-authority',
      pass: options.observedProviders.length === 1 && options.observedProviders[0] === options.activeProvider,
      detail: 'exactly one observed authoritative provider must match ACTIVE_DB_PROVIDER',
    },
    {
      gate: 'operator-authorization',
      pass: options.operatorAuthorized,
      detail: 'explicit operator authorization is required',
    },
    {
      gate: 'source-fenced',
      pass: options.fencingConfirmed,
      detail: 'the current authoritative provider must be declared unavailable/fenced',
    },
    {
      gate: 'writes-frozen',
      pass: options.writesFrozen,
      detail: 'application writes must be stopped or frozen',
    },
    {
      gate: 'target-different',
      pass: options.targetProvider !== options.activeProvider,
      detail: 'failover target must differ from the current authority',
    },
    {
      gate: 'target-validated',
      pass: options.targetValidated,
      detail: 'the target schema, invariants, and smoke must already be validated',
    },
    {
      gate: 'target-migration-clean',
      pass: options.targetMigrationClean,
      detail: 'target migration status must be CLEAN',
    },
  ]
  if (!options.backupManifest || !fs.existsSync(options.backupManifest)) {
    gates.push({ gate: 'validated-backup', pass: false, detail: 'newest validated backup manifest is missing' })
  } else {
    try {
      const age = backupAgeSeconds(options.backupManifest, options.now)
      gates.push({
        gate: 'validated-backup',
        pass: age <= options.backupMaxAgeSeconds,
        detail: `backup age ${age}s; maximum allowed ${options.backupMaxAgeSeconds}s`,
      })
    } catch (error) {
      gates.push({ gate: 'validated-backup', pass: false, detail: error instanceof Error ? error.message : 'invalid backup' })
    }
  }
  return gates
}

export function failoverPlan(targetProvider: DrProvider): string[] {
  return [
    'declare the current authority unavailable and fenced',
    'freeze application writes and serialize operators/deployments',
    'select the newest validated DR snapshot within the RPO budget',
    `restore and validate ${targetProvider} from that snapshot`,
    'confirm no Vercel, Cloudflare, cron, worker, CLI, or migration process still points at the old authority',
    `atomically switch ACTIVE_DB_PROVIDER and runtime/migration URLs to ${targetProvider}`,
    'deploy the already-reviewed application configuration',
    'run provider preflight and critical application smoke',
    `confirm new writes land only on ${targetProvider}`,
    'reopen traffic and monitor the rollback window',
  ]
}

export function failbackPlan(sourceProvider: DrProvider, targetProvider: DrProvider): string[] {
  return [
    `freeze writes while ${sourceProvider} remains authoritative`,
    `export the authoritative ${sourceProvider} snapshot with the portable DR backup tool`,
    `rebuild/restore ${targetProvider} from the canonical schema and snapshot`,
    'validate row counts, constraints, invariants, business metrics, and migration status',
    `atomically switch the authority to ${targetProvider}`,
    'run provider preflight and critical application smoke',
    'reopen writes only after the new authority is confirmed',
    `retain ${sourceProvider} and the snapshot for the rollback window`,
  ]
}

export function retentionPlan(
  root: string,
  intervalCount: number,
  dailyCount: number,
): { keep: string[]; candidates: string[] } {
  const entries = fs.readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(root, entry.name))
    .filter((directory) => fs.existsSync(path.join(directory, 'dr-state.json')))
    .map((directory) => {
      const state = JSON.parse(fs.readFileSync(path.join(directory, 'dr-state.json'), 'utf8')) as { createdAt?: string }
      return { directory, createdAt: Date.parse(state.createdAt ?? '') }
    })
    .filter((entry) => Number.isFinite(entry.createdAt))
    .sort((left, right) => right.createdAt - left.createdAt)
  const keep = new Set(entries.slice(0, intervalCount).map((entry) => entry.directory))
  const dailyDays = new Set<string>()
  for (const entry of entries) {
    if (dailyDays.size >= dailyCount) break
    const day = new Date(entry.createdAt).toISOString().slice(0, 10)
    if (!dailyDays.has(day)) {
      dailyDays.add(day)
      keep.add(entry.directory)
    }
  }
  return {
    keep: [...keep].sort(),
    candidates: entries.map((entry) => entry.directory).filter((directory) => !keep.has(directory)),
  }
}
