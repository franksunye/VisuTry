import { NextRequest, NextResponse } from 'next/server'
import { assertBusinessLeadOrigin, businessLeadIdentity, businessPilotLeadErrorResponse, createBusinessPilotLead } from '@/modules/business'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    assertBusinessLeadOrigin(request.headers)
    if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) {
      return NextResponse.json({ success: false, error: 'UNSUPPORTED_MEDIA_TYPE' }, { status: 415 })
    }
    const contentLength = Number(request.headers.get('content-length') || '0')
    if (Number.isFinite(contentLength) && contentLength > 32_768) {
      return NextResponse.json({ success: false, error: 'PAYLOAD_TOO_LARGE' }, { status: 413 })
    }
    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ success: false, error: 'INVALID_JSON' }, { status: 400 })
    }
    const result = await createBusinessPilotLead(body, businessLeadIdentity(request.headers))
    const duplicate = 'duplicate' in result && result.duplicate === true
    return NextResponse.json({ success: true, data: { requestId: result.requestId } }, { status: duplicate ? 200 : 201 })
  } catch (error) {
    const response = businessPilotLeadErrorResponse(error)
    const headers = response.retryAfterSeconds ? { 'Retry-After': String(response.retryAfterSeconds) } : undefined
    return NextResponse.json(response.body, { status: response.status, headers })
  }
}
