export type ReliabilityPeriodPreset = '24h' | '7d' | '14d'

export type ReliabilityPeriodInput = {
  period?: ReliabilityPeriodPreset | string | null
  from?: string | Date | null
  to?: string | Date | null
  now?: Date
}

export type ReliabilityPeriod = {
  preset: ReliabilityPeriodPreset | 'custom'
  from: Date
  to: Date
}

const PRESET_MS: Record<ReliabilityPeriodPreset, number> = {
  '24h': 24 * 60 * 60 * 1000,
  '7d': 7 * 24 * 60 * 60 * 1000,
  '14d': 14 * 24 * 60 * 60 * 1000,
}

export function resolveReliabilityPeriod(input: ReliabilityPeriodInput = {}): ReliabilityPeriod {
  const now = input.now ?? new Date()
  if (input.from || input.to) {
    const to = input.to ? new Date(input.to) : now
    const from = input.from ? new Date(input.from) : new Date(to.getTime() - PRESET_MS['7d'])
    if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || from >= to) {
      throw new Error('Invalid reliability report date range')
    }
    return { preset: 'custom', from, to }
  }

  const preset: ReliabilityPeriodPreset =
    input.period === '24h' || input.period === '7d' || input.period === '14d' ? input.period : '7d'
  return {
    preset,
    from: new Date(now.getTime() - PRESET_MS[preset]),
    to: now,
  }
}

/**
 * PostgreSQL percentile_cont continuous interpolation.
 * `values` must already be sorted ascending and contain only finite numbers.
 */
export function percentileCont(sortedValues: number[], p: number): number | null {
  if (sortedValues.length === 0) return null
  if (sortedValues.length === 1) return sortedValues[0]
  const rank = (sortedValues.length - 1) * p
  const low = Math.floor(rank)
  const high = Math.ceil(rank)
  if (low === high) return sortedValues[low]
  const weight = rank - low
  return sortedValues[low] * (1 - weight) + sortedValues[high] * weight
}

export function roundMetric(value: number | null, digits = 4): number | null {
  if (value == null || Number.isNaN(value)) return null
  const factor = 10 ** digits
  return Math.round(value * factor) / factor
}

export type ReliabilityRequestRow = {
  id: string
  origin: string
  requestedProvider: string | null
  requestedModel: string | null
  finalStatus: string
  endToEndDurationMs: number | null
  attemptCount: number
  finalErrorCode: string | null
  failureStage: string | null
  attempts: Array<{
    attemptNumber: number
    provider: string
    model: string
    status: string
    isTimeout: boolean
    submitDurationMs: number | null
    attemptDurationMs: number | null
    providerDurationMs: number | null
    errorCode: string | null
    failureStage: string | null
  }>
}

export type ReliabilityBreakdownRow = {
  key: string
  requests: number
  attempts: number
  finalSuccess: number
  firstAttemptSuccess: number
  failures: number
  timeouts: number
}

export type GenerationReliabilityReport = {
  period: {
    preset: ReliabilityPeriod['preset']
    from: string
    to: string
  }
  requests: number
  attempts: number
  inFlight: number
  terminalRequests: number
  firstAttemptSuccess: number | null
  finalSuccess: number | null
  failure: number | null
  timeout: number | null
  retryRate: number | null
  retryRecovery: number | null
  p50: number | null
  p90: number | null
  p95: number | null
  p99: number | null
  attemptP50: number | null
  attemptP90: number | null
  attemptP95: number | null
  attemptP99: number | null
  submitP50: number | null
  submitP90: number | null
  submitP95: number | null
  submitP99: number | null
  latencyFields: {
    requestEndToEnd: 'endToEndDurationMs'
    providerProcessing: 'providerDurationMs'
    submitApi: 'submitDurationMs'
  }
  breakdowns: {
    provider: ReliabilityBreakdownRow[]
    model: ReliabilityBreakdownRow[]
    origin: ReliabilityBreakdownRow[]
    error: ReliabilityBreakdownRow[]
    failureStage: ReliabilityBreakdownRow[]
  }
}

function rate(numerator: number, denominator: number): number | null {
  if (denominator <= 0) return null
  return roundMetric(numerator / denominator)
}

function addBreakdown(
  map: Map<string, ReliabilityBreakdownRow>,
  key: string,
  fields: Partial<ReliabilityBreakdownRow>,
) {
  const current = map.get(key) ?? {
    key,
    requests: 0,
    attempts: 0,
    finalSuccess: 0,
    firstAttemptSuccess: 0,
    failures: 0,
    timeouts: 0,
  }
  map.set(key, {
    key,
    requests: current.requests + (fields.requests ?? 0),
    attempts: current.attempts + (fields.attempts ?? 0),
    finalSuccess: current.finalSuccess + (fields.finalSuccess ?? 0),
    firstAttemptSuccess: current.firstAttemptSuccess + (fields.firstAttemptSuccess ?? 0),
    failures: current.failures + (fields.failures ?? 0),
    timeouts: current.timeouts + (fields.timeouts ?? 0),
  })
}

