import { prisma } from '@/lib/prisma'
import {
  buildGenerationReliabilityReport,
  resolveReliabilityPeriod,
  type GenerationReliabilityReport,
  type ReliabilityPeriodInput,
  type ReliabilityRequestRow,
} from '@/lib/generation/reliability-report'

export async function queryGenerationReliabilityReport(
  input: ReliabilityPeriodInput = {},
): Promise<GenerationReliabilityReport> {
  const period = resolveReliabilityPeriod(input)
  const rows = await prisma.generationRequest.findMany({
    where: {
      startedAt: {
        gte: period.from,
        lt: period.to,
      },
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
      attempts: {
        select: {
          attemptNumber: true,
          provider: true,
          model: true,
          status: true,
          isTimeout: true,
          providerDurationMs: true,
          errorCode: true,
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
    attempts: row.attempts.map((attempt) => ({
      attemptNumber: attempt.attemptNumber,
      provider: attempt.provider,
      model: attempt.model,
      status: String(attempt.status),
      isTimeout: attempt.isTimeout,
      providerDurationMs: attempt.providerDurationMs,
      errorCode: attempt.errorCode ? String(attempt.errorCode) : null,
    })),
  }))

  return buildGenerationReliabilityReport(normalized, period)
}
