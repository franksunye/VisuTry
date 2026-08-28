import { prisma } from '@/lib/prisma'
import {
  buildGenerationReliabilityReport,
  resolveReliabilityPeriod,
  type GenerationReliabilityReport,
  type ReliabilityPeriodInput,
  type ReliabilityRequestRow,
} from '@/lib/generation/reliability-report'

export type ReliabilityQueryInput = ReliabilityPeriodInput & {
  /** When false (default), exclude isTest=true QA/reference rows from baseline. */
  includeTest?: boolean | string | null
  environment?: string | null
}

function parseBooleanFlag(value: boolean | string | null | undefined): boolean {
  if (value === true) return true
  if (typeof value === 'string') return value === '1' || value.toLowerCase() === 'true'
  return false
}

export async function queryGenerationReliabilityReport(
  input: ReliabilityQueryInput = {},
): Promise<GenerationReliabilityReport> {
  const period = resolveReliabilityPeriod(input)
  const includeTest = parseBooleanFlag(input.includeTest)
  const environment = input.environment?.trim() || null

  const rows = await prisma.generationRequest.findMany({
    where: {
      startedAt: {
        gte: period.from,
        lt: period.to,
      },
      ...(includeTest ? {} : { isTest: false }),
      ...(environment ? { environment } : {}),
    },
    select: {
      id: true,
      origin: true,
      requestedProvider: true,
      requestedModel: true,
      finalStatus: true,
      endToEndDurationMs: true,
      attemptCount: true,
      finalErrorCode: true,
      failureStage: true,
      attempts: {
        select: {
          attemptNumber: true,
          provider: true,
          model: true,
          status: true,
          isTimeout: true,
          submitDurationMs: true,
          attemptDurationMs: true,
          providerDurationMs: true,
          errorCode: true,
          failureStage: true,
        },
        orderBy: { attemptNumber: 'asc' },
      },
    },
    orderBy: { startedAt: 'asc' },
  })

  const normalized: ReliabilityRequestRow[] = rows.map((row) => ({
    id: row.id,
    origin: String(row.origin),
    requestedProvider: row.requestedProvider,
    requestedModel: row.requestedModel,
    finalStatus: String(row.finalStatus),
    endToEndDurationMs: row.endToEndDurationMs,
    attemptCount: row.attemptCount,
    finalErrorCode: row.finalErrorCode ? String(row.finalErrorCode) : null,
    failureStage: row.failureStage ? String(row.failureStage) : null,
    attempts: row.attempts.map((attempt) => ({
      attemptNumber: attempt.attemptNumber,
      provider: attempt.provider,
      model: attempt.model,
      status: String(attempt.status),
      isTimeout: attempt.isTimeout,
      submitDurationMs: attempt.submitDurationMs,
      attemptDurationMs: attempt.attemptDurationMs,
      providerDurationMs: attempt.providerDurationMs,
      errorCode: attempt.errorCode ? String(attempt.errorCode) : null,
      failureStage: attempt.failureStage ? String(attempt.failureStage) : null,
    })),
  }))

  return buildGenerationReliabilityReport(normalized, period)
}
