import { NextResponse } from 'next/server'

export type TryOnMediaKind = 'user' | 'item' | 'result'

const MAX_MEDIA_BYTES = 15 * 1024 * 1024
const MAX_BASE64_CHARS = Math.ceil(MAX_MEDIA_BYTES / 3) * 4 + 4
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])

export function tryOnMediaPath(taskId: string, kind: TryOnMediaKind): string {
  return `/api/try-on/${encodeURIComponent(taskId)}/media/${kind}`
}

export function tryOnMediaUrls(task: {
  id: string
  userImageUrl?: string | null
  itemImageUrl?: string | null
  glassesImageUrl?: string | null
  resultImageUrl?: string | null
}) {
  return {
    userImageUrl: task.userImageUrl ? tryOnMediaPath(task.id, 'user') : null,
    itemImageUrl: (task.itemImageUrl || task.glassesImageUrl) ? tryOnMediaPath(task.id, 'item') : null,
    glassesImageUrl: task.glassesImageUrl ? tryOnMediaPath(task.id, 'item') : null,
    resultImageUrl: task.resultImageUrl ? tryOnMediaPath(task.id, 'result') : null,
  }
}

function mediaResponse(bytes: ArrayBuffer, contentType: string): Response {
  if (bytes.byteLength === 0 || bytes.byteLength > MAX_MEDIA_BYTES) {
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

function decodeLegacyDataUrl(sourceUrl: string): { bytes: ArrayBuffer; contentType: string } | null {
  if (!sourceUrl.startsWith('data:')) return null

  const match = /^data:(image\/(?:jpeg|png|webp));base64,([a-z0-9+/=\s]+)$/i.exec(sourceUrl)
  if (!match) throw new Error('Unsupported Try-On data URL')

  const contentType = match[1].toLowerCase()
  const encoded = match[2].replace(/\s/g, '')
  if (!ALLOWED_IMAGE_TYPES.has(contentType) || encoded.length === 0 || encoded.length > MAX_BASE64_CHARS) {
    throw new Error('Try-On media is invalid or exceeds the size limit')
  }

  const buffer = Buffer.from(encoded, 'base64')
  if (buffer.byteLength === 0 || buffer.byteLength > MAX_MEDIA_BYTES) {
    throw new Error('Try-On media is empty or exceeds the size limit')
  }

  const bytes = new Uint8Array(buffer.byteLength)
  bytes.set(buffer)
  return { bytes: bytes.buffer, contentType }
}

export async function serveLegacyTryOnMedia(sourceUrl: string): Promise<Response> {
  const dataUrl = decodeLegacyDataUrl(sourceUrl)
  if (dataUrl) return mediaResponse(dataUrl.bytes, dataUrl.contentType)

  const url = new URL(sourceUrl)
  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    throw new Error('Unsupported Try-On media URL')
  }

  const sourceResponse = await fetch(url, {
    cache: 'no-store',
    signal: AbortSignal.timeout(15_000),
  })
  if (!sourceResponse.ok) {
    throw new Error(`Try-On media fetch failed: ${sourceResponse.status}`)
  }

  const contentType = sourceResponse.headers.get('content-type')?.split(';')[0].trim().toLowerCase()
  if (!contentType || !ALLOWED_IMAGE_TYPES.has(contentType)) {
    throw new Error('Try-On media has an unsupported content type')
  }

  const declaredLength = Number(sourceResponse.headers.get('content-length') || 0)
  if (declaredLength > MAX_MEDIA_BYTES) {
    throw new Error('Try-On media exceeds the size limit')
  }

  const bytes = await sourceResponse.arrayBuffer()
  return mediaResponse(bytes, contentType)
}
