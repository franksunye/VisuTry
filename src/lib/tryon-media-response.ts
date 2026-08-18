import { NextResponse } from 'next/server'
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

  const url = parseLegacyTryOnHttpUrl(sourceUrl)

  // Step 2A keeps legacy HTTP(S) objects public. Redirecting after the auth check
  // avoids proxying every image byte through a Vercel Function while preserving the
  // application-owned DTO boundary. Step 2B can replace this target with a short-lived
  // signed private Blob URL without changing browser-facing media paths.
  const response = NextResponse.redirect(url, 307)
  response.headers.set('Cache-Control', 'private, no-store')
  return response
}
