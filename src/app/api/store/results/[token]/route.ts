import { NextRequest, NextResponse } from 'next/server'
import { getDecisionResultView } from '@/modules/store/application'

export const dynamic = 'force-dynamic'

export async function GET(
  _request: NextRequest,
  { params }: { params: { token: string } },
) {
  const result = await getDecisionResultView(params.token)
  if (!result) return NextResponse.json({ success: false, error: 'Decision Result unavailable.' }, { status: 404 })
  return NextResponse.json({ success: true, data: result }, { headers: { 'Cache-Control': 'private, no-store' } })
}
