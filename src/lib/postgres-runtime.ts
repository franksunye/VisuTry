/**
 * Canonical Node/Vercel PostgreSQL runtime provider boundary.
 *
 * Application code should import the shared `prisma` singleton from
 * `src/lib/prisma.ts`; provider-specific adapter construction belongs here.
 * Neon remains the default for backwards compatibility. A provider change is
 * explicit through POSTGRES_RUNTIME_PROVIDER; never infer it from a URL.
 */
import { PrismaNeon } from '@prisma/adapter-neon'
import { PrismaPg } from '@prisma/adapter-pg'

export type RuntimePostgresProvider = 'neon' | 'pg'

export type RuntimePostgresEnvironment = Record<string, string | undefined> & {
  DATABASE_URL?: string
  POSTGRES_RUNTIME_PROVIDER?: string
}

export function resolveRuntimePostgresProvider(
  env: RuntimePostgresEnvironment = process.env,
): RuntimePostgresProvider {
  const configured = env.POSTGRES_RUNTIME_PROVIDER?.trim().toLowerCase()
  if (!configured || configured === 'neon') return 'neon'
  if (configured === 'pg') return 'pg'
  throw new Error('POSTGRES_RUNTIME_PROVIDER must be "neon" or "pg".')
}

export function createRuntimePostgresAdapter(
  env: RuntimePostgresEnvironment = process.env,
) {
  const connectionString = env.DATABASE_URL?.trim()
  if (!connectionString) {
    throw new Error('DATABASE_URL is required for the PostgreSQL runtime')
  }

  if (resolveRuntimePostgresProvider(env) === 'pg') {
    return new PrismaPg({ connectionString })
  }

  return new PrismaNeon({ connectionString })
}
