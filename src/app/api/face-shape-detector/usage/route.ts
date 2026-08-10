import { NextResponse } from 'next/server'
import { TaskStatus } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { FACE_SHAPE_FAILURE_REASONS } from '@/config/face-analysis'
import { getRequestContext, logger } from '@/lib/logger'

const ALLOWED_STATUSES = new Set<TaskStatus>([
  TaskStatus.COMPLETED,
  TaskStatus.FAILED,
])

const ALLOWED_FAILURE_REASONS = new Set<string>(FACE_SHAPE_FAILURE_REASONS)

type DetectionDiagnostics = {
  sourceFileType?: string
  sourceFileSize?: number
  detectorFileType?: string
  detectorFileSize?: number
  compressionFailed?: boolean
  compressionErrorName?: string
}

function sanitizeDiagnostics(value: unknown): DetectionDiagnostics | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined

  const raw = value as Record<string, unknown>
  const diagnostics: DetectionDiagnostics = {}
  if (typeof raw.sourceFileType === 'string' && raw.sourceFileType.length > 0) {
    diagnostics.sourceFileType = raw.sourceFileType.slice(0, 64)
  }
  if (typeof raw.detectorFileType === 'string' && raw.detectorFileType.length > 0) {
    diagnostics.detectorFileType = raw.detectorFileType.slice(0, 64)
  }
  if (typeof raw.compressionErrorName === 'string' && raw.compressionErrorName.length > 0) {
    diagnostics.compressionErrorName = raw.compressionErrorName.slice(0, 96)
  }
  if (typeof raw.sourceFileSize === 'number' && Number.isFinite(raw.sourceFileSize) && raw.sourceFileSize >= 0) {
    diagnostics.sourceFileSize = raw.sourceFileSize
  }
  if (typeof raw.detectorFileSize === 'number' && Number.isFinite(raw.detectorFileSize) && raw.detectorFileSize >= 0) {
    diagnostics.detectorFileSize = raw.detectorFileSize
  }
  if (typeof raw.compressionFailed === 'boolean') {
    diagnostics.compressionFailed = raw.compressionFailed
  }

  return Object.keys(diagnostics).length > 0 ? diagnostics : undefined
}

export async function POST(request: Request) {
  const ctx = getRequestContext(request)
  try {
    const body = await request.json() as {
      status?: unknown
      failureReason?: unknown
      diagnostics?: unknown
    }
    const status = body.status

    if (typeof status !== 'string' || !ALLOWED_STATUSES.has(status as TaskStatus)) {
      return NextResponse.json({ success: false }, { status: 400 })
    }

    // failureReason is only meaningful for FAILED records; ignore it for COMPLETED.
    const rawReason = body.failureReason
    const failureReason =
      status === TaskStatus.FAILED &&
      typeof rawReason === 'string' &&
      ALLOWED_FAILURE_REASONS.has(rawReason)
        ? rawReason
        : null
    const diagnostics = status === TaskStatus.FAILED
      ? sanitizeDiagnostics(body.diagnostics)
      : undefined

    await prisma.faceShapeDetection.create({
      data: {
        status: status as TaskStatus,
        failureReason,
      },
    })

    if (status === TaskStatus.COMPLETED) {
      logger.info('face-shape', 'Free face shape detection completed', {}, ctx)
    } else {
      logger.warn('face-shape', 'Free face shape detection failed', {
        failureReason,
        ...(diagnostics ? { diagnostics } : {}),
      }, ctx)
    }

    return NextResponse.json({ success: true }, { status: 201 })
  } catch (error) {
    logger.error(
      'face-shape',
      'Free face shape detection usage write failed',
      error instanceof Error ? error : new Error(String(error)),
      ctx,
    )
    return NextResponse.json({ success: false }, { status: 500 })
  }
}
