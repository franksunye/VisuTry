import {
  GenerationAttemptStatus,
  GenerationErrorCode,
  GenerationRequestFinalStatus,
  GenerationTelemetryOrigin,
} from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { classifyGenerationError } from '@/lib/generation/error-taxonomy'
import { compactGenerationLogContext, type GenerationLogContext } from '@/lib/generation/log-context'
import { modelForProvider, type GenerationProviderName } from '@/lib/generation/providers'

const OPEN_ATTEMPT_STATUSES: GenerationAttemptStatus[] = ['STARTED', 'SUBMITTED']

export type GenerationTelemetryOriginName = 'CONSUMER' | 'STORE' | 'CAMPAIGN'

export type StartGenerationRequestInput = {
  tryOnTaskId: string
  origin: GenerationTelemetryOriginName
  userId?: string | null
  merchantId?: string | null
  storeId?: string | null
  campaignId?: string | null
  clientSubmissionId?: string | null
  generationType: string
  provider?: GenerationProviderName | string | null
  model?: string | null
  startedAt?: Date
}

export type StartGenerationAttemptInput = {
  tryOnTaskId: string
  provider: GenerationProviderName | string
  model?: string | null
  startedAt?: Date
}

export type GenerationTelemetryHandle = {
  requestId: string
  tryOnTaskId: string
  attemptId: string | null
  attemptNumber: number
  origin: string
  provider: string | null
  model: string | null
  providerTaskId: string | null
  clientSubmissionId: string | null
  status: string
}

function logTelemetryFailure(action: string, error: unknown, data?: Record<string, unknown>) {
  logger.warn('generation', `Generation telemetry ${action} failed`, {
    ...data,
    error: error instanceof Error ? error.message : String(error),
  })
}

function isUniqueConstraintError(error: unknown) {
  return Boolean(error && typeof error === 'object' && (error as { code?: string }).code === 'P2002')
}

function asOrigin(origin: GenerationTelemetryOriginName): GenerationTelemetryOrigin {
  return origin as GenerationTelemetryOrigin
}

export function generationLogFields(handle?: GenerationTelemetryHandle | null, extra?: GenerationLogContext): Record<string, unknown> {
  if (!handle) return compactGenerationLogContext(extra ?? {})
  return compactGenerationLogContext({
    requestId: handle.requestId,
    attemptId: handle.attemptId,
    providerTaskId: handle.providerTaskId,
    clientSubmissionId: handle.clientSubmissionId,
    origin: handle.origin,
    provider: handle.provider,
    model: handle.model,
    attemptNumber: handle.attemptNumber,
    status: handle.status,
    tryOnTaskId: handle.tryOnTaskId,
    ...extra,
  })
}

export async function startGenerationRequest(
  input: StartGenerationRequestInput,
): Promise<GenerationTelemetryHandle | null> {
  try {
    const existing = await prisma.generationRequest.findUnique({
      where: { tryOnTaskId: input.tryOnTaskId },
      select: {
        id: true,
        tryOnTaskId: true,
        origin: true,
        clientSubmissionId: true,
        requestedProvider: true,
        requestedModel: true,
        finalStatus: true,
        attemptCount: true,
      },
    })
    if (existing) {
      return {
        requestId: existing.id,
        tryOnTaskId: existing.tryOnTaskId,
        attemptId: null,
        attemptNumber: existing.attemptCount,
        origin: existing.origin,
        provider: existing.requestedProvider,
        model: existing.requestedModel,
        providerTaskId: null,
        clientSubmissionId: existing.clientSubmissionId,
        status: existing.finalStatus,
      }
    }

    const startedAt = input.startedAt ?? new Date()
    const requestedProvider = input.provider ?? null
    const requestedModel = input.model ?? (requestedProvider ? modelForProvider(requestedProvider as GenerationProviderName) : null)

    try {
      const request = await prisma.generationRequest.create({
        data: {
          tryOnTaskId: input.tryOnTaskId,
          origin: asOrigin(input.origin),
          userId: input.userId ?? null,
          merchantId: input.merchantId ?? null,
          storeId: input.storeId ?? null,
          campaignId: input.campaignId ?? null,
          clientSubmissionId: input.clientSubmissionId ?? null,
          generationType: input.generationType,
          requestedProvider,
          requestedModel,
          finalStatus: GenerationRequestFinalStatus.STARTED,
          startedAt,
          attemptCount: 0,
        },
        select: {
          id: true,
          tryOnTaskId: true,
          origin: true,
          clientSubmissionId: true,
          requestedProvider: true,
          requestedModel: true,
          finalStatus: true,
          attemptCount: true,
        },
      })

      const handle: GenerationTelemetryHandle = {
        requestId: request.id,
        tryOnTaskId: request.tryOnTaskId,
        attemptId: null,
        attemptNumber: request.attemptCount,
        origin: request.origin,
        provider: request.requestedProvider,
        model: request.requestedModel,
        providerTaskId: null,
        clientSubmissionId: request.clientSubmissionId,
        status: request.finalStatus,
      }

      logger.info('generation', 'REQUEST_STARTED', generationLogFields(handle))
      return handle
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        return startGenerationRequest(input)
      }
      throw error
    }
  } catch (error) {
    logTelemetryFailure('startGenerationRequest', error, { tryOnTaskId: input.tryOnTaskId })
    return null
  }
}

