import fs from 'node:fs'
import { execFile } from 'node:child_process'
import { createHash } from 'node:crypto'
import { promisify } from 'node:util'
import {
  assertPostgresConnectionString,
  assertReadinessTargetSafety,
  databaseIdentityFromConnectionString,
  isProtectedDatabaseIdentity,
  queryOne,
  queryRows,
  redactErrorMessage,
  redactPostgresConnectionString,
  requireEnvironmentVariable,
  type ReadinessQueryClient,
} from './postgres-readiness'

const execFileAsync = promisify(execFile)

export const DR_PROVIDERS = ['supabase', 'neon_a', 'neon_b'] as const
export type DrProvider = typeof DR_PROVIDERS[number]

export type EnvironmentMarker = {
  environment: string | null
  databaseIdentity: string | null
}

export function requireHaLocalEnvironment(): void {
  const appEnv = process.env.APP_ENV?.trim().toLowerCase()
  const vercelEnv = process.env.VERCEL_ENV?.trim().toLowerCase()
  if (appEnv !== 'local' || vercelEnv === 'production' || vercelEnv === 'preview') {
    throw new Error('DB-P4 tooling requires APP_ENV=local and refuses deployed environments.')
  }
}

export function requireDrAuthorization(name: string): void {
  if (process.env[name] !== '1') throw new Error(`Set ${name}=1 for this explicitly approved DB-P4 operation.`)
}

export function parseProvider(value: string, name = 'provider'): DrProvider {
  const normalized = value.trim().toLowerCase().replace(/-/g, '_') as DrProvider
  if (!DR_PROVIDERS.includes(normalized)) {
    throw new Error(`${name} must be one of: ${DR_PROVIDERS.join(', ')}.`)
  }
  return normalized
}

export function requireDrConnection(
  urlName: string,
  identityName: string,
): { url: string; identity: string } {
  const url = assertPostgresConnectionString(urlName, requireEnvironmentVariable(urlName))
  const expectedIdentity = requireEnvironmentVariable(identityName)
  const actualIdentity = databaseIdentityFromConnectionString(url)
  if (actualIdentity !== expectedIdentity) {
    throw new Error(`${urlName} identity does not match ${identityName}.`)
  }
  if (isProtectedDatabaseIdentity(actualIdentity) || isProtectedDatabaseIdentity(expectedIdentity)) {
    throw new Error(`${urlName} is a known protected Production or Preview identity.`)
  }
  return { url, identity: expectedIdentity }
}

export async function readEnvironmentMarker(client: ReadinessQueryClient): Promise<EnvironmentMarker> {
  const relation = await queryOne<{ relation: string | null }>(
    client,
    `SELECT to_regclass('public."EnvironmentMetadata"')::text AS relation`,
  )
  if (!relation.relation) return { environment: null, databaseIdentity: null }
  const rows = await queryRows<{ environment: string; databaseIdentity: string }>(
    client,
    `SELECT "environment", "databaseIdentity"
       FROM "EnvironmentMetadata"
      WHERE "id" = 'primary'`,
  )
  const marker = rows[0]
  if (!marker) return { environment: null, databaseIdentity: null }
  return {
    environment: String(marker.environment),
    databaseIdentity: String(marker.databaseIdentity),
  }
}

export async function assertDrDatabaseSafety(
  client: ReadinessQueryClient,
  connectionString: string,
  expectedIdentity: string,
  expectedEnvironment?: string,
  allowUnmarked = false,
): Promise<EnvironmentMarker> {
  await assertReadinessTargetSafety(client, connectionString, { APP_ENV: 'local' })
  const marker = await readEnvironmentMarker(client)
  const markerEnvironment = marker.environment?.trim().toUpperCase() ?? ''
  if (markerEnvironment === 'PRODUCTION' || markerEnvironment === 'PREVIEW') {
    throw new Error('DB-P4 operation refuses a Production or Preview EnvironmentMetadata marker.')
  }
  if (expectedEnvironment && marker.environment && markerEnvironment !== expectedEnvironment.trim().toUpperCase()) {
    throw new Error('EnvironmentMetadata environment does not match the expected DB-P4 environment.')
  }
  if (marker.databaseIdentity && marker.databaseIdentity !== expectedIdentity) {
    throw new Error('EnvironmentMetadata database identity does not match the expected DB-P4 identity.')
  }
  if ((!marker.environment || !marker.databaseIdentity) && !allowUnmarked) {
    throw new Error('EnvironmentMetadata identity is missing; explicitly allow an unmarked disposable database.')
  }
  return marker
}

export function resolvePgBinDir(): string {
  const candidates = [
    process.env.P4_PG_BIN_DIR,
    process.env.P3_PG_BIN_DIR,
    '/opt/homebrew/opt/postgresql@17/bin',
    '/usr/local/opt/postgresql@17/bin',
  ].filter((candidate): candidate is string => Boolean(candidate?.trim()))
  for (const candidate of candidates) {
    if (fs.existsSync(`${candidate}/pg_config`)) return candidate
  }
  throw new Error('No PostgreSQL toolchain found; set P4_PG_BIN_DIR to PostgreSQL 17 bin directory.')
}

export async function postgresMajor(binaryPath: string): Promise<number> {
  const result = await execFileAsync(binaryPath, ['--version'], { maxBuffer: 64 * 1024 })
  const match = `${result.stdout}\n${result.stderr}`.match(/\b([0-9]+)\.[0-9]+\b/)
  if (!match) throw new Error(`Could not determine PostgreSQL major for ${binaryPath}.`)
  return Number(match[1])
}

export async function requirePgTools(
  binDir: string,
  binaries: string[],
  sourceMajor?: number,
): Promise<number> {
  const majors = await Promise.all(binaries.map(async (binary) => {
    const path = `${binDir}/${binary}`
    if (!fs.existsSync(path)) throw new Error(`Missing PostgreSQL binary: ${path}`)
    return postgresMajor(path)
  }))
  if (new Set(majors).size !== 1) throw new Error('PostgreSQL tooling major versions do not match.')
  const major = majors[0]!
  if (sourceMajor !== undefined && major < sourceMajor) {
    throw new Error(`PostgreSQL tooling major ${major} is older than source major ${sourceMajor}.`)
  }
  return major
}

export async function runPostgresTool(
  binDir: string,
  binary: string,
  args: string[],
): Promise<{ stdout: string; stderr: string }> {
  try {
    return await execFileAsync(`${binDir}/${binary}`, args, { maxBuffer: 4 * 1024 * 1024 })
  } catch (error) {
    const result = error as { stdout?: string; stderr?: string; message?: string }
    const combined = `${result.stdout ?? ''}\n${result.stderr ?? ''}\n${result.message ?? ''}`
    throw new Error(redactErrorMessage(combined).replace(/\s+/g, ' ').trim().slice(0, 500))
  }
}

export async function sha256File(filePath: string): Promise<string> {
  const hash = createHash('sha256')
  await new Promise<void>((resolve, reject) => {
    const stream = fs.createReadStream(filePath)
    stream.on('data', (chunk) => hash.update(chunk))
    stream.on('error', reject)
    stream.on('end', resolve)
  })
  return hash.digest('hex')
}

export function redactUrl(value: string): string {
  return redactPostgresConnectionString(value)
}

export function libpqConnectionString(value: string): string {
  const url = new URL(value)
  url.searchParams.delete('uselibpqcompat')
  return url.toString()
}
