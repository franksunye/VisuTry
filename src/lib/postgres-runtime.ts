/**
 * Canonical Node/Vercel PostgreSQL runtime provider boundary.
 *
 * Application code should import the shared `prisma` singleton from
 * `src/lib/prisma.ts`; provider-specific adapter construction belongs here.
 * The current implementation intentionally remains Neon-backed.
 */
import { PrismaNeon } from '@prisma/adapter-neon'

export function createRuntimePostgresAdapter() {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    throw new Error('DATABASE_URL is required for the PostgreSQL runtime')
  }

  return new PrismaNeon({ connectionString })
}
