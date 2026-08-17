import { NextResponse } from 'next/server'
import { AgentCredentialLimitError, AgentScopeError, InvalidAgentCredentialError } from '../domain/agent-credentials'
import { MerchantAccessError } from './merchant-access-cloudflare'
import { MerchantProfileError } from '@/modules/merchant/cloudflare'

export function merchantAgentErrorResponse(error: unknown): NextResponse {
  if (error instanceof MerchantAccessError || error instanceof InvalidAgentCredentialError || error instanceof AgentScopeError || error instanceof AgentCredentialLimitError || error instanceof MerchantProfileError) {
    const status = error instanceof MerchantProfileError ? 400 : error.httpStatus
    return NextResponse.json({ success: false, error: error.code }, { status })
  }
  if (error instanceof Error && /^(Credential name|Invalid agent scope)/u.test(error.message)) {
    return NextResponse.json({ success: false, error: 'INVALID_REQUEST' }, { status: 400 })
  }
  return NextResponse.json({ success: false, error: 'INTERNAL_ERROR' }, { status: 500 })
}
