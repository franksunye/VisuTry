import { NextResponse } from 'next/server'
import { z } from 'zod'
import { MerchantAccessError } from '@/modules/merchant/application/merchant-access-cloudflare'
import { MerchantOnboardingError, type CatalogFrameInput } from '@/modules/merchant/application/merchant-onboarding-cloudflare'
import { MerchantSourceIntakeError } from '@/modules/merchant/application/merchant-catalog-source-shared'

export const catalogFrameInputSchema = z.object({
  sku: z.string().trim().max(120).nullable().optional(),
  name: z.string().trim().min(1).max(240),
  brand: z.string().max(120).nullable().optional(),
  variant: z.string().max(120).nullable().optional(),
  imageUrl: z.string().max(2000).nullable().optional(),
  productUrl: z.string().max(2000).nullable().optional(),
  price: z.number().int().nonnegative().nullable().optional(),
  currency: z.string().max(8).nullable().optional(),
  shape: z.string().trim().max(80).nullable().optional(),
  material: z.string().max(120).nullable().optional(),
  color: z.string().max(120).nullable().optional(),
  widthClass: z.string().max(80).nullable().optional(),
  styleTags: z.array(z.string().max(80)).max(20).optional(),
  collectionTags: z.array(z.string().max(80)).max(20).optional(),
  source: z.enum(['MANUAL', 'CSV', 'EXTERNAL']).optional(),
  externalId: z.string().max(2000).nullable().optional(),
  sourceNotes: z.string().max(2000).nullable().optional(),
  enrichmentStatus: z.enum(['NOT_REQUIRED', 'PENDING', 'REVIEW_REQUIRED', 'APPROVED']).optional(),
}).strict()

export function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}

export function catalogErrorResponse(error: unknown): NextResponse {
  if (error instanceof MerchantAccessError) return NextResponse.json({ success: false, error: error.code }, { status: error.httpStatus })
  if (error instanceof MerchantOnboardingError || error instanceof MerchantSourceIntakeError) {
    return NextResponse.json({ success: false, error: error.code, message: error.message }, { status: error.httpStatus })
  }
  console.error('Merchant catalog request failed:', error)
  return NextResponse.json({ success: false, error: 'INTERNAL_ERROR' }, { status: 500 })
}

export function parseFrameInputs(value: unknown, max: number): CatalogFrameInput[] | null {
  const parsed = z.array(catalogFrameInputSchema).min(1).max(max).safeParse(value)
  return parsed.success ? parsed.data : null
}