export function buildGenerationReliabilityReport(
  rows: ReliabilityRequestRow[],
  period: ReliabilityPeriod,
): GenerationReliabilityReport {
  const terminal = rows.filter((row) => row.finalStatus === 'COMPLETED' || row.finalStatus === 'FAILED')
  const inFlight = rows.filter((row) => row.finalStatus === 'STARTED').length
  const completedRequests = terminal.filter((row) => row.finalStatus === 'COMPLETED').length
  const failedRequests = terminal.filter((row) => row.finalStatus === 'FAILED').length
  const firstAttemptSuccesses = terminal.filter((row) =>
    row.attempts.some((attempt) => attempt.attemptNumber === 1 && attempt.status === 'COMPLETED'),
  ).length
  const timeoutRequests = terminal.filter((row) => row.attempts.some((attempt) => attempt.isTimeout)).length
  const retried = terminal.filter((row) => row.attemptCount > 1)
  const retriedRecovered = retried.filter((row) => row.finalStatus === 'COMPLETED').length

  const TERMINAL_ATTEMPT_STATUSES = new Set(['COMPLETED', 'FAILED', 'TIMEOUT'])

  const requestDurations = terminal
    .map((row) => row.endToEndDurationMs)
    .filter((value): value is number => typeof value === 'number' && Number.isFinite(value) && value >= 0)
    .sort((a, b) => a - b)

  const terminalAttempts = rows.flatMap((row) => row.attempts).filter((attempt) => TERMINAL_ATTEMPT_STATUSES.has(attempt.status))

  const attemptDurations = terminalAttempts
    .map((attempt) => attempt.providerDurationMs)
    .filter((value): value is number => typeof value === 'number' && Number.isFinite(value) && value >= 0)
    .sort((a, b) => a - b)

  const submitDurations = terminalAttempts
    .map((attempt) => attempt.submitDurationMs)
    .filter((value): value is number => typeof value === 'number' && Number.isFinite(value) && value >= 0)
    .sort((a, b) => a - b)

  const attempts = rows.reduce((sum, row) => sum + row.attempts.length, 0)

  const byProvider = new Map<string, ReliabilityBreakdownRow>()
  const byModel = new Map<string, ReliabilityBreakdownRow>()
  const byOrigin = new Map<string, ReliabilityBreakdownRow>()
  const byError = new Map<string, ReliabilityBreakdownRow>()
  const byFailureStage = new Map<string, ReliabilityBreakdownRow>()

  for (const row of rows) {
    const isTerminal = row.finalStatus === 'COMPLETED' || row.finalStatus === 'FAILED'
    const firstAttemptOk = row.attempts.some((attempt) => attempt.attemptNumber === 1 && attempt.status === 'COMPLETED')
    const hadTimeout = row.attempts.some((attempt) => attempt.isTimeout)
    const providerKey = row.requestedProvider || 'unknown'
    const modelKey = row.requestedModel || 'unknown'
    const originKey = row.origin || 'unknown'

    addBreakdown(byProvider, providerKey, {
      requests: 1,
      attempts: row.attempts.length,
      finalSuccess: row.finalStatus === 'COMPLETED' ? 1 : 0,
      firstAttemptSuccess: firstAttemptOk ? 1 : 0,
      failures: row.finalStatus === 'FAILED' ? 1 : 0,
      timeouts: hadTimeout ? 1 : 0,
    })
    addBreakdown(byModel, modelKey, {
      requests: 1,
      attempts: row.attempts.length,
      finalSuccess: row.finalStatus === 'COMPLETED' ? 1 : 0,
      firstAttemptSuccess: firstAttemptOk ? 1 : 0,
      failures: row.finalStatus === 'FAILED' ? 1 : 0,
      timeouts: hadTimeout ? 1 : 0,
    })
    addBreakdown(byOrigin, originKey, {
      requests: 1,
      attempts: row.attempts.length,
      finalSuccess: row.finalStatus === 'COMPLETED' ? 1 : 0,
      firstAttemptSuccess: firstAttemptOk ? 1 : 0,
      failures: row.finalStatus === 'FAILED' ? 1 : 0,
      timeouts: hadTimeout ? 1 : 0,
    })

    if (isTerminal && row.finalStatus === 'FAILED') {
      addBreakdown(byError, row.finalErrorCode || 'UNKNOWN', {
        requests: 1,
        attempts: row.attempts.length,
        failures: 1,
        timeouts: hadTimeout ? 1 : 0,
      })
      addBreakdown(byFailureStage, row.failureStage || 'UNKNOWN', {
        requests: 1,
        attempts: row.attempts.length,
        failures: 1,
        timeouts: hadTimeout ? 1 : 0,
      })
    }
  }

  const sortBreakdown = (rows: ReliabilityBreakdownRow[]) =>
    [...rows].sort((a, b) => b.requests - a.requests || a.key.localeCompare(b.key))

  return {
    period: {
      preset: period.preset,
      from: period.from.toISOString(),
      to: period.to.toISOString(),
    },
    requests: rows.length,
    attempts,
    inFlight,
    terminalRequests: terminal.length,
    firstAttemptSuccess: rate(firstAttemptSuccesses, terminal.length),
    finalSuccess: rate(completedRequests, terminal.length),
    failure: rate(failedRequests, terminal.length),
    timeout: rate(timeoutRequests, terminal.length),
    retryRate: rate(retried.length, terminal.length),
    retryRecovery: rate(retriedRecovered, retried.length),
    p50: percentileCont(requestDurations, 0.5),
    p90: percentileCont(requestDurations, 0.9),
    p95: percentileCont(requestDurations, 0.95),
    p99: percentileCont(requestDurations, 0.99),
    attemptP50: percentileCont(attemptDurations, 0.5),
    attemptP90: percentileCont(attemptDurations, 0.9),
    attemptP95: percentileCont(attemptDurations, 0.95),
    attemptP99: percentileCont(attemptDurations, 0.99),
    submitP50: percentileCont(submitDurations, 0.5),
    submitP90: percentileCont(submitDurations, 0.9),
    submitP95: percentileCont(submitDurations, 0.95),
    submitP99: percentileCont(submitDurations, 0.99),
    latencyFields: {
      requestEndToEnd: 'endToEndDurationMs',
      providerProcessing: 'providerDurationMs',
      submitApi: 'submitDurationMs',
    },
    breakdowns: {
      provider: sortBreakdown([...byProvider.values()]),
      model: sortBreakdown([...byModel.values()]),
      origin: sortBreakdown([...byOrigin.values()]),
      error: sortBreakdown([...byError.values()]),
      failureStage: sortBreakdown([...byFailureStage.values()]),
    },
  }
}

