import { NextResponse } from 'next/server'
import { COMMERCE_ANALYST_SKILL } from '@/lib/commerce-analyst-skill'

export const dynamic = 'force-static'

export async function GET() {
  return new NextResponse(COMMERCE_ANALYST_SKILL, {
    status: 200,
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
    },
  })
}
