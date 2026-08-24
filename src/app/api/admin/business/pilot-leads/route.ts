import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/api-auth'
import { businessPilotLeadErrorResponse, listBusinessPilotLeads } from '@/modules/business'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin()
    if (!auth.ok) return auth.response
    const leads = await listBusinessPilotLeads(request.nextUrl.searchParams.get('status') || undefined)
    return NextResponse.json({ success: true, data: { leads } })
  } catch (error) {
    const response = businessPilotLeadErrorResponse(error)
    return NextResponse.json(response.body, { status: response.status })
  }
}
