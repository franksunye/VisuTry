import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createStoreRuntime, recordMerchantHandoff, storeErrorResponse } from '@/modules/store/application'
import { storeApiError } from '@/modules/store/contracts'
import { MERCHANT_HANDOFF_ACTIONS } from '@/modules/store/domain/merchant-handoff'

export const dynamic = 'force-dynamic'

const requestSchema = z.object({
  merchantSlug: z.string().trim().min(1).max(160),
  experienceSlug: z.string().trim().min(1).max(160),
  experienceType: z.enum(['STORE', 'CAMPAIGN']),
  action: z.enum(MERCHANT_HANDOFF_ACTIONS),
  surface: z.enum(['DISCOVERY', 'RESULT']),
  clientActionId: z.string().uuid(),
  locale: z.string().trim().max(32).optional(),
  deviceType: z.enum(['mobile', 'tablet', 'desktop']).optional(),
}).strict()

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null)
    const parsed = requestSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(storeApiError('VALIDATION_ERROR', 'Invalid handoff invocation', parsed.error.issues.map((issue) => ({ path: issue.path.join('.'), message: issue.message }))), { status: 400 })
    }
    const runtime = createStoreRuntime()
    const result = await recordMerchantHandoff({
      merchants: runtime.merchants,
      experiences: runtime.experiences,
      events: runtime.events,
      ...parsed.data,
    })
    return NextResponse.json({ success: true, data: { created: result.created } })
  } catch (error) {
    return storeErrorResponse(error)
  }
}
