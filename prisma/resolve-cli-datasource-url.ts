export const PRISMA_GENERATE_PLACEHOLDER_URL =
  'postgresql://prisma:prisma@127.0.0.1:5432/unused'

export type PrismaCliDatasource = {
  url: string
  mode: 'direct' | 'pooled-fallback' | 'generate-placeholder'
}

export function isPrismaGenerateCommand(argv: string[] = process.argv): boolean {
  return argv.includes('generate') && !argv.includes('migrate') && !argv.includes('db')
}

/**
 * Prisma 7 loads this URL for every CLI command, including `prisma generate`.
 * Generate only emits the client from schema.prisma and must not require a
 * live Neon URL — Cloudflare Workers Builds runs `npm ci` / postinstall
 * without Vercel Neon env vars.
 *
 * Migrate / db commands still require DATABASE_URL_UNPOOLED or DATABASE_URL.
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

  if (isPrismaGenerateCommand(argv)) {
    return { url: PRISMA_GENERATE_PLACEHOLDER_URL, mode: 'generate-placeholder' }
  }

  throw new Error(
    '[prisma.config.ts] No database URL found. Set DATABASE_URL_UNPOOLED ' +
      '(provided by the Vercel Neon integration) or DATABASE_URL.',
  )
}
