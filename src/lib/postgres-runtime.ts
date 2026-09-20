/**
 * Canonical Node/Vercel PostgreSQL runtime provider boundary.
 *
 * Application code should import the shared `prisma` singleton from
 * `src/lib/prisma.ts`; provider-specific adapter construction belongs here.
 * Local explicitly selects PrismaPg. Preview/Production and unknown build
 * contexts remain Neon-backed; application code never chooses an adapter.
 */
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaNeon } from '@prisma/adapter-neon'
import { assertLocalDatabaseUrl, resolveAppEnvironment } from './app-environment'

export type RuntimePostgresProvider = 'PRISMA_PG' | 'PRISMA_NEON'

export function resolveRuntimePostgresProvider(env: Record<string, string | undefined> = process.env): RuntimePostgresProvider {
  return resolveAppEnvironment(env) === 'local' ? 'PRISMA_PG' : 'PRISMA_NEON'
}

export function createRuntimePostgresAdapter(env: Record<string, string | undefined> = process.env) {
  const environment = resolveAppEnvironment(env)
  const connectionString = environment === 'local'
    ? assertLocalDatabaseUrl(env.DATABASE_URL)
    : env.DATABASE_URL
  if (!connectionString) throw new Error('DATABASE_URL is required for the PostgreSQL runtime')

  return environment === 'local'
    ? new PrismaPg({ connectionString })
    : new PrismaNeon({ connectionString })
}
