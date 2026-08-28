import type { GenerationErrorCode } from '@prisma/client'

export const GENERATION_ERROR_CODES = [
  'PROVIDER_REJECTED',
  'PROVIDER_FAILED',
  'PROVIDER_TIMEOUT',
  'NETWORK_ERROR',
  'INVALID_INPUT',
  'CONTENT_POLICY',
  'UPLOAD_OR_ASSET_ERROR',
  'CALLBACK_ERROR',
  'INTERNAL_ERROR',
  'UNKNOWN',
] as const

export type NormalizedGenerationErrorCode = (typeof GENERATION_ERROR_CODES)[number]

export type ClassifiedGenerationError = {
  errorCode: GenerationErrorCode
  isTimeout: boolean
  errorMessageNormalized: string | null
}

const URL_RE = /https?:\/\/\S+/gi
const DATA_URI_RE = /data:[^,\s]+,[^\s]*/gi

export function normalizeGenerationErrorMessage(message?: string | null): string | null {
  if (!message) return null
  const trimmed = message.replace(DATA_URI_RE, '[image]').replace(URL_RE, '[url]').replace(/\s+/g, ' ').trim()
  if (!trimmed) return null
  return trimmed.slice(0, 200)
}

function includesAny(haystack: string, needles: string[]) {
  return needles.some((needle) => haystack.includes(needle))
}

/**
 * Map provider/local failure text onto the reporting taxonomy.
 * Baseline metrics must use these codes, not raw provider strings.
 */
export function classifyGenerationError(
  error?: string | null,
  options?: { httpStatus?: number | null; source?: 'submit' | 'poll' | 'persist' | 'upload' | 'internal' },
): ClassifiedGenerationError {
  const normalized = normalizeGenerationErrorMessage(error)
  const haystack = (error || '').toLowerCase()
  const source = options?.source
  const httpStatus = options?.httpStatus

  if (source === 'upload' || includesAny(haystack, ['failed to upload', 'failed to persist', 'blob', 'asset'])) {
    if (includesAny(haystack, ['failed to upload', 'failed to persist', 'already exists', 'precondition'])) {
      return { errorCode: 'UPLOAD_OR_ASSET_ERROR', isTimeout: false, errorMessageNormalized: normalized }
    }
  }

  if (source === 'internal') {
    return { errorCode: 'INTERNAL_ERROR', isTimeout: false, errorMessageNormalized: normalized }
  }

  const isTimeout = includesAny(haystack, [
    'timeout',
    'timed out',
    'time out',
    'deadline exceeded',
    'etimedout',
  ])

  if (isTimeout) {
    return { errorCode: 'PROVIDER_TIMEOUT', isTimeout: true, errorMessageNormalized: normalized }
  }

  if (
    includesAny(haystack, [
      'network error',
      'fetch failed',
      'socket hang up',
      'econnreset',
      'econnrefused',
      'enotfound',
      'dns',
    ])
  ) {
    return { errorCode: 'NETWORK_ERROR', isTimeout: false, errorMessageNormalized: normalized }
  }

  if (
    includesAny(haystack, [
      'content policy',
      'safety',
      'blocked',
      'nsfw',
      'moderation',
      'prohibited',
    ])
  ) {
    return { errorCode: 'CONTENT_POLICY', isTimeout: false, errorMessageNormalized: normalized }
  }

  if (
    includesAny(haystack, [
      'image format',
      'invalid image',
      'invalid input',
      'unsupported',
      'bad request',
      'mime',
    ]) ||
    httpStatus === 400
  ) {
    return { errorCode: 'INVALID_INPUT', isTimeout: false, errorMessageNormalized: normalized }
  }

  if (httpStatus === 401 || httpStatus === 403 || httpStatus === 429 || (httpStatus != null && httpStatus >= 400 && httpStatus < 500)) {
    return { errorCode: 'PROVIDER_REJECTED', isTimeout: false, errorMessageNormalized: normalized }
  }

  if (
    source === 'submit' &&
    includesAny(haystack, ['no task id', 'submission failed', 'unexpected response'])
  ) {
    return { errorCode: 'PROVIDER_REJECTED', isTimeout: false, errorMessageNormalized: normalized }
  }

  if (source === 'persist' && includesAny(haystack, ['callback', 'webhook'])) {
    return { errorCode: 'CALLBACK_ERROR', isTimeout: false, errorMessageNormalized: normalized }
  }

  if (haystack) {
    return { errorCode: 'PROVIDER_FAILED', isTimeout: false, errorMessageNormalized: normalized }
  }

  return { errorCode: 'UNKNOWN', isTimeout: false, errorMessageNormalized: normalized }
}
