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
  detectedFileFormat?: string
  compressionFailed?: boolean
  compressionErrorName?: string
  compressionErrorMessage?: string
  bitmapDecodeErrorName?: string
  bitmapDecodeErrorMessage?: string
  htmlImageDecodeErrorName?: string
  htmlImageDecodeErrorMessage?: string
  gpuRuntimeErrorName?: string
  gpuRuntimeErrorMessage?: string
  cpuRuntimeErrorName?: string
  cpuRuntimeErrorMessage?: string
}

const DIAGNOSTIC_STRING_LIMITS: Record<string, number> = {
  sourceFileType: 64,
  detectorFileType: 64,
  detectedFileFormat: 64,
  compressionErrorName: 96,
  compressionErrorMessage: 96,
  bitmapDecodeErrorName: 96,
  bitmapDecodeErrorMessage: 96,
  htmlImageDecodeErrorName: 96,
  htmlImageDecodeErrorMessage: 96,
  gpuRuntimeErrorName: 96,
  gpuRuntimeErrorMessage: 96,
  cpuRuntimeErrorName: 96,
  cpuRuntimeErrorMessage: 96,
}

function sanitizeDiagnostics(value: unknown): DetectionDiagnostics | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined

  const raw = value as Record<string, unknown>
  const diagnostics: DetectionDiagnostics = {}

  for (const [key, limit] of Object.entries(DIAGNOSTIC_STRING_LIMITS)) {
    const value = raw[key]
    if (typeof value === 'string' && value.length > 0) {
      ;(diagnostics as Record<string, unknown>)[key] = value.slice(0, limit)
    }
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
