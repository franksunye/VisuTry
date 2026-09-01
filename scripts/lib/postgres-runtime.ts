/**
 * Script-side PostgreSQL provider boundary.
 *
 * Maintenance/reporting scripts intentionally do not share the application
 * singleton. They use the current production provider behind this helper so
 * a future PostgreSQL provider change stays localized to infrastructure.
 */
import { neon } from '@neondatabase/serverless'
import { PrismaNeon } from '@prisma/adapter-neon'
import { PrismaClient } from '@prisma/client'

export function createPostgresSqlClient(connectionString: string) {
  return neon(connectionString)
}

export function createPostgresPrismaClient(connectionString: string) {
  return new PrismaClient({
    adapter: new PrismaNeon({ connectionString }),
  })
}
