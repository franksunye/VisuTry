import { PrismaNeon } from '@prisma/adapter-neon'
import { PrismaPg } from '@prisma/adapter-pg'
import {
  createRuntimePostgresAdapter,
  resolveRuntimePostgresProvider,
} from '../../../src/lib/postgres-runtime'

describe('runtime PostgreSQL provider selector', () => {
  const url = 'postgresql://runtime-user:runtime-password@db.example.test/app'

  it('keeps Neon as the default and when explicitly selected', () => {
    expect(resolveRuntimePostgresProvider({})).toBe('neon')
    expect(resolveRuntimePostgresProvider({ POSTGRES_RUNTIME_PROVIDER: 'neon' })).toBe('neon')
    expect(createRuntimePostgresAdapter({ DATABASE_URL: url })).toBeInstanceOf(PrismaNeon)
    expect(
      createRuntimePostgresAdapter({
        DATABASE_URL: url,
        POSTGRES_RUNTIME_PROVIDER: 'neon',
      }),
    ).toBeInstanceOf(PrismaNeon)
  })

  it('selects PrismaPg only for the explicit pg provider', () => {
    expect(resolveRuntimePostgresProvider({ POSTGRES_RUNTIME_PROVIDER: 'PG' })).toBe('pg')
    expect(
      createRuntimePostgresAdapter({
        DATABASE_URL: url,
        POSTGRES_RUNTIME_PROVIDER: 'pg',
      }),
    ).toBeInstanceOf(PrismaPg)
  })

  it('rejects unknown providers and missing URLs without revealing credentials', () => {
    expect(() => resolveRuntimePostgresProvider({ POSTGRES_RUNTIME_PROVIDER: 'supabase' })).toThrow(
      'POSTGRES_RUNTIME_PROVIDER must be "neon" or "pg".',
    )
    expect(() => createRuntimePostgresAdapter({})).toThrow(
      'DATABASE_URL is required for the PostgreSQL runtime',
    )
    expect(() => createRuntimePostgresAdapter({ DATABASE_URL: url, POSTGRES_RUNTIME_PROVIDER: 'supabase' })).toThrow(
      'POSTGRES_RUNTIME_PROVIDER must be "neon" or "pg".',
    )
    expect(() => createRuntimePostgresAdapter({ DATABASE_URL: url, POSTGRES_RUNTIME_PROVIDER: 'supabase' })).not.toThrow(
      'runtime-password',
    )
  })
})
