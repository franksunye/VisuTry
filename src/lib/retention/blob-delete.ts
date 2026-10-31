import { del } from '@vercel/blob'
import { getPrivateBlobReadWriteToken } from '@/lib/tryon-blob-access'

/** Resolve the store from the immutable Blob URL, not today's upload setting. */
export function getRetentionBlobDeleteToken(reference: string, pathnameAccess: 'public' | 'private' = 'private'): string {
  let access = pathnameAccess
  if (reference.includes('://')) {
    const url = new URL(reference)
    if (url.protocol !== 'https:') throw new Error('Unrecognized Blob protocol; refusing deletion')
    const host = url.hostname.toLowerCase()
    if (/^[a-z0-9-]+\.private\.blob\.vercel-storage\.com$/.test(host)) access = 'private'
    else if (/^[a-z0-9-]+\.public\.blob\.vercel-storage\.com$/.test(host)) access = 'public'
    else throw new Error('Unrecognized Blob store; refusing deletion')
  }

  const token = access === 'private'
    ? getPrivateBlobReadWriteToken()
    : process.env.BLOB_READ_WRITE_TOKEN?.trim()
  if (!token) throw new Error(`${access} Blob deletion token is not configured`)
  return token
}

export function isBlobNotFoundError(error: unknown): boolean {
  const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase()
  const name = error instanceof Error ? error.name : ''
  return name === 'BlobNotFoundError' || message.includes('not found') || message.includes('404')
}

export function retentionDeleteErrorMessage(error: unknown): string {
  let message = error instanceof Error ? error.message : 'blob_delete_failed'
  for (const secret of [getPrivateBlobReadWriteToken(), process.env.BLOB_READ_WRITE_TOKEN?.trim()]) {
    if (secret) message = message.split(secret).join('[REDACTED]')
  }
  return message.slice(0, 500)
}

export async function deleteOwnedBlob(reference: string, pathnameAccess: 'public' | 'private' = 'private'): Promise<void> {
  try {
    await del(reference, { token: getRetentionBlobDeleteToken(reference, pathnameAccess) })
  } catch (error) {
    if (!isBlobNotFoundError(error)) throw error
  }
}
