import Link from 'next/link'
import { queryGenerationReliabilityReport } from '@/lib/generation/query-reliability-report'
import type { ReliabilityPeriodPreset } from '@/lib/generation/reliability-report'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export const dynamic = 'force-dynamic'

const PERIODS: Array<{ id: ReliabilityPeriodPreset; label: string }> = [
  { id: '24h', label: 'Last 24 hours' },
  { id: '7d', label: 'Last 7 days' },
  { id: '14d', label: 'Last 14 days' },
]

function pct(value: number | null) {
  if (value == null) return 'n/a'
  return `${(value * 100).toFixed(1)}%`
}

function ms(value: number | null) {
  if (value == null) return 'n/a'
  return `${Math.round(value)}ms`
}

export default async function GenerationReliabilityPage({
  searchParams,
}: {
  searchParams?: { period?: string; from?: string; to?: string; includeTest?: string; environment?: string }
}) {
  const period = searchParams?.period
  const report = await queryGenerationReliabilityReport({
    period,
    from: searchParams?.from,
    to: searchParams?.to,
    includeTest: searchParams?.includeTest,
    environment: searchParams?.environment,
  })

  const selected = report.period.preset

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Try-On generation reliability</h1>
        <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
          Phase 1 measurement only. These figures are not an SLO. Baseline starts after this
          instrumentation is deployed and validated in production. QA/reference (`isTest`)
          rows are excluded unless you open this page with `includeTest=1`.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {PERIODS.map((item) => (
          <Link
            key={item.id}
            href={`/admin/generation-reliability?period=${item.id}`}
            className={`rounded-md px-3 py-1.5 text-sm ${
              selected === item.id ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {item.label}
          </Link>
        ))}
      </div>

      <p className="text-xs text-muted-foreground">
        {report.period.from} → {report.period.to}
      </p>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Requests" value={String(report.requests)} hint={`${report.inFlight} in-flight`} />
        <MetricCard title="Final success" value={pct(report.finalSuccess)} hint={`${report.terminalRequests} terminal`} />
        <MetricCard title="First-attempt success" value={pct(report.firstAttemptSuccess)} />
        <MetricCard title="Failure" value={pct(report.failure)} />
        <MetricCard title="Timeout" value={pct(report.timeout)} />
        <MetricCard title="P50 request e2e" value={ms(report.p50)} hint={`P95 ${ms(report.p95)} · P99 ${ms(report.p99)}`} />
        <MetricCard title="Attempts" value={String(report.attempts)} hint={`retry ${pct(report.retryRate)}`} />
        <MetricCard title="Retry recovery" value={pct(report.retryRecovery)} />
        <MetricCard title="Provider P50" value={ms(report.attemptP50)} hint="providerDurationMs" />
        <MetricCard title="Submit P50" value={ms(report.submitP50)} hint="submitDurationMs" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <BreakdownTable title="Provider" rows={report.breakdowns.provider} />
        <BreakdownTable title="Model" rows={report.breakdowns.model} />
        <BreakdownTable title="Origin" rows={report.breakdowns.origin} />
        <BreakdownTable title="Normalized failure reasons" rows={report.breakdowns.error} empty="No terminal failures in this period." />
        <BreakdownTable title="Failure stage" rows={report.breakdowns.failureStage} empty="No terminal failures in this period." />
      </div>
    </div>
  )
}

function MetricCard({ title, value, hint }: { title: string; value: string; hint?: string }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription>{title}</CardDescription>
        <CardTitle className="text-2xl">{value}</CardTitle>
      </CardHeader>
      {hint ? <CardContent className="pt-0 text-xs text-muted-foreground">{hint}</CardContent> : null}
    </Card>
  )
}

function BreakdownTable({
  title,
  rows,
  empty = 'No rows.',
}: {
  title: string
  rows: Array<{ key: string; requests: number; finalSuccess: number; firstAttemptSuccess: number; failures: number }>
  empty?: string
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">{empty}</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b text-muted-foreground">
                <th className="py-2 font-medium">Key</th>
                <th className="py-2 font-medium">Requests</th>
                <th className="py-2 font-medium">Final success</th>
                <th className="py-2 font-medium">First-attempt</th>
                <th className="py-2 font-medium">Failures</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.key} className="border-b last:border-0">
                  <td className="py-2">{row.key}</td>
                  <td className="py-2">{row.requests}</td>
                  <td className="py-2">{row.finalSuccess}</td>
                  <td className="py-2">{row.firstAttemptSuccess}</td>
                  <td className="py-2">{row.failures}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </CardContent>
    </Card>
  )
}
