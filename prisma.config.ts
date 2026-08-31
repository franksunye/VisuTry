import dotenv from "dotenv";
import { defineConfig } from "prisma/config";
import { resolvePrismaCliDatasourceUrl } from "./prisma/resolve-cli-datasource-url";

// Load .env first, then .env.local with override (matches Next.js semantics).
dotenv.config();
dotenv.config({ path: ".env.local", override: true });

/**
 * Prisma 7 CLI configuration.
 *
 * Forces ALL Prisma CLI commands (migrate deploy / status / dev, db pull, etc.)
 * onto a DIRECT (unpooled) Postgres connection.
 *
 * WHY THIS EXISTS
 * ───────────────
 * A pooled connection using a transaction-mode pooler can break Prisma's
 * session-level advisory lock (pg_advisory_lock(72707369)), used to serialize
 * migrations. The pooler can reassign backend connections between transactions,
 * which orphans session-level locks — the lock gets "stuck"
 * held by an idle backend with no live client. Prisma hardcodes a 10s lock
 * timeout (not configurable), so every subsequent build hits P1002.
 *
 * The runtime PrismaClient uses the pooled runtime connection. Only the
 * CLI/migration path needs the direct connection.
 *
 * ENV VARS
 * ────────
 * Deployment integrations may provide these automatically:
 *   DATABASE_URL           — pooled (runtime / PrismaClient adapter)
 *   DATABASE_URL_UNPOOLED  — direct  (CLI / migrations)
 *
 * Local dev: set DATABASE_URL_UNPOOLED to a direct (non-pooler) PostgreSQL
 * connection string when the configured provider requires it.
 */
const datasource = resolvePrismaCliDatasourceUrl();

if (datasource.mode === "pooled-fallback") {
  // Local dev convenience: warn but fall back so `prisma migrate dev` works
  // without forcing developers to configure a second connection string.
  // eslint-disable-next-line no-console
  console.warn(
    "⚠️ [prisma.config.ts] DATABASE_URL_UNPOOLED is not set — falling back " +
      "to DATABASE_URL for CLI commands. This is acceptable only when the " +
      "configured PostgreSQL connection supports Prisma migration locks. " +
      "Set DATABASE_URL_UNPOOLED to a direct (non-pooler) connection."
  );
} else if (datasource.mode === "generate-placeholder") {
  // eslint-disable-next-line no-console
  console.warn(
      "⚠️ [prisma.config.ts] No DATABASE_URL during prisma generate; using a " +
      "placeholder so Prisma Client can be emitted. Edge builds may not receive " +
      "deployment database variables during dependency installation."
  );
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // Direct (unpooled) connection for migrations. Falls back to DATABASE_URL
    // for local dev, or a generate-only placeholder when no URL is present.
    url: datasource.url,
  },
});
