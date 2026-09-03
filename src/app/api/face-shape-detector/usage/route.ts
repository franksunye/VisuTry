import { NextResponse } from 'next/server'
import { FACE_SHAPE_FAILURE_REASONS } from '@/config/face-analysis'
import { getRequestLanguageContext, logger } from '@/lib/logger'
import { isValidLocale } from '@/i18n'

const ALLOWED_STATUSES = new Set(['COMPLETED', 'FAILED'] as const)

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
  const languageContext = getRequestLanguageContext(request)
  let body: {
    status?: unknown
    failureReason?: unknown
    diagnostics?: unknown
    siteLocale?: unknown
  }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ success: false }, { status: 400 })
  }

  const status = body.status
  const siteLocale = typeof body.siteLocale === 'string' && isValidLocale(body.siteLocale)
    ? body.siteLocale
    : undefined

  if (typeof status !== 'string' || !ALLOWED_STATUSES.has(status as 'COMPLETED' | 'FAILED')) {
    return NextResponse.json({ success: false }, { status: 400 })
  }

  // Diagnostics are telemetry only. Never persist them to PostgreSQL and never
  // let an Axiom failure change the detector's successful response.
  const rawReason = body.failureReason
  const failureReason =
    status === 'FAILED' &&
    typeof rawReason === 'string' &&
    ALLOWED_FAILURE_REASONS.has(rawReason)
      ? rawReason
      : null
  const diagnostics = status === 'FAILED'
    ? sanitizeDiagnostics(body.diagnostics)
    : undefined

  try {
    if (status === 'COMPLETED') {
      logger.info('face-shape', 'Free face shape detection completed', {
        ...(siteLocale ? { site_locale: siteLocale } : {}),
      }, languageContext)
    } else {
      logger.warn('face-shape', 'Free face shape detection failed', {
        failureReason,
        ...(siteLocale ? { site_locale: siteLocale } : {}),
        ...(diagnostics ? { diagnostics } : {}),
      }, languageContext)
    }
  } catch {
    // Observability is fail-open for this non-authoritative browser signal.
  }

  return new NextResponse(null, { status: 204 })
}