export async function startGenerationAttempt(
  input: StartGenerationAttemptInput,
): Promise<GenerationTelemetryHandle | null> {
  try {
    const request = await prisma.generationRequest.findUnique({
      where: { tryOnTaskId: input.tryOnTaskId },
      select: {
        id: true,
        tryOnTaskId: true,
        origin: true,
        clientSubmissionId: true,
        requestedProvider: true,
        requestedModel: true,
        finalStatus: true,
        attemptCount: true,
      },
    })
    if (!request) return null
    if (request.finalStatus === GenerationRequestFinalStatus.COMPLETED) {
      return {
        requestId: request.id,
        tryOnTaskId: request.tryOnTaskId,
        attemptId: null,
        attemptNumber: request.attemptCount,
        origin: request.origin,
        provider: request.requestedProvider,
        model: request.requestedModel,
        providerTaskId: null,
        clientSubmissionId: request.clientSubmissionId,
        status: request.finalStatus,
      }
    }

    const openAttempt = await prisma.generationAttempt.findFirst({
      where: { requestId: request.id, status: { in: OPEN_ATTEMPT_STATUSES } },
      orderBy: { attemptNumber: 'desc' },
    })
    if (openAttempt) {
      return {
        requestId: request.id,
        tryOnTaskId: request.tryOnTaskId,
        attemptId: openAttempt.id,
        attemptNumber: openAttempt.attemptNumber,
        origin: request.origin,
        provider: openAttempt.provider,
        model: openAttempt.model,
        providerTaskId: openAttempt.providerTaskId,
        clientSubmissionId: request.clientSubmissionId,
        status: openAttempt.status,
      }
    }

    const attemptNumber = request.attemptCount + 1
    const submittedAt = input.startedAt ?? new Date()
    const provider = input.provider
    const model = input.model ?? modelForProvider(provider as GenerationProviderName)

    const attempt = await prisma.generationAttempt.create({
      data: {
        requestId: request.id,
        attemptNumber,
        provider,
        model,
        submittedAt,
        status: GenerationAttemptStatus.STARTED,
      },
    })

    await prisma.generationRequest.updateMany({
      where: { id: request.id, finalStatus: { not: GenerationRequestFinalStatus.COMPLETED } },
      data: { attemptCount: attemptNumber, requestedProvider: provider, requestedModel: model },
    })

    const handle: GenerationTelemetryHandle = {
      requestId: request.id,
      tryOnTaskId: request.tryOnTaskId,
      attemptId: attempt.id,
      attemptNumber: attempt.attemptNumber,
      origin: request.origin,
      provider: attempt.provider,
      model: attempt.model,
      providerTaskId: attempt.providerTaskId,
      clientSubmissionId: request.clientSubmissionId,
      status: attempt.status,
    }

    logger.info('generation', 'ATTEMPT_STARTED', generationLogFields(handle))
    return handle
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return startGenerationAttempt(input)
    }
    logTelemetryFailure('startGenerationAttempt', error, { tryOnTaskId: input.tryOnTaskId })
    return null
  }
}

