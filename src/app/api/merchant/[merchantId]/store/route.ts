import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuth } from '@/lib/api-auth-runtime'
import { requireMerchantMembership } from '@/modules/merchant/application/merchant-access-cloudflare'
import {
  createMerchantStore,
  getMerchantStoreWorkspace,
  setMerchantStoreFrames,
  updateMerchantStore,
} from '@/modules/merchant/application/merchant-onboarding-cloudflare'
import { storeErrorResponse } from './store-http'

export const dynamic = 'force-dynamic'

const storeDetailsSchema = z.object({
  name: z.string().trim().max(120).optional(),
  headline: z.string().trim().max(240).nullable().optional(),
  description: z.string().trim().max(5000).nullable().optional(),
}).strict()

const storeUpdateSchema = storeDetailsSchema.extend({ storeId: z.string().trim().min(1).max(200) }).strict()
const frameSelectionSchema = z.object({
  storeId: z.string().trim().min(1).max(200),
  frameIds: z.array(z.string().trim().min(1).max(200)).max(1000),
}).strict()

function actorFor(userId: string, merchantId: string, membershipId: string) {
  return { actorType: 'HUMAN' as const, actorId: userId, merchantId, membershipId }
}

async function merchantActor(authUserId: string, merchantId: string) {
  const membership = await requireMerchantMembership({ userId: authUserId, merchantId, roles: ['OWNER', 'ADMIN'] })
  return actorFor(authUserId, merchantId, membership.membershipId)
}

export async function GET(_request: NextRequest, { params }: { params: { merchantId: string } }) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.response
  try {
    const actor = await merchantActor(auth.userId, params.merchantId)
    const data = await getMerchantStoreWorkspace({ actor })
    return NextResponse.json({ success: true, data })
  } catch (error) {
    return storeErrorResponse(error)
  }
}

export async function POST(request: NextRequest, { params }: { params: { merchantId: string } }) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.response
  try {
    const actor = await merchantActor(auth.userId, params.merchantId)
    let body: unknown
    try { body = await request.json() } catch { return NextResponse.json({ success: false, error: 'INVALID_REQUEST' }, { status: 400 }) }
    const parsed = storeDetailsSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ success: false, error: 'INVALID_REQUEST' }, { status: 400 })
    const data = await createMerchantStore({ actor, name: parsed.data.name, headline: parsed.data.headline ?? undefined, description: parsed.data.description ?? undefined })
    return NextResponse.json({ success: true, data })
  } catch (error) {
    return storeErrorResponse(error)
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { merchantId: string } }) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.response
  try {
    const actor = await merchantActor(auth.userId, params.merchantId)
    let body: unknown
    try { body = await request.json() } catch { return NextResponse.json({ success: false, error: 'INVALID_REQUEST' }, { status: 400 }) }
    const parsed = storeUpdateSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ success: false, error: 'INVALID_REQUEST' }, { status: 400 })
    const data = await updateMerchantStore({ actor, ...parsed.data })
    return NextResponse.json({ success: true, data })
  } catch (error) {
    return storeErrorResponse(error)
  }
}

export async function PUT(request: NextRequest, { params }: { params: { merchantId: string } }) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.response
  try {
    const actor = await merchantActor(auth.userId, params.merchantId)
    let body: unknown
    try { body = await request.json() } catch { return NextResponse.json({ success: false, error: 'INVALID_REQUEST' }, { status: 400 }) }
    const parsed = frameSelectionSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ success: false, error: 'INVALID_REQUEST' }, { status: 400 })
    const data = await setMerchantStoreFrames({ actor, ...parsed.data })
    return NextResponse.json({ success: true, data })
  } catch (error) {
    return storeErrorResponse(error)
  }
}
