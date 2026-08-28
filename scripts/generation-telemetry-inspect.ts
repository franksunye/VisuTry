#!/usr/bin/env tsx

/**
 * Read-only production reconciliation helper.
 * Does not print image URLs, prompts, or raw provider payloads.
 *
 * Usage:
 *   npm run inspect:generation-telemetry -- --tryOnTaskId <id>
 *   npm run inspect:generation-telemetry -- --requestId <id>
 *   npm run inspect:generation-telemetry -- --providerTaskId <id>
 *   npm run inspect:generation-telemetry -- --clientSubmissionId <id>
 */

import { prisma } from '@/lib/prisma'
import { pickSafeTryOnMetadata } from '@/lib/generation/inspect'

function readArg(flag: string): string | undefined {
  const index = process.argv.indexOf(flag)
  if (index === -1) return undefined
  return process.argv[index + 1]
}

async function main() {
  const tryOnTaskId = readArg('--tryOnTaskId')
  const requestId = readArg('--requestId')
  const providerTaskId = readArg('--providerTaskId')
  const clientSubmissionId = readArg('--clientSubmissionId')

  if (!tryOnTaskId && !requestId && !providerTaskId && !clientSubmissionId) {
    throw new Error('Pass --tryOnTaskId, --requestId, --providerTaskId, or --clientSubmissionId')
  }

  let requestIds: string[] = []

  if (requestId) {
    requestIds = [requestId]
  } else if (tryOnTaskId) {
    const row = await prisma.generationRequest.findUnique({
      where: { tryOnTaskId },
      select: { id: true },
    })
    requestIds = row ? [row.id] : []
  } else if (providerTaskId) {
    const attempts = await prisma.generationAttempt.findMany({
      where: { providerTaskId },
      select: { requestId: true },
    })
    requestIds = [...new Set(attempts.map((row) => row.requestId))]
  } else if (clientSubmissionId) {
    const rows = await prisma.generationRequest.findMany({
      where: { clientSubmissionId },
      select: { id: true },
    })
    requestIds = rows.map((row) => row.id)
  }

  const requests = await prisma.generationRequest.findMany({
    where: { id: { in: requestIds } },
    include: {
      attempts: { orderBy: { attemptNumber: 'asc' } },
    },
    orderBy: { startedAt: 'asc' },
  })

  const taskIds = [...new Set(requests.map((row) => row.tryOnTaskId))]
  const tasks = taskIds.length
    ? await prisma.tryOnTask.findMany({
        where: { id: { in: taskIds } },
        select: {
          id: true,
          origin: true,
          status: true,
          clientSubmissionId: true,
          batchId: true,
          merchantId: true,
          merchantSessionId: true,
          merchantFrameId: true,
          createdAt: true,
          updatedAt: true,
          metadata: true,
        },
      })
    : []
  const tasksById = new Map(tasks.map((task) => [task.id, task]))

  const payload = {
    lookup: { tryOnTaskId, requestId, providerTaskId, clientSubmissionId },
    requestCount: requests.length,
    requests: requests.map((request) => {
      const task = tasksById.get(request.tryOnTaskId)
      return {
        generationRequest: {
          id: request.id,
          tryOnTaskId: request.tryOnTaskId,
          origin: request.origin,
          requestedProvider: request.requestedProvider,
          requestedModel: request.requestedModel,
          finalStatus: request.finalStatus,
          attemptCount: request.attemptCount,
          startedAt: request.startedAt,
          completedAt: request.completedAt,
          endToEndDurationMs: request.endToEndDurationMs,
          finalErrorCode: request.finalErrorCode,
          failureStage: request.failureStage,
          isTest: request.isTest,
          environment: request.environment,
          clientSubmissionId: request.clientSubmissionId,
          merchantId: request.merchantId,
          storeId: request.storeId,
          campaignId: request.campaignId,
        },
        tryOnTask: task
          ? {
              id: task.id,
              origin: task.origin,
              status: task.status,
              clientSubmissionId: task.clientSubmissionId,
              batchId: task.batchId,
              merchantId: task.merchantId,
              merchantSessionId: task.merchantSessionId,
              merchantFrameId: task.merchantFrameId,
              createdAt: task.createdAt,
              updatedAt: task.updatedAt,
              metadata: pickSafeTryOnMetadata(task.metadata),
            }
          : null,
        attempts: request.attempts.map((attempt) => ({
          id: attempt.id,
          attemptNumber: attempt.attemptNumber,
          provider: attempt.provider,
          model: attempt.model,
          providerTaskId: attempt.providerTaskId,
          status: attempt.status,
          isTimeout: attempt.isTimeout,
          errorCode: attempt.errorCode,
          failureStage: attempt.failureStage,
          submittedAt: attempt.submittedAt,
          completedAt: attempt.completedAt,
          submitDurationMs: attempt.submitDurationMs,
          attemptDurationMs: attempt.attemptDurationMs,
          providerDurationMs: attempt.providerDurationMs,
        })),
      }
    }),
  }

  process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`)
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
