import { get } from '@vercel/blob'
import { readR2Media, ConsumerMediaNotFound } from '@/lib/consumer-r2-media'
import { r2Key } from '@/lib/consumer-media-reference'
import { parseLegacyPublicConsumerMediaUrl } from '@/lib/consumer-media-url'
import { readConsumerMediaStream } from '@/lib/tryon-media-loader'
import { NextResponse } from 'next/server'
import { pathnameFromPrivateBlobUrl } from '@/lib/blob/private-signed-url'
import { getFaceAnalysisBlobStoreId } from '@/lib/face-analysis-blob-access'

const MAX_SOURCE_PHOTO_BYTES = 15 * 1024 * 1024
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])

export type FaceAnalysisSourcePhotoTask = {
  userImageUrl: string
  metadata: unknown
  expiresAt?: Date | null
  retentionStatus?: string
}

export function adminFaceAnalysisPhotoPath(taskId: string): string {
  return `/api/admin/face-analysis/${encodeURIComponent(taskId)}/photo`
}

export async function serveFaceAnalysisSourcePhoto(
  task: FaceAnalysisSourcePhotoTask,
  options?: { respectBusinessExpiry?: boolean },
): Promise<Response> {
  if (options?.respectBusinessExpiry && task.expiresAt && task.expiresAt.getTime() <= Date.now()) {
    throw new ConsumerMediaNotFound()
  }
  const photo = await loadFaceAnalysisSourcePhoto(task)
  return imageResponse(photo.bytes, photo.contentType)
}

export async function loadFaceAnalysisSourcePhoto(task: FaceAnalysisSourcePhotoTask) {
  if (task.retentionStatus && task.retentionStatus !== 'ACTIVE') throw new ConsumerMediaNotFound()
  const metadata =
    task.metadata && typeof task.metadata === 'object' && !Array.isArray(task.metadata)
      ? task.metadata as Record<string, unknown>
      : {}
  const key = r2Key(task.userImageUrl, 'face')
  if (key) {
    if (metadata.mediaProvider !== 'r2') throw new Error('Face Analysis media provider mismatch')
    return readR2Media(task.userImageUrl, 'face')
  }
  if (metadata.mediaProvider !== undefined && metadata.mediaProvider !== 'vercel-blob') {
    throw new Error('Unknown Face Analysis media provider')
  }
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
      throw new ConsumerMediaNotFound()
    }

    const contentType = normalizeImageContentType(result.blob.contentType)
    return { bytes: await readConsumerMediaStream(result.stream), contentType }
  }

  const sourceUrl = parseLegacyPublicConsumerMediaUrl(task.userImageUrl, 'face')
  const sourceResponse = await fetch(sourceUrl, {
    cache: 'no-store',
    redirect: 'error',
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

  if (!sourceResponse.body) throw new Error('Face Analysis photo has no body')
  return { bytes: await readConsumerMediaStream(sourceResponse.body), contentType }
}

function normalizeImageContentType(value: string | null | undefined): string {
  const contentType = value?.split(';')[0].trim().toLowerCase()
  if (!contentType || !ALLOWED_IMAGE_TYPES.has(contentType)) {
    throw new Error('Face Analysis photo has an unsupported content type')
  }
  return contentType
}

function imageResponse(body: ArrayBuffer, contentType: string): Response {
  return new NextResponse(body, {
    status: 200,
    headers: {
      'Cache-Control': 'private, no-store',
      'Content-Type': contentType,
      'Content-Length': String(body.byteLength),
      'X-Content-Type-Options': 'nosniff',
    },
  })
}
