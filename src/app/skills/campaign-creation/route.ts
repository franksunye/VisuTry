import { NextResponse } from 'next/server'
import { CAMPAIGN_CREATION_SKILL } from '@/lib/campaign-creation-skill'

export const dynamic = 'force-static'

export async function GET() {
  return new NextResponse(CAMPAIGN_CREATION_SKILL, {
    status: 200,
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
    },
  })
}
