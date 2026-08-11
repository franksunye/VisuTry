/**
 * Stable machine-readable Store error codes + shopper-safe messages.
 */

export type StoreErrorCode =
  | 'MERCHANT_NOT_FOUND'
  | 'MERCHANT_INACTIVE'
  | 'EXPERIENCE_NOT_FOUND'
  | 'FRAME_NOT_FOUND'
  | 'FRAME_INACTIVE'
  | 'SESSION_NOT_FOUND'
  | 'SESSION_EXPIRED'
  | 'SESSION_UNAUTHORIZED'
  | 'ALLOWANCE_EXCEEDED'
  | 'CAPABILITY_DISABLED'
  | 'VALIDATION_ERROR'
  | 'IDEMPOTENCY_CONFLICT'
  | 'PRIVACY_VIOLATION'
  | 'INTERNAL_ERROR'

export class StoreDomainError extends Error {
  readonly code: StoreErrorCode
  readonly httpStatus: number
  readonly shopperMessage: string

  constructor(
    code: StoreErrorCode,
    shopperMessage: string,
    httpStatus: number,
    detail?: string,
  ) {
    super(detail ?? shopperMessage)
    this.name = 'StoreDomainError'
    this.code = code
    this.shopperMessage = shopperMessage
    this.httpStatus = httpStatus
  }
}

export function merchantNotFound(): StoreDomainError {
  return new StoreDomainError(
    'MERCHANT_NOT_FOUND',
    'This store is unavailable.',
    404,
  )
}

export function merchantInactive(): StoreDomainError {
  return new StoreDomainError(
    'MERCHANT_INACTIVE',
    'This store is temporarily unavailable.',
    403,
  )
}

export function experienceNotFound(): StoreDomainError {
  return new StoreDomainError(
    'EXPERIENCE_NOT_FOUND',
    'This experience is unavailable.',
    404,
  )
}

export function sessionUnauthorized(): StoreDomainError {
  return new StoreDomainError(
    'SESSION_UNAUTHORIZED',
    'Your session could not be verified. Please start again.',
    401,
  )
}

export function sessionExpired(): StoreDomainError {
  return new StoreDomainError(
    'SESSION_EXPIRED',
    'Your session has expired. Please start again.',
    401,
  )
}

export function frameInactive(): StoreDomainError {
  return new StoreDomainError(
    'FRAME_INACTIVE',
    'This frame is no longer available.',
    409,
  )
}
