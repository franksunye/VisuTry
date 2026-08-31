import fs from 'node:fs'
import path from 'node:path'
import {
  assertNonDeployedEnvironment,
  assertPostgresConnectionString,
  redactPostgresConnectionString,
  RAW_SQL_INVARIANTS,
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

  it('rejects deployed environments for disposable readiness checks', () => {
    expect(() => assertNonDeployedEnvironment({ APP_ENV: 'production' })).toThrow(/deployed environment/)
    expect(() => assertNonDeployedEnvironment({ VERCEL_ENV: 'preview' })).toThrow(/deployed environment/)
    expect(() => assertNonDeployedEnvironment({ APP_ENV: 'local' })).not.toThrow()
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
    expect(source).toContain('VISUTRY_FOOTPRINT_ALLOW_PRODUCTION')
    expect(source).not.toMatch(/\b(?:INSERT\s+INTO|UPDATE\s+.+\s+SET|DELETE\s+FROM|ALTER\s+TABLE|DROP\s+TABLE|TRUNCATE)\b/i)
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
