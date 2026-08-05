import { StoreDomainError } from '../domain/errors'

/**
 * Application-layer tenant consistency checks for writes that Prisma
 * cannot express as composite foreign keys across all Store tables.
 */
export function assertSameMerchantTenant(
  expectedMerchantId: string,
  actualMerchantId: string | null | undefined,
  subject: string,
): void {
  if (!actualMerchantId || actualMerchantId !== expectedMerchantId) {
    throw new StoreDomainError(
      'VALIDATION_ERROR',
      `Tenant mismatch for ${subject}.`,
      403,
    )
  }
}
