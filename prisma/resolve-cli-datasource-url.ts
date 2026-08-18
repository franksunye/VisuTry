export const PRISMA_GENERATE_PLACEHOLDER_URL =
  'postgresql://prisma:prisma@127.0.0.1:5432/unused'

export type PrismaCliDatasource = {
  url: string
  mode: 'direct' | 'pooled-fallback' | 'generate-placeholder'
}

export function isPrismaMigrateOrDbCommand(argv: string[] = process.argv): boolean {
  return argv.includes('migrate') || argv.includes('db')
}

/**
 * Prisma 7 loads prisma.config.ts through c12/jiti. That evaluation may not
 * see `generate` on process.argv, so Cloudflare Workers Builds cannot depend
 * on command sniffing. `prisma generate` only emits the client from schema
 * and does not connect.
 *
 * Vercel still supplies DATABASE_URL_UNPOOLED / DATABASE_URL, so production
 * generate + migrate keep using the real Neon URLs. migrate/db without a URL
 * still throw when those commands are visible on argv.
 */
export function resolvePrismaCliDatasourceUrl(
  env: NodeJS.ProcessEnv = process.env,
  argv: string[] = process.argv,
): PrismaCliDatasource {
  const direct =
    env.DATABASE_URL_UNPOOLED ?? env.DIRECT_DATABASE_URL ?? env.DIRECT_URL

  if (direct) {
    return { url: direct, mode: 'direct' }
  }

  if (env.DATABASE_URL) {
    return { url: env.DATABASE_URL, mode: 'pooled-fallback' }
  }

  if (isPrismaMigrateOrDbCommand(argv)) {
    throw new Error(
      '[prisma.config.ts] No database URL found. Set DATABASE_URL_UNPOOLED ' +
        '(provided by the Vercel Neon integration) or DATABASE_URL.',
    )
  }

  return { url: PRISMA_GENERATE_PLACEHOLDER_URL, mode: 'generate-placeholder' }
}