export function formatGenerationReliabilityReport(report: GenerationReliabilityReport): string {
  const pct = (value: number | null) => (value == null ? 'n/a' : `${(value * 100).toFixed(1)}%`)
  const ms = (value: number | null) => (value == null ? 'n/a' : `${Math.round(value)}ms`)
  const lines = [
    `Period: ${report.period.preset} (${report.period.from} → ${report.period.to})`,
    `Requests: ${report.requests}`,
    `Attempts: ${report.attempts}`,
    `In-flight: ${report.inFlight}`,
    `First-attempt success: ${pct(report.firstAttemptSuccess)}`,
    `Final success: ${pct(report.finalSuccess)}`,
    `Failure: ${pct(report.failure)}`,
    `Timeout: ${pct(report.timeout)}`,
    `Retry rate: ${pct(report.retryRate)}`,
    `Retry recovery: ${pct(report.retryRecovery)}`,
    `P50 (request e2e / endToEndDurationMs): ${ms(report.p50)}`,
    `P90 (request e2e): ${ms(report.p90)}`,
    `P95 (request e2e): ${ms(report.p95)}`,
    `P99 (request e2e): ${ms(report.p99)}`,
    `Attempt P50 (provider processing / providerDurationMs): ${ms(report.attemptP50)}`,
    `Attempt P90: ${ms(report.attemptP90)}`,
    `Attempt P95: ${ms(report.attemptP95)}`,
    `Attempt P99: ${ms(report.attemptP99)}`,
    `Submit P50 (submit/API / submitDurationMs): ${ms(report.submitP50)}`,
    `Submit P90: ${ms(report.submitP90)}`,
    `Submit P95: ${ms(report.submitP95)}`,
    `Submit P99: ${ms(report.submitP99)}`,
    '',
    'Breakdown by provider:',
    ...report.breakdowns.provider.map((row) => `  ${row.key}: requests=${row.requests} finalSuccess=${row.finalSuccess} firstAttemptSuccess=${row.firstAttemptSuccess} failures=${row.failures}`),
    'Breakdown by model:',
    ...report.breakdowns.model.map((row) => `  ${row.key}: requests=${row.requests} finalSuccess=${row.finalSuccess}`),
    'Breakdown by origin:',
    ...report.breakdowns.origin.map((row) => `  ${row.key}: requests=${row.requests} finalSuccess=${row.finalSuccess}`),
    'Breakdown by normalized error:',
    ...report.breakdowns.error.map((row) => `  ${row.key}: requests=${row.requests} timeouts=${row.timeouts}`),
    'Breakdown by failure stage:',
    ...report.breakdowns.failureStage.map((row) => `  ${row.key}: requests=${row.requests} timeouts=${row.timeouts}`),
  ]
  return lines.join('\n')
}
