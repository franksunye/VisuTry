import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/api-auth'
import { businessPilotLeadErrorResponse, updateBusinessPilotLead } from '@/modules/business'

export const dynamic = 'force-dynamic'

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    const auth = await requireAdmin()
    if (!auth.ok) return auth.response
    const { id } = await params
    const lead = await updateBusinessPilotLead(id, await request.json())
    return NextResponse.json({ success: true, data: { lead } })
  } catch (error) {
    const response = businessPilotLeadErrorResponse(error)
    return NextResponse.json(response.body, { status: response.status })
  }
}