export async function markGenerationAttemptSubmitted(
  tryOnTaskId: string,
  providerTaskId: string,
  submitDurationMs: number,
): Promise<GenerationTelemetryHandle | null> {
  try {
    const request = await prisma.generationRequest.findUnique({
      where: { tryOnTaskId },
      select: {
        id: true,
        tryOnTaskId: true,
        origin: true,
        clientSubmissionId: true,
        attempts: {
          where: { status: { in: OPEN_ATTEMPT_STATUSES } },
          orderBy: { attemptNumber: 'desc' },
          take: 1,
        },
      },
    })
    const attempt = request?.attempts[0]
    if (!request || !attempt) return null

    await prisma.generationAttempt.updateMany({
      where: { id: attempt.id, status: { in: OPEN_ATTEMPT_STATUSES } },
      data: {
        providerTaskId,
        submitDurationMs,
        status: GenerationAttemptStatus.SUBMITTED,
      },
    })

    const handle: GenerationTelemetryHandle = {
      requestId: request.id,
      tryOnTaskId: request.tryOnTaskId,
      attemptId: attempt.id,
      attemptNumber: attempt.attemptNumber,
      origin: request.origin,
      provider: attempt.provider,
      model: attempt.model,
      providerTaskId,
      clientSubmissionId: request.clientSubmissionId,
      status: GenerationAttemptStatus.SUBMITTED,
    }
    logger.info('generation', 'ATTEMPT_SUBMITTED', generationLogFields(handle, { status: 'SUBMITTED' }))
    return handle
  } catch (error) {
    logTelemetryFailure('markGenerationAttemptSubmitted', error, { tryOnTaskId, providerTaskId })
    return null
  }
}

async function finishOpenAttempt(
  tryOnTaskId: string,
  data: {
    status: GenerationAttemptStatus
    errorCode?: GenerationErrorCode | null
    errorMessageNormalized?: string | null
    isTimeout?: boolean
    completedAt?: Date
  },
): Promise<GenerationTelemetryHandle | null> {
  const request = await prisma.generationRequest.findUnique({
    where: { tryOnTaskId },
    select: {
      id: true,
      tryOnTaskId: true,
      origin: true,
      clientSubmissionId: true,
      startedAt: true,
      attempts: {
        orderBy: { attemptNumber: 'desc' },
        take: 1,
      },
    },
  })
  const attempt = request?.attempts[0]
  if (!request || !attempt) return null

  const completedAt = data.completedAt ?? new Date()
  const providerDurationMs = Math.max(0, completedAt.getTime() - attempt.submittedAt.getTime())

  if (OPEN_ATTEMPT_STATUSES.includes(attempt.status)) {
    await prisma.generationAttempt.updateMany({
      where: { id: attempt.id, status: { in: OPEN_ATTEMPT_STATUSES } },
      data: {
        status: data.status,
        completedAt,
        providerDurationMs,
        errorCode: data.errorCode ?? null,
        errorMessageNormalized: data.errorMessageNormalized ?? null,
        isTimeout: data.isTimeout ?? false,
      },
    })
  }

  return {
    requestId: request.id,
    tryOnTaskId: request.tryOnTaskId,
    attemptId: attempt.id,
    attemptNumber: attempt.attemptNumber,
    origin: request.origin,
    provider: attempt.provider,
    model: attempt.model,
    providerTaskId: attempt.providerTaskId,
    clientSubmissionId: request.clientSubmissionId,
    status: data.status,
  }
}

export async function recordUsableGenerationSuccess(tryOnTaskId: string): Promise<void> {
  try {
    const handle = await finishOpenAttempt(tryOnTaskId, {
      status: GenerationAttemptStatus.COMPLETED,
    })
    const request = await prisma.generationRequest.findUnique({
      where: { tryOnTaskId },
      select: { id: true, startedAt: true, finalStatus: true },
    })
    if (!request) return
    if (request.finalStatus === GenerationRequestFinalStatus.COMPLETED) return

    const completedAt = new Date()
    await prisma.generationRequest.updateMany({
      where: {
        id: request.id,
        finalStatus: { not: GenerationRequestFinalStatus.COMPLETED },
      },
      data: {
        finalStatus: GenerationRequestFinalStatus.COMPLETED,
        completedAt,
        endToEndDurationMs: Math.max(0, completedAt.getTime() - request.startedAt.getTime()),
        finalErrorCode: null,
      },
    })
    logger.info('generation', 'ATTEMPT_COMPLETED', generationLogFields(handle, { status: 'COMPLETED' }))
    logger.info('generation', 'REQUEST_COMPLETED', generationLogFields(handle, { status: 'COMPLETED' }))
  } catch (error) {
    logTelemetryFailure('recordUsableGenerationSuccess', error, { tryOnTaskId })
  }
}

