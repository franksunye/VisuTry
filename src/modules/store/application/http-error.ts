import { NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { StoreDomainError } from '../domain'
import { storeApiError } from '../contracts'

/**
 * Map Store domain / unexpected errors to HTTP responses and Axiom-visible logs.
 * Validation / not-found stay quiet (debug); security, quota, and 5xx are surfaced.
 */
export function storeErrorResponse(error: unknown): NextResponse {
  if (error instanceof StoreDomainError) {
    const headers: HeadersInit = {}
    const detail = error.message
    const retryMatch = /retry_after=(\d+)/.exec(detail)
    if (retryMatch && error.httpStatus === 429) {
      headers['Retry-After'] = retryMatch[1]
    }

    logStoreDomainError(error)

    return NextResponse.json(
      storeApiError(error.code, error.shopperMessage),
      { status: error.httpStatus, headers },
    )
  }

  const err = error instanceof Error ? error : new Error(String(error))
  logger.error('store', 'Unhandled Store API error', err)
  return NextResponse.json(
    storeApiError('INTERNAL_ERROR', 'Something went wrong. Please try again.'),
    { status: 500 },
  )
}

function logStoreDomainError(error: StoreDomainError): void {
  const data = {
    code: error.code,
    httpStatus: error.httpStatus,
    detail: error.message !== error.shopperMessage ? error.message : undefined,
  }

  switch (error.code) {
    case 'ALLOWANCE_EXCEEDED':
      logger.warn('store', 'Store allowance or abuse limit exceeded', data)
      return
    case 'AUTH_REQUIRED':
    case 'CONSUMER_CREDITS_REQUIRED':
    case 'SPONSORED_ALLOWANCE_EXHAUSTED':
      logger.info('store', 'Merchant sponsored usage requires consumer continuation', data)
      return
    case 'SESSION_UNAUTHORIZED':
    case 'PRIVACY_VIOLATION':
      logger.warn('store', 'Store access denied', data)
      return
    case 'MERCHANT_INACTIVE':
      logger.warn('store', 'Store merchant inactive', data)
      return
    case 'INTERNAL_ERROR':
      logger.error('store', 'Store domain internal error', error, data)
      return
    case 'SESSION_EXPIRED':
    case 'SESSION_NOT_FOUND':
    case 'MERCHANT_NOT_FOUND':
    case 'FRAME_NOT_FOUND':
    case 'FRAME_INACTIVE':
    case 'VALIDATION_ERROR':
    case 'IDEMPOTENCY_CONFLICT':
      logger.debug('store', 'Store client/domain rejection', data)
      return
    default:
      logger.warn('store', 'Store domain error', data)
  }
}
