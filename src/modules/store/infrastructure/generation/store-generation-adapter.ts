/**
 * Store product orchestration adapter around the shared generation core.
 * Provider selection stays replaceable behind tryon-service / config seams;
 * this adapter must not encode merchant commercial assumptions.
 */
import {
  getTryOnResult,
  type TryOnSubmissionResult,
} from '@/lib/tryon-service'
import { prisma } from '@/lib/prisma'
import type { StoreGenerationPort, StoreGenerationSubmitInput } from '../../application/ports/generation'
import { isStoreActor } from '../../domain/actor'
import { computeStoreAssetExpiresAt } from '../config/store-demo-limits'
import { submitStoreTryOnTask } from './submit-store-tryon-task'
import { ensureStoreTryOnPersistRegistered } from './ensure-store-tryon-persist-registered'
import { isMockMode } from '@/lib/mocks'

const LOCAL_DECISION_RESULT_E2E_ENABLED = process.env.APP_ENV === 'local'
  && process.env.ENABLE_MOCKS === 'true'
  && process.env.TEST_MODE === 'true'
  && process.env.P1_M5_LOCAL_DECISION_RESULT_E2E === '1'

export function createStoreGenerationAdapter(): StoreGenerationPort {
  ensureStoreTryOnPersistRegistered()

  return {
    async findExistingByIdempotencyKey(idempotencyKey, merchantId) {
      const existing = await prisma.tryOnTask.findUnique({
        where: { idempotencyKey },
      })
      if (!existing) return null
      if (existing.merchantId !== merchantId) {
        throw new Error('Store idempotency key belongs to another merchant')
      }
      return {
        taskId: existing.id,
        status:
          existing.status === 'COMPLETED'
            ? 'completed'
            : existing.status === 'FAILED'
              ? 'failed'
              : 'submitted',
        reusedExisting: true,
      }
    },

    async submit(input: StoreGenerationSubmitInput) {
      if (!isStoreActor(input.actor)) {
        throw new Error('Store generation adapter requires a store actor')
      }

      // The guarded Local Decision Result E2E exercises the real Store submit,
      // poll, and canonical snapshot paths without dispatching to a paid
      // external generation provider. This branch is impossible outside the
      // explicitly opted-in local test process.
      if (LOCAL_DECISION_RESULT_E2E_ENABLED && isMockMode && input.preClaimedTaskId) {
        const fixtureResult = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/pS8AAAAASUVORK5CYII='
        const completed = await prisma.tryOnTask.updateMany({
          where: {
            id: input.preClaimedTaskId,
            merchantId: input.actor.merchantId,
            merchantSessionId: input.actor.merchantSessionId,
            merchantFrameId: input.actor.merchantFrameId,
            status: 'PENDING',
          },
          data: {
            status: 'COMPLETED',
            resultImageUrl: fixtureResult,
            dispatchLeaseOwner: null,
            dispatchLeaseUntil: null,
            metadata: {
              usagePolicyKind: input.usagePolicy.kind,
              telemetryOrigin: input.telemetryOrigin ?? 'STORE',
              resultAssetAccessMode: 'PUBLIC_TEMPORARY',
              privateBlob: false,
              localDecisionResultE2EFixture: true,
              completionTime: Date.now(),
            },
          },
        })
        if (completed.count !== 1) throw new Error('Local E2E Try-On claim was not available')
        return { taskId: input.preClaimedTaskId, status: 'completed', reusedExisting: false }
      }

      const userImage =
        input.userImage instanceof File
          ? input.userImage
          : new File([input.userImage], 'shopper.jpg', {
              type: input.userImage.type || 'image/jpeg',
            })
      const itemImage =
        input.itemImage instanceof File
          ? input.itemImage
          : new File([input.itemImage], 'frame.jpg', {
              type: input.itemImage.type || 'image/jpeg',
            })

      const existing = await prisma.tryOnTask.findUnique({
        where: { idempotencyKey: input.idempotencyKey },
      })
      if (existing && existing.id !== input.preClaimedTaskId) {
        return {
          taskId: existing.id,
          status:
            existing.status === 'COMPLETED'
              ? 'completed'
              : existing.status === 'FAILED'
                ? 'failed'
                : 'submitted',
          reusedExisting: true,
        }
      }

      const result: TryOnSubmissionResult = await submitStoreTryOnTask(
        {
          merchantId: input.actor.merchantId,
          merchantSessionId: input.actor.merchantSessionId,
          merchantFrameId: input.actor.merchantFrameId,
          origin: input.storeOrigin,
          idempotencyKey: input.idempotencyKey,
          expiresAt: input.expiresAt ?? computeStoreAssetExpiresAt(),
          userId: input.userId ?? null,
        },
        userImage,
        itemImage,
        {
          clientSubmissionId: input.clientSubmissionId,
          prompt: input.prompt,
          preClaimedTaskId: input.preClaimedTaskId,
          dispatchLease: input.dispatchLease,
          onProviderAccepted: input.onProviderAccepted,
          metadata: {
            usagePolicyKind: input.usagePolicy.kind,
            telemetryOrigin: input.telemetryOrigin ?? 'STORE',
            storeId: input.storeId ?? null,
            campaignId: input.campaignId ?? null,
            telemetryIsTest: input.isTest === true,
          },
        },
      )

      return {
        taskId: result.taskId,
        status: result.status,
        reusedExisting: false,
      }
    },

    async getStatus(taskId, merchantId) {
      ensureStoreTryOnPersistRegistered()

      const task = await prisma.tryOnTask.findFirst({
        where: {
          id: taskId,
          merchantId,
          origin: { in: ['STORE_DEMO', 'STORE_PILOT'] },
        },
        select: {
          id: true,
          status: true,
          resultImageUrl: true,
          errorMessage: true,
        },
      })
      if (!task) {
        throw new Error('Task not found')
      }

      if (task.status === 'PROCESSING' || task.status === 'PENDING') {
        const polled = await getTryOnResult(taskId)
        return {
          taskId,
          status: polled.status,
          resultImageUrl: polled.resultImageUrl ?? null,
          errorMessage: polled.error ?? null,
        }
      }

      return {
        taskId: task.id,
        status: task.status,
        resultImageUrl: task.resultImageUrl,
        errorMessage: task.errorMessage,
      }
    },
  }
}