export async function recordGenerationFailure(
  tryOnTaskId: string,
  error?: string | null,
  options?: {
    source?: 'submit' | 'poll' | 'persist' | 'upload' | 'internal'
    httpStatus?: number | null
    isTimeout?: boolean
    completeRequest?: boolean
  },
): Promise<void> {
  try {
    const classified = classifyGenerationError(error, {
      source: options?.source,
      httpStatus: options?.httpStatus,
    })
    const isTimeout = options?.isTimeout ?? classified.isTimeout
    const attemptStatus = isTimeout ? GenerationAttemptStatus.TIMEOUT : GenerationAttemptStatus.FAILED
    const completeRequest = options?.completeRequest !== false

    const handle = await finishOpenAttempt(tryOnTaskId, {
      status: attemptStatus,
      errorCode: classified.errorCode,
      errorMessageNormalized: classified.errorMessageNormalized,
      isTimeout,
    })

    logger.info(
      'generation',
      isTimeout ? 'ATTEMPT_TIMEOUT' : 'ATTEMPT_FAILED',
      generationLogFields(handle, {
        status: attemptStatus,
      }),
    )

    if (!completeRequest) return

    const request = await prisma.generationRequest.findUnique({
      where: { tryOnTaskId },
      select: { id: true, startedAt: true, finalStatus: true },
    })
    if (!request || request.finalStatus === GenerationRequestFinalStatus.COMPLETED) return

    const completedAt = new Date()
    await prisma.generationRequest.updateMany({
      where: {
        id: request.id,
        finalStatus: { not: GenerationRequestFinalStatus.COMPLETED },
      },
      data: {
        finalStatus: GenerationRequestFinalStatus.FAILED,
        completedAt,
        endToEndDurationMs: Math.max(0, completedAt.getTime() - request.startedAt.getTime()),
        finalErrorCode: classified.errorCode,
      },
    })
    logger.info('generation', 'REQUEST_FAILED', generationLogFields(handle, { status: 'FAILED' }))
  } catch (error) {
    logTelemetryFailure('recordGenerationFailure', error, { tryOnTaskId })
  }
}

export async function recordGenerationTimeoutForRetry(tryOnTaskId: string, error?: string | null): Promise<void> {
  await recordGenerationFailure(tryOnTaskId, error, {
    source: 'poll',
    isTimeout: true,
    completeRequest: false,
  })
}

export async function ensureGenerationRequestFromTask(task: {
  id: string
  origin: string
  userId?: string | null
  merchantId?: string | null
  merchantSessionId?: string | null
  clientSubmissionId?: string | null
  type?: string | null
  createdAt?: Date
  metadata?: unknown
}): Promise<GenerationTelemetryHandle | null> {
  const metadata = (task.metadata ?? {}) as Record<string, unknown>
  const telemetryOrigin =
    metadata.telemetryOrigin === 'CAMPAIGN' || metadata.telemetryOrigin === 'STORE' || metadata.telemetryOrigin === 'CONSUMER'
      ? metadata.telemetryOrigin
      : task.origin === 'CONSUMER'
        ? 'CONSUMER'
        : 'STORE'
  const serviceType = typeof metadata.serviceType === 'string' ? metadata.serviceType : 'grsai'

  return startGenerationRequest({
    tryOnTaskId: task.id,
    origin: telemetryOrigin,
    userId: task.userId,
    merchantId: task.merchantId,
    storeId: typeof metadata.storeId === 'string' ? metadata.storeId : null,
    campaignId: typeof metadata.campaignId === 'string' ? metadata.campaignId : null,
    clientSubmissionId: task.clientSubmissionId ?? (typeof metadata.clientSubmissionId === 'string' ? metadata.clientSubmissionId : null),
    generationType: task.type ?? 'GLASSES',
    provider: serviceType,
    startedAt: task.createdAt,
  })
}
