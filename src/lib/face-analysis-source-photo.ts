import { get } from '@vercel/blob'
import { NextResponse } from 'next/server'
import { pathnameFromPrivateBlobUrl } from '@/lib/blob/private-signed-url'
import { getFaceAnalysisBlobStoreId } from '@/lib/face-analysis-blob-access'

const MAX_SOURCE_PHOTO_BYTES = 15 * 1024 * 1024
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])

export type FaceAnalysisSourcePhotoTask = {
  userImageUrl: string
  metadata: unknown
  expiresAt?: Date | null
}

export function adminFaceAnalysisPhotoPath(taskId: string): string {
  return `/api/admin/face-analysis/${encodeURIComponent(taskId)}/photo`
}

export async function serveFaceAnalysisSourcePhoto(
  task: FaceAnalysisSourcePhotoTask,
  options?: { respectBusinessExpiry?: boolean },
): Promise<Response> {
  const metadata =
    task.metadata && typeof task.metadata === 'object' && !Array.isArray(task.metadata)
      ? task.metadata as Record<string, unknown>
      : {}
  const blobPathname =
    (typeof metadata.blobPathname === 'string' ? metadata.blobPathname : null) ??
    pathnameFromPrivateBlobUrl(task.userImageUrl)
  const isPrivate =
    metadata.blobAccess === 'private' || pathnameFromPrivateBlobUrl(task.userImageUrl) != null

  if (isPrivate) {
    if (!blobPathname) {
      throw new Error('Private Face Analysis photo is missing its Blob pathname')
    }

    // Keep the browser-facing response same-origin. Returning a signed Blob redirect
    // lets <img> render the photo, but the final cross-origin resource can no longer be
    // safely consumed by Canvas/WebGL-backed MediaPipe landmark detection.
    const result = await get(blobPathname, {
      access: 'private',
      storeId: getFaceAnalysisBlobStoreId(),
    })
    if (!result?.stream) {
      throw new Error('Failed to load private Face Analysis photo')
    }

    const contentType = normalizeImageContentType(result.blob.contentType)
    const photo = await readPhotoStream(result.stream)
    return imageResponse(photo, contentType)
  }

  const sourceUrl = new URL(task.userImageUrl)
  if (sourceUrl.protocol !== 'https:' && sourceUrl.protocol !== 'http:') {
    throw new Error('Unsupported Face Analysis photo URL')
  }

  const sourceResponse = await fetch(sourceUrl, {
    cache: 'no-store',
    signal: AbortSignal.timeout(15_000),
  })
  if (!sourceResponse.ok) {
    throw new Error(`Face Analysis photo fetch failed: ${sourceResponse.status}`)
  }

  const contentType = normalizeImageContentType(sourceResponse.headers.get('content-type'))
  const declaredLength = Number(sourceResponse.headers.get('content-length') || 0)
  if (declaredLength > MAX_SOURCE_PHOTO_BYTES) {
    throw new Error('Face Analysis photo exceeds the size limit')
  }

  const photo = new Uint8Array(await sourceResponse.arrayBuffer())
  if (photo.byteLength === 0 || photo.byteLength > MAX_SOURCE_PHOTO_BYTES) {
    throw new Error('Face Analysis photo is empty or exceeds the size limit')
  }

  return imageResponse(photo, contentType)
}

function normalizeImageContentType(value: string | null | undefined): string {
  const contentType = value?.split(';')[0].trim().toLowerCase()
  if (!contentType || !ALLOWED_IMAGE_TYPES.has(contentType)) {
    throw new Error('Face Analysis photo has an unsupported content type')
  }
  return contentType
}

async function readPhotoStream(stream: ReadableStream<Uint8Array>): Promise<Uint8Array> {
  const reader = stream.getReader()
  const chunks: Uint8Array[] = []
  let totalBytes = 0

  try {
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      if (!value) continue

      totalBytes += value.byteLength
      if (totalBytes > MAX_SOURCE_PHOTO_BYTES) {
        await reader.cancel('Face Analysis photo exceeds the size limit')
        throw new Error('Face Analysis photo exceeds the size limit')
      }
      chunks.push(value)
    }
  } finally {
    reader.releaseLock()
  }

  if (totalBytes === 0) {
    throw new Error('Face Analysis photo is empty')
  }

  const photo = new Uint8Array(totalBytes)
  let offset = 0
  for (const chunk of chunks) {
    photo.set(chunk, offset)
    offset += chunk.byteLength
  }
  return photo
}

function imageResponse(photo: Uint8Array, contentType: string): Response {
  // NextResponse's BodyInit typing rejects Uint8Array<ArrayBufferLike> under the
  // current TypeScript/lib.dom combination. Copy into a concrete ArrayBuffer so
  // the response body is both type-safe and byte-identical.
  const body = new ArrayBuffer(photo.byteLength)
  new Uint8Array(body).set(photo)

  return new NextResponse(body, {
    status: 200,
    headers: {
      'Cache-Control': 'private, no-store',
      'Content-Type': contentType,
      'Content-Length': String(photo.byteLength),
      'X-Content-Type-Options': 'nosniff',
    },
  })
}
