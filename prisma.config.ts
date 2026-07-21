import dotenv from "dotenv";
import { defineConfig } from "prisma/config";

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
 * Neon's pooled connection uses PgBouncer in transaction mode. Prisma Migrate
 * relies on a session-level advisory lock (pg_advisory_lock(72707369)) to
 * serialize migrations. PgBouncer reassigns backend connections between
 * transactions, which orphans session-level locks — the lock gets "stuck"
 * held by an idle backend with no live client. Prisma hardcodes a 10s lock
 * timeout (not configurable), so every subsequent build hits P1002.
 *
 * The runtime PrismaClient is unaffected: it uses @prisma/adapter-neon over
 * the pooled connection (see src/lib/prisma.ts). Only the CLI/migration path
 * needs the direct connection.
 *
 * ENV VARS
 * ────────
 * Vercel Neon integration provides these automatically:
 *   DATABASE_URL           — pooled (runtime / PrismaClient adapter)
 *   DATABASE_URL_UNPOOLED  — direct  (CLI / migrations)
 *
 * Local dev: set DATABASE_URL_UNPOOLED in .env to your Neon DIRECT (non-pooler)
 * connection string (the host without the `-pooler` suffix).
 */
const DIRECT_URL =
  process.env.DATABASE_URL_UNPOOLED ??
  process.env.DIRECT_DATABASE_URL ??
  process.env.DIRECT_URL;

if (!DIRECT_URL) {
  if (process.env.DATABASE_URL) {
    // Local dev convenience: warn but fall back so `prisma migrate dev` works
    // without forcing developers to configure a second connection string.
    // eslint-disable-next-line no-console
    console.warn(
      "⚠️ [prisma.config.ts] DATABASE_URL_UNPOOLED is not set — falling back " +
        "to DATABASE_URL for CLI commands. This is fine for local dev but " +
        "WILL cause P1002 advisory lock timeouts on Vercel/Neon. " +
        "Set DATABASE_URL_UNPOOLED to a direct (non-pooler) connection."
    );
  } else {
    throw new Error(
      "[prisma.config.ts] No database URL found. Set DATABASE_URL_UNPOOLED " +
        "(provided by the Vercel Neon integration) or DATABASE_URL."
    );
  }
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // Direct (unpooled) connection for migrations. Falls back to DATABASE_URL
    // for local dev — see the warning above.
    url: DIRECT_URL ?? process.env.DATABASE_URL!,
  },
});
