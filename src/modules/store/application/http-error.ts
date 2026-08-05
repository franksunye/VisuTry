import { NextResponse } from 'next/server'
import { StoreDomainError } from '../domain'
import { storeApiError } from '../contracts'

export function storeErrorResponse(error: unknown): NextResponse {
  if (error instanceof StoreDomainError) {
    return NextResponse.json(
      storeApiError(error.code, error.shopperMessage),
      { status: error.httpStatus },
    )
  }

  console.error('[store]', error)
  return NextResponse.json(
    storeApiError('INTERNAL_ERROR', 'Something went wrong. Please try again.'),
    { status: 500 },
  )
}
