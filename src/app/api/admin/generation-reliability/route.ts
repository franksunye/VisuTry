import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/api-auth'
import { queryGenerationReliabilityReport } from '@/lib/generation/query-reliability-report'
import { formatGenerationReliabilityReport } from '@/lib/generation/reliability-report'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response

  const { searchParams } = new URL(request.url)
  const format = searchParams.get('format')

  try {
    const report = await queryGenerationReliabilityReport({
      period: searchParams.get('period'),
      from: searchParams.get('from'),
      to: searchParams.get('to'),
    })

    if (format === 'text') {
      return new NextResponse(formatGenerationReliabilityReport(report), {
        status: 200,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      })
    }

    return NextResponse.json({ success: true, data: report })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to build reliability report' },
      { status: 400 },
    )
  }
}
