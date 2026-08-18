import { get } from '@vercel/blob'
import { NextResponse } from 'next/server'
import { pathnameFromPrivateBlobUrl } from '@/lib/blob/private-signed-url'
import { getTryOnBlobStoreId } from '@/lib/tryon-blob-access'
import {
  decodeLegacyTryOnDataUrl,
  parseLegacyTryOnHttpUrl,
  TRY_ON_MEDIA_ALLOWED_IMAGE_TYPES,
  TRY_ON_MEDIA_MAX_BYTES,
} from '@/lib/tryon-media'

function normalizeContentType(value: string | null | undefined): string {
  const contentType = value?.split(';')[0].trim().toLowerCase()
  if (!contentType || !TRY_ON_MEDIA_ALLOWED_IMAGE_TYPES.has(contentType)) {
    throw new Error('Try-On media has an unsupported content type')
  }
  return contentType
}

function mediaResponse(bytes: ArrayBuffer, contentType: string): Response {
  if (bytes.byteLength === 0 || bytes.byteLength > TRY_ON_MEDIA_MAX_BYTES) {
    throw new Error('Try-On media is empty or exceeds the size limit')
  }

  return new NextResponse(bytes, {
    status: 200,
    headers: {
      'Cache-Control': 'private, no-store',
      'Content-Type': contentType,
      'Content-Length': String(bytes.byteLength),
      'X-Content-Type-Options': 'nosniff',
    },
  })
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

async function readPrivateBlob(sourceUrl: string): Promise<{ bytes: ArrayBuffer; contentType: string } | null> {
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

async function fetchLegacyHttpMedia(sourceUrl: string): Promise<{ bytes: ArrayBuffer; contentType: string }> {
  const url = parseLegacyTryOnHttpUrl(sourceUrl)
  const response = await fetch(url, {
    cache: 'no-store',
    signal: AbortSignal.timeout(15_000),
  })
  if (!response.ok) throw new Error(`Try-On media fetch failed: ${response.status}`)

  const declaredLength = Number(response.headers.get('content-length') || 0)
  if (declaredLength > TRY_ON_MEDIA_MAX_BYTES) {
    throw new Error('Try-On media exceeds the size limit')
  }

  const bytes = await response.arrayBuffer()
  if (bytes.byteLength === 0 || bytes.byteLength > TRY_ON_MEDIA_MAX_BYTES) {
    throw new Error('Try-On media is empty or exceeds the size limit')
  }

  return {
    bytes,
    contentType: normalizeContentType(response.headers.get('content-type')),
  }
}

export async function loadTryOnMediaFile(sourceUrl: string, filename: string): Promise<File> {
  const dataUrl = decodeLegacyTryOnDataUrl(sourceUrl)
  if (dataUrl) return new File([dataUrl.bytes], filename, { type: dataUrl.contentType })

  const privateBlob = await readPrivateBlob(sourceUrl)
  const media = privateBlob ?? await fetchLegacyHttpMedia(sourceUrl)
  return new File([media.bytes], filename, { type: media.contentType })
}

export async function serveLegacyTryOnMedia(sourceUrl: string): Promise<Response> {
  const dataUrl = decodeLegacyTryOnDataUrl(sourceUrl)
  if (dataUrl) return mediaResponse(dataUrl.bytes, dataUrl.contentType)

  const privateBlob = await readPrivateBlob(sourceUrl)
  if (privateBlob) {
    // Private source media must stay same-origin after authorization. This keeps
    // authenticated rendering/download behavior independent of Blob credentials.
    return mediaResponse(privateBlob.bytes, privateBlob.contentType)
  }

  const url = parseLegacyTryOnHttpUrl(sourceUrl)

  // Legacy public HTTP(S) objects remain redirectable after the auth check. This
  // preserves 2A bandwidth behavior while new private source media is proxied.
  const response = NextResponse.redirect(url, 307)
  response.headers.set('Cache-Control', 'private, no-store')
  return response
}
