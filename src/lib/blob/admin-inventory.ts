import { list } from '@vercel/blob'
import { getPrivateBlobReadWriteToken } from '@/lib/tryon-blob-access'

export type BlobStoreScope = 'public' | 'private'
export type BlobStoreConfig = {
  scope: BlobStoreScope
  label: string
  token: string | null
  unavailableReason?: string
}

// Two distinct production stores. The development-only QA store is excluded.
export function getBlobStoreConfigs(
  env: Record<string, string | undefined> = process.env,
): BlobStoreConfig[] {
  const publicToken = env.BLOB_READ_WRITE_TOKEN?.trim() || null
  const privateToken = getPrivateBlobReadWriteToken(env)
  return [
    {
      scope: 'public',
      label: 'Public Blob',
      token: publicToken,
      unavailableReason: publicToken ? undefined : 'Public Blob is not configured',
    },
    {
      scope: 'private',
      label: 'Private Blob',
      token: privateToken && privateToken !== publicToken ? privateToken : null,
      unavailableReason: !privateToken
        ? 'Private Blob is not configured'
        : privateToken === publicToken
          ? 'Private Blob shares the public credential; store boundary cannot be verified'
          : undefined,
    },
  ]
}

type ListedBlob = Awaited<ReturnType<typeof list>>['blobs'][number]

// Bound each Admin read. A partial scan is explicitly marked as incomplete;
// it is never considered a definitive inventory or deletion evidence.
const PAGE_LIMIT = 1000
const MAX_SCAN_ITEMS = 10_000

export async function scanBlobStore(config: BlobStoreConfig): Promise<{
  blobs: ListedBlob[]
  complete: boolean
}> {
  if (!config.token) throw new Error(config.unavailableReason || 'Blob store unavailable')

  const blobs: ListedBlob[] = []
  let cursor: string | undefined
  let hasMore = true
  while (hasMore && blobs.length < MAX_SCAN_ITEMS) {
    const page = await list({
      token: config.token,
      cursor,
      limit: Math.min(PAGE_LIMIT, MAX_SCAN_ITEMS - blobs.length),
    })
    blobs.push(...page.blobs)
    hasMore = page.hasMore
    cursor = page.cursor
    if (hasMore && !cursor) throw new Error('Blob pagination cursor missing')
  }
  return { blobs, complete: !hasMore }
}

export function summarizeBlobStore(
  config: BlobStoreConfig,
  scan: Awaited<ReturnType<typeof scanBlobStore>>,
) {
  const totalSize = scan.blobs.reduce((sum, blob) => sum + blob.size, 0)
  return {
    scope: config.scope,
    label: config.label,
    configured: true,
    totalFiles: scan.blobs.length,
    totalSize,
    totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2),
    complete: scan.complete,
  }
}
