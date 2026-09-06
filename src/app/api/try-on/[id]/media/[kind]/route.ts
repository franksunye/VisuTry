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

const MEDIA_URL_PATTERN = /\b(?:https?|blob):\/\/[^\s"'<>]+/gi
const MEDIA_CREDENTIAL_PATTERN = /\b(?:authorization|bearer|token|access[_-]?token|refresh[_-]?token|signature|sig|secret|password|passwd|credential|api[_-]?key)\b\s*(?:[:=]\s*)?(?:bearer\s+)?[^\s"'<>]+/gi

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

function sanitizeMediaDiagnostic(value: string): string {
  return value
    .replace(MEDIA_URL_PATTERN, '[redacted-url]')
    .replace(MEDIA_CREDENTIAL_PATTERN, '[redacted-credential]')
    .trim()
}

function normalizeMediaDeliveryError(error: unknown): Error {
  const rawMessage = error instanceof Error
    ? error.message
    : typeof error === 'string'
      ? error
      : ''
  const safeMessage = sanitizeMediaDiagnostic(rawMessage) || 'Try-On media delivery failed'
  const normalized = new Error(safeMessage)
  normalized.name = sanitizeMediaDiagnostic(
    error instanceof Error && error.name ? error.name : 'Error',
  ) || 'Error'
  return normalized
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
  } catch (error) {
    logger.error('api', 'Consumer Try-On media delivery failed', normalizeMediaDeliveryError(error), {
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
