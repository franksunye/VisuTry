import { NextResponse } from 'next/server'
import {
  createPrivateBlobGetUrl,
  pathnameFromPrivateBlobUrl,
  privateBlobRedirect,
} from '@/lib/blob/private-signed-url'
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
    const grant = await createPrivateBlobGetUrl({
      pathname: blobPathname,
      businessExpiresAt: options?.respectBusinessExpiry === false ? null : task.expiresAt,
      storeId: getFaceAnalysisBlobStoreId(),
    })
    return privateBlobRedirect(grant.url)
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

  const contentType = sourceResponse.headers.get('content-type')?.split(';')[0].trim().toLowerCase()
  if (!contentType || !ALLOWED_IMAGE_TYPES.has(contentType)) {
    throw new Error('Face Analysis photo has an unsupported content type')
  }

  const declaredLength = Number(sourceResponse.headers.get('content-length') || 0)
  if (declaredLength > MAX_SOURCE_PHOTO_BYTES) {
    throw new Error('Face Analysis photo exceeds the size limit')
  }

  const photo = await sourceResponse.arrayBuffer()
  if (photo.byteLength === 0 || photo.byteLength > MAX_SOURCE_PHOTO_BYTES) {
    throw new Error('Face Analysis photo is empty or exceeds the size limit')
  }

  return new NextResponse(photo, {
    status: 200,
    headers: {
      'Cache-Control': 'private, no-store',
      'Content-Type': contentType,
      'Content-Length': String(photo.byteLength),
      'X-Content-Type-Options': 'nosniff',
    },
  })
}
