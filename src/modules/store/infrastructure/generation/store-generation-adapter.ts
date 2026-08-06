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

      const origin =
        input.usagePolicy.kind === 'merchant_allowance' ? 'STORE_PILOT' : 'STORE_DEMO'

      const result: TryOnSubmissionResult = await submitStoreTryOnTask(
        {
          merchantId: input.actor.merchantId,
          merchantSessionId: input.actor.merchantSessionId,
          merchantFrameId: input.actor.merchantFrameId,
          origin,
          idempotencyKey: input.idempotencyKey,
          expiresAt: computeStoreAssetExpiresAt(),
        },
        userImage,
        itemImage,
        {
          clientSubmissionId: input.clientSubmissionId,
          prompt: input.prompt,
          preClaimedTaskId: input.preClaimedTaskId,
          dispatchLease: input.dispatchLease,
          metadata: {
            usagePolicyKind: input.usagePolicy.kind,
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
