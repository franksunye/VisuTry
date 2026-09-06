import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma'
import { parseLegacyTryOnHttpUrl, type TryOnMediaKind } from '@/lib/tryon-media'
import { getRequestContext, logger } from '@/lib/logger'
import { serveLegacyTryOnMedia } from '@/lib/tryon-media-response'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

const MEDIA_KINDS = new Set<TryOnMediaKind>(['user', 'item', 'result'])

type RouteParams = { params: { id: string; kind: string } }

function mediaSourceClass(sourceUrl: string | null | undefined) {
  if (!sourceUrl) return 'missing'
  if (sourceUrl.startsWith('data:')) return 'data'
  try {
    const parsed = parseLegacyTryOnHttpUrl(sourceUrl)
    if (parsed.hostname.endsWith('.private.blob.vercel-storage.com')) return 'private_blob'
    return 'legacy_http'
  } catch {
    return 'invalid'
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const ctx = getRequestContext(request)
  let authenticatedUserId: string | undefined
  let ownershipResult = 'unknown'
  let sourceClass = 'unknown'

  try {
    const auth = await requireAuth()
    if (!auth.ok) {
      ownershipResult = 'unauthenticated'
      logger.warn('api', 'Consumer Try-On media request denied', {
        taskId: params.id,
        type: params.kind,
        status: ownershipResult,
        source_class: sourceClass,
        errorType: 'unauthenticated',
      }, ctx)
      return auth.response
    }
    authenticatedUserId = auth.userId

    if (!MEDIA_KINDS.has(params.kind as TryOnMediaKind)) {
      ownershipResult = 'not_checked'
      logger.warn('api', 'Consumer Try-On media request denied', {
        taskId: params.id,
        type: params.kind,
        userId: authenticatedUserId,
        status: ownershipResult,
        source_class: sourceClass,
        errorType: 'unsupported_media_kind',
      }, ctx)
      return NextResponse.json({ success: false, error: 'Media not found' }, { status: 404 })
    }

    const task = await prisma.tryOnTask.findUnique({
      where: { id: params.id },
      select: {
        userId: true,
        userImageUrl: true,
        itemImageUrl: true,
        glassesImageUrl: true,
        resultImageUrl: true,
      },
    })

    if (!task) {
      ownershipResult = 'task_not_found'
      logger.warn('api', 'Consumer Try-On media request failed', {
        taskId: params.id,
        type: params.kind,
        userId: authenticatedUserId,
        status: ownershipResult,
        source_class: sourceClass,
        errorType: 'task_not_found',
      }, ctx)
      return NextResponse.json({ success: false, error: 'Task not found' }, { status: 404 })
    }
    if (task.userId !== auth.userId) {
      ownershipResult = 'forbidden'
      logger.warn('api', 'Consumer Try-On media request denied', {
        taskId: params.id,
        type: params.kind,
        userId: authenticatedUserId,
        taskUserId: task.userId,
        status: ownershipResult,
        source_class: sourceClass,
        errorType: 'ownership_denied',
      }, ctx)
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }
    ownershipResult = 'owner'

    const kind = params.kind as TryOnMediaKind
    const sourceUrl = kind === 'user'
      ? task.userImageUrl
      : kind === 'item'
        ? task.itemImageUrl || task.glassesImageUrl
        : task.resultImageUrl
    sourceClass = mediaSourceClass(sourceUrl)

    if (!sourceUrl) {
      logger.warn('api', 'Consumer Try-On media request failed', {
        taskId: params.id,
        type: params.kind,
        userId: authenticatedUserId,
        status: ownershipResult,
        source_class: sourceClass,
        errorType: 'media_not_found',
      }, ctx)
      return NextResponse.json({ success: false, error: 'Media not found' }, { status: 404 })
    }

    return await serveLegacyTryOnMedia(sourceUrl)
  } catch {
    logger.error('api', 'Consumer Try-On media delivery failed', new Error('Try-On media delivery failed'), {
      userId: authenticatedUserId,
      taskId: params.id,
      type: params.kind,
      status: ownershipResult,
      source_class: sourceClass,
      errorType: 'media_delivery_failed',
    }, ctx)
    return NextResponse.json({ success: false, error: 'Media unavailable' }, { status: 502 })
  }
}
