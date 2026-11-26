import { get } from '@vercel/blob'
import { readR2Media, ConsumerMediaNotFound } from '@/lib/consumer-r2-media'
import { r2Key } from '@/lib/consumer-media-reference'
import { parseLegacyPublicConsumerMediaUrl } from '@/lib/consumer-media-url'
import type { TryOnMediaKind } from '@/lib/tryon-media'
import { pathnameFromPrivateBlobUrl } from '@/lib/blob/private-signed-url'
import { getTryOnBlobStoreId } from '@/lib/tryon-blob-access'
import {
  decodeLegacyTryOnDataUrl,
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

export async function readConsumerMediaStream(stream: ReadableStream<Uint8Array>): Promise<ArrayBuffer> {
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

export async function loadPrivateTryOnMedia(sourceUrl: string, kind: TryOnMediaKind = 'result'): Promise<LoadedTryOnMedia | null> {
  if (r2Key(sourceUrl, kind)) return readR2Media(sourceUrl, kind)
  const pathname = pathnameFromPrivateBlobUrl(sourceUrl)
  if (!pathname) return null

  const result = await get(pathname, {
    access: 'private',
    storeId: getTryOnBlobStoreId(),
  })
  if (!result?.stream) throw new ConsumerMediaNotFound()

  return {
    bytes: await readConsumerMediaStream(result.stream),
    contentType: normalizeContentType(result.blob.contentType),
  }
}

async function fetchLegacyHttpMedia(sourceUrl: string): Promise<LoadedTryOnMedia> {
  const url = parseLegacyPublicConsumerMediaUrl(sourceUrl, 'result')
  const response = await fetch(url, {
    cache: 'no-store',
    redirect: 'error',
    signal: AbortSignal.timeout(15_000),
  })
  if (!response.ok) throw new Error(`Try-On media fetch failed: ${response.status}`)

  const declaredLength = Number(response.headers.get('content-length') || 0)
  if (declaredLength > TRY_ON_MEDIA_MAX_BYTES) {
    throw new Error('Try-On media exceeds the size limit')
  }

  if (!response.body) throw new Error('Try-On media response has no body')
  const bytes = await readConsumerMediaStream(response.body)

  return {
    bytes,
    contentType: normalizeContentType(response.headers.get('content-type')),
  }
}

export async function loadTryOnMediaFile(sourceUrl: string, filename: string): Promise<File> {
  const dataUrl = decodeLegacyTryOnDataUrl(sourceUrl)
  if (dataUrl) return new File([dataUrl.bytes], filename, { type: dataUrl.contentType })

  const privateMedia = await loadPrivateTryOnMedia(sourceUrl)
  const media = privateMedia ?? await fetchLegacyHttpMedia(sourceUrl)
  return new File([media.bytes], filename, { type: media.contentType })
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
export async function tryOnProviderMediaInput(sourceUrl: string, kind: 'user' | 'item' = 'user'): Promise<string> {
  const dataUrl = decodeLegacyTryOnDataUrl(sourceUrl)
  if (dataUrl) return sourceUrl

  const privateMedia = await loadPrivateTryOnMedia(sourceUrl, kind)
  if (privateMedia) return mediaToDataUri(privateMedia)

  return parseLegacyPublicConsumerMediaUrl(sourceUrl, kind).href
}
