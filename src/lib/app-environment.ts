export const APP_ENVIRONMENTS = ['local', 'preview', 'production'] as const
export type AppEnvironment = (typeof APP_ENVIRONMENTS)[number]

export function resolveAppEnvironment(env: Record<string, string | undefined> = process.env): AppEnvironment {
  const explicit = env.APP_ENV?.trim().toLowerCase()
  if (explicit && (APP_ENVIRONMENTS as readonly string[]).includes(explicit)) return explicit as AppEnvironment
  if (env.VERCEL_ENV?.trim().toLowerCase() === 'production') return 'production'
  if (env.VERCEL_ENV?.trim().toLowerCase() === 'preview') return 'preview'
  return 'local'
}

export function requireExplicitAppEnvironment(env: Record<string, string | undefined> = process.env): AppEnvironment {
  const explicit = env.APP_ENV?.trim().toLowerCase()
  if (!(APP_ENVIRONMENTS as readonly string[]).includes(explicit ?? '')) {
    throw new Error('APP_ENV must be explicitly set to local, preview, or production.')
  }
  return explicit as AppEnvironment
}

/** Non-secret identity derived from a database URL. Never return credentials. */
export function databaseIdentityFromUrl(value: string | undefined): string | null {
  if (!value?.trim()) return null
  try {
    const url = new URL(value)
    const database = url.pathname.replace(/^\//, '') || 'default'
    return `${url.hostname.toLowerCase()}/${database}`
  } catch {
    return null
  }
}

export type EnvironmentMetadataRecord = {
  environment: string
  databaseIdentity: string
}

type EnvironmentMetadataReader = {
  environmentMetadata: {
    findUnique(input: { where: { id: string }; select: { environment: true; databaseIdentity: true } }): Promise<EnvironmentMetadataRecord | null>
  }
}

/**
 * Verify the database marker before a bounded environment mutation. The
 * marker is deliberately read-only here; registration is owned by the
 * explicit local/Preview bootstrap command.
 */
export async function assertDatabaseEnvironment(input: {
  client: EnvironmentMetadataReader
  expectedEnvironment: AppEnvironment
  expectedDatabaseIdentity: string
}): Promise<EnvironmentMetadataRecord> {
  const marker = await input.client.environmentMetadata.findUnique({
    where: { id: 'primary' },
    select: { environment: true, databaseIdentity: true },
  })
  if (!marker) throw new Error('Database environment marker is missing; refusing the operation.')
  if (marker.environment !== input.expectedEnvironment.toUpperCase()) {
    throw new Error(`Database environment marker is ${marker.environment}, expected ${input.expectedEnvironment.toUpperCase()}.`)
  }
  if (marker.databaseIdentity !== input.expectedDatabaseIdentity) {
    throw new Error('Database identity does not match the configured environment; refusing the operation.')
  }
  return marker
}
