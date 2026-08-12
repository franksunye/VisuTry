import { NextResponse } from 'next/server'
import { MERCHANT_ONBOARDING_SKILL } from '@/lib/merchant-onboarding-skill'

export const dynamic = 'force-static'

export async function GET() {
  return new NextResponse(MERCHANT_ONBOARDING_SKILL, {
    status: 200,
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
    },
  })
}
