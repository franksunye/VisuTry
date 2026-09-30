import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { BlobNotFoundError, get } from '@vercel/blob'
import { getPrivateBlobReadWriteToken } from '@/lib/tryon-blob-access'
import type { PreparedDemoAssetDescriptor } from './prepared-result-manifest'

export type PreparedDemoAssetBytes = {
  body: Buffer
  contentType: string
  expiresAt: null
}

function sha256(bytes: Buffer): string {
  return createHash('sha256').update(bytes).digest('hex')
}

function contentTypeForPathname(pathname: string): string {
  if (pathname.endsWith('.svg')) return 'image/svg+xml'
  if (pathname.endsWith('.webp')) return 'image/webp'
  return 'image/png'
}

async function readPrivateBlob(
  storageKey: string,
  expectedContentType: string,
  env: Record<string, string | undefined>,
): Promise<Buffer | null> {
  const token = getPrivateBlobReadWriteToken(env)
  if (!token) return null
  let result
  try {
    result = await get(storageKey, { access: 'private', token })
  } catch (error) {
    if (error instanceof BlobNotFoundError) return null
    throw error
  }
  if (!result?.stream || result.blob.contentType !== expectedContentType) return null
  const reader = result.stream.getReader()
  const chunks: Uint8Array[] = []
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    if (value) chunks.push(value)
  }
  return Buffer.concat(chunks.map((chunk) => Buffer.from(chunk)))
}

/**
 * Shared prepared-result source contract with environment-selected storage.
 * Guarded Local can read checksum-verified QA fixtures or approved Local Demo
 * outputs from repository-owned paths. Production can read only an explicitly
 * approved manifest record backed by private Blob; no Local path is accepted.
 */
export async function readPreparedDemoResultAsset(
  descriptor: PreparedDemoAssetDescriptor,
  env: Record<string, string | undefined> = process.env,
): Promise<PreparedDemoAssetBytes | null> {
  let bytes: Buffer | null = null
  let contentType: string = descriptor.contentType

  const localPath = descriptor.assetClass === 'LOCAL_QA_FIXTURE'
    ? descriptor.localQaPath
    : descriptor.localStoragePath

  if (
    env.APP_ENV === 'local' &&
    env.VERCEL_ENV === undefined &&
    env.VISUTRY_LOCAL_DEMO_RUNTIME === '1' &&
    localPath
  ) {
    const assetRoot = path.resolve(process.cwd(), 'docs/assets/local-demo/prepared-results')
    const assetPath = path.resolve(process.cwd(), localPath)
    if (!assetPath.startsWith(`${assetRoot}${path.sep}`)) return null
    bytes = await readFile(assetPath)
    contentType = contentTypeForPathname(assetPath)
  } else if (
    env.APP_ENV === 'production' &&
    descriptor.assetClass === 'APPROVED_DEMO_OUTPUT' &&
    descriptor.productionStorageKey
  ) {
    bytes = await readPrivateBlob(descriptor.productionStorageKey, descriptor.contentType, env)
    contentType = descriptor.contentType
  } else {
    return null
  }

  if (!bytes || !/^[a-f0-9]{64}$/.test(descriptor.assetSha256)) return null
  if (sha256(bytes) !== descriptor.assetSha256) return null
  return { body: bytes, contentType, expiresAt: null }
}
