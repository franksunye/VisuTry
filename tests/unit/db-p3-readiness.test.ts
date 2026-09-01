import fs from 'node:fs'
import path from 'node:path'
import {
  assertNonDeployedEnvironment,
  assertPostgresConnectionString,
  assertReadinessTargetSafety,
  DB_P3_PROVIDER_SMOKE_TRANSACTION_TIMEOUT_MS,
  redactErrorMessage,
  redactPostgresConnectionString,
  PROTECTED_DATABASE_IDENTITY_MARKERS,
  RAW_SQL_INVARIANTS,
  type ReadinessQueryClient,
  requireLocalReadinessEnvironment,
} from '../../scripts/lib/postgres-readiness'

const root = process.cwd()

function read(relativePath: string): string {
  return fs.readFileSync(path.join(root, relativePath), 'utf8')
}

describe('DB-P3 migration readiness tooling', () => {
  it('redacts PostgreSQL credentials from target labels', () => {
    expect(redactPostgresConnectionString('postgresql://user:secret@example.test/db')).toBe(
      'postgresql://example.test/db',
    )
    expect(redactPostgresConnectionString('postgres://user:secret@example.test/db?sslmode=require')).toBe(
      'postgres://example.test/db',
    )
  })

  it('redacts PostgreSQL URLs embedded in errors', () => {
    expect(redactErrorMessage(new Error('connect failed: postgresql://user:secret@example.test/db'))).toBe(
      'connect failed: [redacted PostgreSQL URL]',
    )
  })

  it('rejects deployed environments for disposable readiness checks', () => {
    expect(() => assertNonDeployedEnvironment({ APP_ENV: 'production' })).toThrow(/deployed environment/)
    expect(() => assertNonDeployedEnvironment({ VERCEL_ENV: 'preview' })).toThrow(/deployed environment/)
    expect(() => assertNonDeployedEnvironment({ APP_ENV: 'local' })).not.toThrow()
    expect(() => requireLocalReadinessEnvironment({})).toThrow(/APP_ENV=local/)
    expect(() => requireLocalReadinessEnvironment({ APP_ENV: 'local' })).not.toThrow()
  })

  it('rejects known protected database identities before readiness writes', async () => {
    const queryClient: ReadinessQueryClient = {
      $queryRawUnsafe: async <T>() => [{ relation: null }] as T,
    }
    for (const marker of PROTECTED_DATABASE_IDENTITY_MARKERS) {
      const connectionHost = marker.startsWith('ep-') ? marker : 'safe.example.test'
      await expect(
        assertReadinessTargetSafety(
          queryClient,
          `postgresql://user:secret@${connectionHost}/visutry`,
          { APP_ENV: 'local', VISUTRY_DATABASE_IDENTITY: marker },
        ),
      ).rejects.toThrow(/known Production or Preview database identity/)
    }
  })

  it('rejects a database marked Production or Preview even in a local process', async () => {
    const productionClient: ReadinessQueryClient = {
      $queryRawUnsafe: async <T>(sql: string) =>
        sql.includes('to_regclass')
          ? ([{ relation: 'EnvironmentMetadata' }] as T)
          : ([{ environment: 'PRODUCTION', databaseIdentity: 'remote/visutry' }] as T),
    }
    const previewClient: ReadinessQueryClient = {
      $queryRawUnsafe: async <T>(sql: string) =>
        sql.includes('to_regclass')
          ? ([{ relation: 'EnvironmentMetadata' }] as T)
          : ([{ environment: 'PREVIEW', databaseIdentity: 'remote-preview/visutry' }] as T),
    }
    await expect(
      assertReadinessTargetSafety(productionClient, 'postgresql://user:secret@remote/visutry', { APP_ENV: 'local' }),
    ).rejects.toThrow(/Production or Preview database marker/)
    await expect(
      assertReadinessTargetSafety(previewClient, 'postgresql://user:secret@remote-preview/visutry', { APP_ENV: 'local' }),
    ).rejects.toThrow(/Production or Preview database marker/)
  })

  it('validates only PostgreSQL connection strings', () => {
    expect(assertPostgresConnectionString('URL', 'postgresql://localhost/db')).toContain('postgresql://')
    expect(() => assertPostgresConnectionString('URL', 'https://example.test/db')).toThrow(/postgres:\/\//i)
  })

  it('keeps the migration rehearsal native and ledger-safe', () => {
    const source = read('scripts/test-postgres-data-migration.sh')
    expect(source).toContain('pg_dump')
    expect(source).toContain('pg_restore')
    expect(source).toContain('--exclude-table=public._prisma_migrations')
    expect(source).toContain('P3_CANONICAL_MIGRATIONS_PATH')
    expect(source).not.toMatch(/INSERT\s+INTO\s+["']?_prisma_migrations/i)
    expect(source).not.toMatch(/UPDATE\s+["']?_prisma_migrations/i)
    expect(source).not.toMatch(/DELETE\s+FROM\s+["']?_prisma_migrations/i)
  })

  it('keeps the footprint audit read-only and explicitly gated', () => {
    const source = read('scripts/postgres-footprint-audit.ts')
    expect(source).toContain('VISUTRY_FOOTPRINT_READ_ONLY')
    expect(source).toContain('VISUTRY_FOOTPRINT_EXPECTED_DATABASE_IDENTITY')
    expect(source).toContain('VISUTRY_PRODUCTION_READONLY_AUDIT_AUTHORIZED')
    expect(source).toContain('SET TRANSACTION READ ONLY')
    expect(source).not.toContain('VISUTRY_FOOTPRINT_ALLOW_PRODUCTION')
    expect(source).not.toMatch(/\b(?:INSERT\s+INTO|UPDATE\s+.+\s+SET|DELETE\s+FROM|ALTER\s+TABLE|DROP\s+TABLE|TRUNCATE|ANALYZE|VACUUM|REINDEX)\b/i)
  })

  it('guards every DB-P3 write-capable TypeScript entrypoint', () => {
    for (const file of [
      'scripts/postgres-provider-smoke.ts',
      'scripts/postgres-application-smoke.ts',
      'scripts/postgres-data-migration-seed.ts',
      'scripts/postgres-data-migration-scale-seed.ts',
      'scripts/postgres-runtime-provider-smoke.ts',
    ]) {
      expect(read(file)).toContain('assertReadinessTargetSafety')
    }
  })

  it('keeps provider preflight read-only and production-authorized', () => {
    const source = read('scripts/postgres-provider-preflight.ts')
    expect(source).toContain('SET TRANSACTION READ ONLY')
    expect(source).toContain('VISUTRY_PRODUCTION_READONLY_AUDIT_AUTHORIZED')
    expect(source).toContain('P3_PROVIDER_PREFLIGHT_EXPECTED_DATABASE_IDENTITY')
    expect(source).not.toMatch(/\b(?:INSERT\s+INTO|UPDATE\s+.+\s+SET|DELETE\s+FROM|ALTER\s+TABLE|DROP\s+TABLE|TRUNCATE|ANALYZE|VACUUM|REINDEX)\b/i)
  })

  it('limits the longer transaction timeout to provider/application smoke', () => {
    expect(DB_P3_PROVIDER_SMOKE_TRANSACTION_TIMEOUT_MS).toBe(30_000)
    expect(read('scripts/postgres-provider-smoke.ts')).toContain(
      'transactionTimeoutMs: DB_P3_PROVIDER_SMOKE_TRANSACTION_TIMEOUT_MS',
    )
    expect(read('scripts/postgres-application-smoke.ts')).toContain(
      'transactionTimeoutMs: DB_P3_PROVIDER_SMOKE_TRANSACTION_TIMEOUT_MS',
    )
    for (const file of [
      'scripts/postgres-readiness-target-check.ts',
      'scripts/postgres-provider-preflight.ts',
      'scripts/postgres-runtime-provider-smoke.ts',
      'scripts/postgres-footprint-audit.ts',
      'scripts/postgres-data-migration-seed.ts',
      'scripts/postgres-data-migration-scale-seed.ts',
    ]) {
      expect(read(file)).not.toContain('DB_P3_PROVIDER_SMOKE_TRANSACTION_TIMEOUT_MS')
    }
  })

  it('preflights the secondary-provider migration before allowing external writes', () => {
    const source = read('scripts/test-postgres-secondary-provider.sh')
    expect(source).toContain('postgres-readiness-target-check.ts')
    expect(source.indexOf('postgres-readiness-target-check.ts')).toBeLessThan(
      source.indexOf('migrate deploy'),
    )
    const migration = read('scripts/test-postgres-data-migration.sh')
    expect(migration.indexOf('postgres-readiness-target-check.ts')).toBeLessThan(
      migration.indexOf('"$PG_BIN_DIR/pg_restore"'),
    )
  })

  it('keeps scale rehearsal synthetic and phase-measured', () => {
    const source = read('scripts/test-postgres-data-migration.sh')
    const seed = read('scripts/postgres-data-migration-scale-seed.ts')
    expect(source).toContain('P3_DATA_MIGRATION_MODE')
    expect(source).toContain('TIMINGS_MS')
    expect(source).toContain('POST_IMPORT_WRITE_SEQUENCE_SMOKE: PASS')
    expect(seed).toContain('localSyntheticOnly: true')
    expect(seed).toContain('generate_series')
    expect(seed).toContain('P3_SCALE_FACE_SHAPE_DETECTIONS')
  })

  it('redacts errors and guards all readiness entrypoints', () => {
    for (const file of [
      'scripts/postgres-provider-smoke.ts',
      'scripts/postgres-application-smoke.ts',
      'scripts/postgres-data-migration-seed.ts',
      'scripts/postgres-data-migration-scale-seed.ts',
      'scripts/postgres-data-migration-validator.ts',
      'scripts/postgres-footprint-audit.ts',
      'scripts/postgres-readiness-target-check.ts',
      'scripts/postgres-provider-preflight.ts',
      'scripts/postgres-runtime-provider-smoke.ts',
    ]) {
      const source = read(file)
      expect(source).toContain('redactErrorMessage')
      expect(source).not.toMatch(
        /console\.(?:log|error)\([^)]*(?:DATABASE_URL|DIRECT_URL|password|token)/i,
      )
    }
  })

  it('requires explicit non-production approval for the secondary provider smoke', () => {
    const source = read('scripts/test-postgres-secondary-provider.sh')
    expect(source).toContain('P3_SECONDARY_POSTGRES_ALLOW')
    expect(source).toContain('SECOND_PROVIDER_LIVE_TEST: BLOCKED')
    expect(source).toContain('P3_REQUIRE_SECONDARY_PROVIDER')
    expect(source).toContain('migrate status')
  })

  it('keeps all audited raw-SQL invariants in the schema contract', () => {
    const source = read('scripts/lib/postgres-schema-contract.ts')
    for (const invariant of RAW_SQL_INVARIANTS) expect(source).toContain(invariant)
  })

  it('contains Neon-specific markers only in approved infrastructure files', () => {
    const allowed = new Set([
      path.join(root, 'src/lib/postgres-runtime.ts'),
      path.join(root, 'src/data/neon-cloudflare.ts'),
    ])
    const markers = ['@prisma/adapter-neon', '@neondatabase/serverless', 'PrismaNeon', 'neon(']
    const violations: string[] = []
    const visit = (directory: string): void => {
      for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
        const filePath = path.join(directory, entry.name)
        if (entry.isDirectory()) visit(filePath)
        else if (/\.(?:js|mjs|ts|tsx)$/.test(entry.name)) {
          const source = fs.readFileSync(filePath, 'utf8')
          if (markers.some((marker) => source.includes(marker)) && !allowed.has(filePath)) {
            violations.push(path.relative(root, filePath))
          }
        }
      }
    }
    visit(path.join(root, 'src'))
    expect(violations).toEqual([])
  })
})
