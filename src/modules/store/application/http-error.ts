import { NextResponse } from 'next/server'
import { StoreDomainError } from '../domain'
import { storeApiError } from '../contracts'

export function storeErrorResponse(error: unknown): NextResponse {
  if (error instanceof StoreDomainError) {
    const headers: HeadersInit = {}
    const detail = error.message
    const retryMatch = /retry_after=(\d+)/.exec(detail)
    if (retryMatch && error.httpStatus === 429) {
      headers['Retry-After'] = retryMatch[1]
    }
    return NextResponse.json(
      storeApiError(error.code, error.shopperMessage),
      { status: error.httpStatus, headers },
    )
  }

  console.error('[store]', error)
  return NextResponse.json(
    storeApiError('INTERNAL_ERROR', 'Something went wrong. Please try again.'),
    { status: 500 },
  )
}
