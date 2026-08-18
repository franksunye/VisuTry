import { get } from '@vercel/blob'
import { pathnameFromPrivateBlobUrl } from '@/lib/blob/private-signed-url'
import { getTryOnBlobStoreId } from '@/lib/tryon-blob-access'
import {
  decodeLegacyTryOnDataUrl,
  parseLegacyTryOnHttpUrl,
  TRY_ON_MEDIA_ALLOWED_IMAGE_TYPES,
  TRY_ON_MEDIA_MAX_BYTES,
} from '@/lib/tryon-media'

export type LoadedTryOnMedia = {
  bytes: ArrayBuffer
  contentType: string
}

function normalizeContentType(value: string | null | undefined): string {
  const contentType = value?.split(';')[0].trim().toLowerCase()
  if (!contentType || !TRY_ON_MEDIA_ALLOWED_IMAGE_TYPES.has(contentType)) {
    throw new Error('Try-On media has an unsupported content type')
  }
  return contentType
}

async function readStream(stream: ReadableStream<Uint8Array>): Promise<ArrayBuffer> {
  const reader = stream.getReader()
  const chunks: Uint8Array[] = []
  let totalBytes = 0

  try {
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      if (!value) continue

      totalBytes += value.byteLength
      if (totalBytes > TRY_ON_MEDIA_MAX_BYTES) {
        await reader.cancel('Try-On media exceeds the size limit')
        throw new Error('Try-On media exceeds the size limit')
      }
      chunks.push(value)
    }
  } finally {
    reader.releaseLock()
  }

  if (totalBytes === 0) throw new Error('Try-On media is empty')

  const bytes = new Uint8Array(totalBytes)
  let offset = 0
  for (const chunk of chunks) {
    bytes.set(chunk, offset)
    offset += chunk.byteLength
  }
  return bytes.buffer
}

export async function loadPrivateTryOnMedia(sourceUrl: string): Promise<LoadedTryOnMedia | null> {
  const pathname = pathnameFromPrivateBlobUrl(sourceUrl)
  if (!pathname) return null

  const result = await get(pathname, {
    access: 'private',
    storeId: getTryOnBlobStoreId(),
  })
  if (!result?.stream) throw new Error('Failed to load private Try-On media')

  return {
    bytes: await readStream(result.stream),
    contentType: normalizeContentType(result.blob.contentType),
  }
}

function mediaToDataUri(media: LoadedTryOnMedia): string {
  return `data:${media.contentType};base64,${Buffer.from(media.bytes).toString('base64')}`
}

/**
 * Build an input accepted by the generation provider without requiring private
 * source media to be browser-addressable. Legacy public HTTP(S) and data URLs
 * keep their existing behavior; new private Blob sources are read server-side
 * and converted to an ephemeral data URI.
 */
export async function tryOnProviderMediaInput(sourceUrl: string): Promise<string> {
  const dataUrl = decodeLegacyTryOnDataUrl(sourceUrl)
  if (dataUrl) return sourceUrl

  const privateMedia = await loadPrivateTryOnMedia(sourceUrl)
  if (privateMedia) return mediaToDataUri(privateMedia)

  return parseLegacyTryOnHttpUrl(sourceUrl).href
}
