import { NextRequest, NextResponse } from 'next/server'
import {
  authenticateMerchantAgentCredential,
  getMerchantProfile,
  InvalidAgentCredentialError,
} from '@/modules/merchant'
import { merchantAgentErrorResponse } from '@/modules/merchant/application/merchant-agent-http'

export const dynamic = 'force-dynamic'

function bearerToken(request: NextRequest): string {
  const authorization = request.headers.get('authorization')
  if (!authorization?.startsWith('Bearer ')) throw new InvalidAgentCredentialError()
  return authorization.slice('Bearer '.length).trim()
}

export async function GET(request: NextRequest) {
  try {
    const actor = await authenticateMerchantAgentCredential(bearerToken(request))
    const profile = await getMerchantProfile({ actor })
    return NextResponse.json({ success: true, data: profile })
  } catch (error) {
    return merchantAgentErrorResponse(error)
  }
}
