import { defineConfig } from 'prisma/config'

/**
 * Test-only Prisma config. It lets readiness rehearsals point at an isolated
 * canonical migration checkout without changing the repository's active
 * migration path or database environment variables.
 */
export default defineConfig({
  schema: process.env.P3_TEST_SCHEMA_PATH ?? 'prisma/schema.prisma',
  migrations: {
    path: process.env.P3_TEST_MIGRATIONS_PATH ?? 'prisma/migrations',
  },
  datasource: {
    url: process.env.P3_TEST_DATABASE_URL ?? '',
  },
})
