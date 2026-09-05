import { defineConfig } from 'prisma/config'

export default defineConfig({
  schema: process.env.P2B_TEST_SCHEMA_PATH ?? 'prisma/schema.prisma',
  migrations: {
    path: process.env.P2B_TEST_MIGRATIONS_PATH ?? 'prisma/migrations',
  },
  datasource: {
    url: process.env.P2B_TEST_DATABASE_URL ?? '',
  },
})
