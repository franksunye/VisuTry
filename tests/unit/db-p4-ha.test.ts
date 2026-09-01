import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import {
  failoverGates,
  retentionPlan,
} from '../../scripts/lib/postgres-ha'
import { redactUrl } from '../../scripts/lib/postgres-dr'
import {
  HEALTH_CONNECTION_TIMEOUT_MS,
  HEALTH_LOCK_TIMEOUT_MS,
  HEALTH_PROVIDER_TIMEOUT_MS,
  HEALTH_QUERY_TIMEOUT_MS,
  HEALTH_STATEMENT_TIMEOUT_MS,
  unavailableHealthResult,
  withHealthTimeout,
} from '../../scripts/lib/postgres-health'

describe('DB-P4 HA/DR safety planning', () => {
  test('requires one authority and rejects split brain or stale snapshots', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'visutry-db-p4-test-'))
    const manifest = path.join(root, 'dr-state.json')
    fs.writeFileSync(manifest, JSON.stringify({ createdAt: new Date().toISOString() }))
    try {
      const base = {
        activeProvider: 'supabase' as const,
        targetProvider: 'neon_a' as const,
        operatorAuthorized: true,
        fencingConfirmed: true,
        writesFrozen: true,
        targetValidated: true,
        targetMigrationClean: true,
        backupManifest: manifest,
        backupMaxAgeSeconds: 1_800,
      }
      expect(failoverGates({ ...base, observedProviders: ['supabase'] }).every((gate) => gate.pass)).toBe(true)
      expect(failoverGates({ ...base, observedProviders: ['supabase', 'neon_a'] }).find((gate) => gate.gate === 'single-authority')?.pass).toBe(false)
      expect(failoverGates({ ...base, observedProviders: ['supabase'], backupMaxAgeSeconds: 0, now: Date.now() + 2_000 }).find((gate) => gate.gate === 'validated-backup')?.pass).toBe(false)
    } finally {
      fs.rmSync(root, { recursive: true, force: true })
    }
  })

  test('retention is a dry-run and preserves interval plus daily representatives', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'visutry-db-p4-retention-'))
    try {
      for (const [name, createdAt] of [
        ['newest', '2026-09-01T12:00:00.000Z'],
        ['previous', '2026-09-01T11:00:00.000Z'],
        ['yesterday', '2026-08-31T12:00:00.000Z'],
      ]) {
        const directory = path.join(root, name)
        fs.mkdirSync(directory)
        fs.writeFileSync(path.join(directory, 'dr-state.json'), JSON.stringify({ createdAt }))
      }
      const plan = retentionPlan(root, 2, 1)
      expect(plan.keep).toEqual(expect.arrayContaining([path.join(root, 'newest'), path.join(root, 'previous')]))
      expect(plan.candidates).toEqual([path.join(root, 'yesterday')])
    } finally {
      fs.rmSync(root, { recursive: true, force: true })
    }
  })

  test('redacts PostgreSQL credentials from operator-facing labels', () => {
    expect(redactUrl('postgresql://user:super-secret@example.test:5432/app?sslmode=require')).toBe('postgresql://example.test/app')
  })

  test('bounds provider health waits and classifies provider failures safely', async () => {
    expect(HEALTH_CONNECTION_TIMEOUT_MS).toBeGreaterThanOrEqual(5_000)
    expect(HEALTH_CONNECTION_TIMEOUT_MS).toBeLessThanOrEqual(10_000)
    expect(HEALTH_STATEMENT_TIMEOUT_MS).toBeGreaterThanOrEqual(5_000)
    expect(HEALTH_STATEMENT_TIMEOUT_MS).toBeLessThanOrEqual(10_000)
    expect(HEALTH_LOCK_TIMEOUT_MS).toBeGreaterThanOrEqual(5_000)
    expect(HEALTH_LOCK_TIMEOUT_MS).toBeLessThanOrEqual(10_000)
    expect(HEALTH_QUERY_TIMEOUT_MS).toBeGreaterThanOrEqual(5_000)
    expect(HEALTH_QUERY_TIMEOUT_MS).toBeLessThanOrEqual(10_000)
    expect(HEALTH_PROVIDER_TIMEOUT_MS).toBeGreaterThanOrEqual(15_000)
    expect(HEALTH_PROVIDER_TIMEOUT_MS).toBeLessThanOrEqual(20_000)

    for (const detail of ['ECONNREFUSED', 'statement timeout', 'lock timeout']) {
      const result = unavailableHealthResult(
        'neon_a',
        'postgresql://user:super-secret@example.test/app',
        'example.test/app',
        new Error(detail),
      )
      expect(result.status).toBe('UNAVAILABLE')
      expect(JSON.stringify(result)).not.toContain('super-secret')
    }

    const startedAt = Date.now()
    await expect(withHealthTimeout(new Promise<never>(() => {}), 25)).rejects.toThrow('exceeded 25ms')
    expect(Date.now() - startedAt).toBeLessThan(250)
    await expect(
      withHealthTimeout(new Promise((resolve) => setTimeout(() => resolve('healthy'), 5)), 100),
    ).resolves.toBe('healthy')
  })

  test('write-capable tools require local authorization and database identity checks', () => {
    const scripts = [
      'scripts/postgres-dr-backup.ts',
      'scripts/postgres-dr-restore.ts',
      'scripts/postgres-dr-write-smoke.ts',
      'scripts/postgres-dr-watch.ts',
      'scripts/postgres-data-migration-seed.ts',
    ]
    for (const script of scripts) {
      const source = fs.readFileSync(path.join(process.cwd(), script), 'utf8')
      expect(source).toMatch(/APP_ENV|requireHaLocalEnvironment|requireLocalReadinessEnvironment/)
      expect(source).not.toMatch(/NODE_TLS_REJECT_UNAUTHORIZED/)
    }
    const audit = fs.readFileSync(path.join(process.cwd(), 'scripts/postgres-footprint-audit.ts'), 'utf8')
    expect(audit).toMatch(/SELECT/i)
    expect(audit).toMatch(/VISUTRY_PRODUCTION_READONLY_AUDIT_AUTHORIZED/)
    expect(audit).not.toMatch(/\b(INSERT|UPDATE|DELETE|CREATE|ALTER|DROP|ANALYZE|VACUUM|REINDEX)\b/i)
  })
})
