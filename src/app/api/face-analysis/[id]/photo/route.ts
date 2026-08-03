import { NextRequest, NextResponse } from 'next/server'
import { TaskStatus } from '@prisma/client'
import { requireAuth } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma'
import { getRequestContext, logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

const MAX_SOURCE_PHOTO_BYTES = 15 * 1024 * 1024
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])

type RouteParams = { params: { id: string } }

export async function GET(request: NextRequest, { params }: RouteParams) {
  const ctx = getRequestContext(request)

  try {
    const auth = await requireAuth()
    if (!auth.ok) return auth.response

    const task = await prisma.faceAnalysisTask.findFirst({
      where: {
        id: params.id,
        userId: auth.userId,
        status: TaskStatus.COMPLETED,
        reportUnlocked: true,
      },
      select: { userImageUrl: true },
    })

    if (!task?.userImageUrl) {
      return NextResponse.json({ success: false, error: 'Photo not found' }, { status: 404 })
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
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    logger.error('face-analysis', 'Failed to restore source photo', err, ctx)
    return NextResponse.json(
      { success: false, error: 'Face Analysis photo is unavailable' },
      { status: 502 },
    )
  }
}
