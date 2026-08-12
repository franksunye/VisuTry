import { NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { AgentCredentialLimitError, AgentScopeError, InvalidAgentCredentialError } from '../domain/agent-credentials'
import { MerchantAccessError } from './merchant-access'

export function merchantAgentErrorResponse(error: unknown): NextResponse {
  if (error instanceof MerchantAccessError || error instanceof InvalidAgentCredentialError || error instanceof AgentScopeError || error instanceof AgentCredentialLimitError) {
    return NextResponse.json(
      { success: false, error: error.code },
      { status: error.httpStatus },
    )
  }

  if (error instanceof Error && /^(Credential name|Invalid agent scope)/u.test(error.message)) {
    return NextResponse.json({ success: false, error: 'INVALID_REQUEST' }, { status: 400 })
  }

  logger.error('api', 'Unhandled merchant agent API error', error instanceof Error ? error : new Error(String(error)))
  return NextResponse.json({ success: false, error: 'INTERNAL_ERROR' }, { status: 500 })
}
