import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { get } from '@vercel/blob'
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

async function readPrivateBlob(storageKey: string): Promise<Buffer | null> {
  const result = await get(storageKey, { access: 'private' })
  if (!result?.stream) return null
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
 * The current Local records are conspicuously marked QA fixtures. Production
 * can read only an explicitly approved manifest record backed by private Blob;
 * no public URL or Local path is accepted there.
 */
export async function readPreparedDemoResultAsset(
  descriptor: PreparedDemoAssetDescriptor,
  env: Record<string, string | undefined> = process.env,
): Promise<PreparedDemoAssetBytes | null> {
  let bytes: Buffer | null = null
  let contentType: string = descriptor.contentType

  if (
    env.APP_ENV === 'local' &&
    env.VERCEL_ENV === undefined &&
    env.VISUTRY_LOCAL_DEMO_RUNTIME === '1' &&
    descriptor.assetClass === 'LOCAL_QA_FIXTURE' &&
    descriptor.localQaPath
  ) {
    const assetRoot = path.resolve(process.cwd(), 'docs/assets/local-demo/prepared-results')
    const assetPath = path.resolve(process.cwd(), descriptor.localQaPath)
    if (!assetPath.startsWith(`${assetRoot}${path.sep}`)) return null
    bytes = await readFile(assetPath)
    contentType = contentTypeForPathname(assetPath)
  } else if (
    env.APP_ENV === 'production' &&
    descriptor.assetClass === 'APPROVED_DEMO_OUTPUT' &&
    descriptor.productionStorageKey
  ) {
    bytes = await readPrivateBlob(descriptor.productionStorageKey)
    contentType = descriptor.contentType
  } else {
    return null
  }

  if (!bytes || !/^[a-f0-9]{64}$/.test(descriptor.assetSha256)) return null
  if (sha256(bytes) !== descriptor.assetSha256) return null
  return { body: bytes, contentType, expiresAt: null }
}
