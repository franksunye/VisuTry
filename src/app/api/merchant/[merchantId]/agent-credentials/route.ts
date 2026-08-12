import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api-auth'
import {
  createMerchantAgentCredential,
  listMerchantAgentCredentials,
} from '@/modules/merchant'
import { merchantAgentErrorResponse } from '@/modules/merchant/application/merchant-agent-http'

export const dynamic = 'force-dynamic'

export async function GET(
  _request: NextRequest,
  { params }: { params: { merchantId: string } },
) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.response

  try {
    const credentials = await listMerchantAgentCredentials({
      userId: auth.userId,
      merchantId: params.merchantId,
    })
    return NextResponse.json({ success: true, data: { credentials } })
  } catch (error) {
    return merchantAgentErrorResponse(error)
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { merchantId: string } },
) {
  const auth = await requireAuth()
  if (!auth.ok) return auth.response

  try {
    const body = await request.json() as { name?: unknown; scopes?: unknown }
    if (typeof body.name !== 'string') {
      return NextResponse.json({ success: false, error: 'INVALID_REQUEST' }, { status: 400 })
    }
    if (body.scopes !== undefined && body.scopes !== null && (!Array.isArray(body.scopes) || body.scopes.some((scope) => typeof scope !== 'string'))) {
      return NextResponse.json({ success: false, error: 'INVALID_REQUEST' }, { status: 400 })
    }

    const created = await createMerchantAgentCredential({
      userId: auth.userId,
      merchantId: params.merchantId,
      name: body.name,
      scopes: body.scopes as string[] | null | undefined,
    })
    return NextResponse.json({ success: true, data: created }, { status: 201 })
  } catch (error) {
    return merchantAgentErrorResponse(error)
  }
}
