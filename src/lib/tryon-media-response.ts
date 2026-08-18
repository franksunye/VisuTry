import { NextResponse } from 'next/server'
import { loadPrivateTryOnMedia } from '@/lib/tryon-media-loader'
import {
  decodeLegacyTryOnDataUrl,
  parseLegacyTryOnHttpUrl,
  TRY_ON_MEDIA_MAX_BYTES,
} from '@/lib/tryon-media'

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

export async function serveLegacyTryOnMedia(sourceUrl: string): Promise<Response> {
  const dataUrl = decodeLegacyTryOnDataUrl(sourceUrl)
  if (dataUrl) return mediaResponse(dataUrl.bytes, dataUrl.contentType)

  const privateBlob = await loadPrivateTryOnMedia(sourceUrl)
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
