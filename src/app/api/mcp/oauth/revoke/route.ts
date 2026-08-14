import { NextRequest, NextResponse } from 'next/server'
import { revokeMcpOAuthToken } from '@/modules/merchant'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const form = await request.formData()
  const token = String(form.get('token') || '')
  if (token) await revokeMcpOAuthToken(token)
  return new NextResponse(null, { status: 200, headers: { 'Cache-Control': 'no-store' } })
}
