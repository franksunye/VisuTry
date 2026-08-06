/**
 * Store-attributed Try-On submission (ADR-007).
 * Lives in the Store module — Consumer tryon-service must not own this path.
 */

import { prisma } from "@/lib/prisma"
import { del, put } from "@vercel/blob"
import {
  buildDispatchLeaseFields,
  type DispatchFence,
} from "@/modules/store/application/store-dispatch-lease"
import { submitAsyncTask } from "@/lib/grsai"
import { logger } from "@/lib/logger"
import { TaskStatus, TryOnType } from "@prisma/client"
import { randomUUID } from "node:crypto"
import { resolveTryOnPrompt } from "@/lib/try-on-prompt-registry"
import { recordStoreOrphanBlob } from "@/modules/store/application/cleanup-store-orphan-blobs"
import { isMockMode } from "@/lib/mocks"
import { mockBlobUpload } from "@/lib/mocks/blob"
import { resolveStoreAssetAccessPolicy } from "@/modules/store/infrastructure/config/store-asset-access-policy"
import type { TryOnSubmissionResult } from "@/lib/generation/tryon-types"

function submissionResultFromTask(task: {
  id: string
  status: TaskStatus
  resultImageUrl?: string | null
  errorMessage?: string | null
  metadata?: unknown
}): TryOnSubmissionResult {
  const metadata = (task.metadata ?? {}) as Record<string, unknown>
  const serviceType = typeof metadata.serviceType === "string" ? metadata.serviceType : "grsai"
  const status =
    task.status === TaskStatus.COMPLETED
      ? "completed"
      : task.status === TaskStatus.FAILED
        ? "failed"
        : "submitted"

  return {
    taskId: task.id,
    status,
    serviceType,
    isAsync: metadata.isAsync !== false,
    resultImageUrl: task.resultImageUrl ?? undefined,
    error: task.errorMessage ?? undefined,
  }
}

function isUniqueConstraintError(error: unknown) {
  return Boolean(error && typeof error === "object" && (error as { code?: string }).code === "P2002")
}

export type StoreTryOnAttribution = {
  merchantId: string
  merchantSessionId: string
  merchantFrameId: string
  origin: 'STORE_DEMO' | 'STORE_PILOT'
  idempotencyKey: string
  expiresAt?: Date
}

/**
 * Store-attributed Try-On submission.
 * Does not require a consumer User and never settles consumer credits.
 * Forces GrsAI async path for D0 parity with Frame Compare.
 */
export async function submitStoreTryOnTask(
  attribution: StoreTryOnAttribution,
  userImageFile: File,
  itemImageFile: File,
  options?: {
    clientSubmissionId?: string
    metadata?: Record<string, unknown>
    prompt?: string
    preClaimedTaskId?: string
    dispatchLease?: DispatchFence
  },
): Promise<TryOnSubmissionResult> {
  const clientSubmissionId = options?.clientSubmissionId
  const startTime = Date.now()
  const { merchantId, merchantSessionId, merchantFrameId, origin, idempotencyKey } = attribution

  logger.info('tryon-service', 'Starting Store try-on task', {
    merchantId,
    merchantSessionId,
    merchantFrameId,
    origin,
    clientSubmissionId,
    preClaimedTaskId: options?.preClaimedTaskId,
  })

  const resolvedPrompt = resolveTryOnPrompt(TryOnType.GLASSES, options?.prompt)
  const effectivePrompt = resolvedPrompt.detailedInstructions
  const promptVersion = resolvedPrompt.version
  const serviceType = 'grsai'
  const isAsync = true
  const storeAssetPolicy = resolveStoreAssetAccessPolicy()

  // Claim-first: prefer pre-claimed task from atomic reservation; otherwise create here.
  const directLease = buildDispatchLeaseFields()
  let dispatchFence: DispatchFence = options?.dispatchLease ?? {
    owner: randomUUID(),
    version: 1,
  }
  let task: Awaited<ReturnType<typeof prisma.tryOnTask.create>>
  if (options?.preClaimedTaskId) {
    const claimed = await prisma.tryOnTask.findFirst({
      where: {
        id: options.preClaimedTaskId,
        merchantId,
        merchantSessionId,
        merchantFrameId,
        idempotencyKey,
        origin: { in: ['STORE_DEMO', 'STORE_PILOT'] },
      },
    })
    if (!claimed) {
      throw new Error('Pre-claimed Store try-on task not found')
    }
    // Already uploaded / dispatched — idempotent reuse
    if (!claimed.userImageUrl.startsWith('pending:')) {
      return submissionResultFromTask(claimed)
    }
    if (
      !options.dispatchLease ||
      claimed.dispatchLeaseOwner !== options.dispatchLease.owner ||
      claimed.dispatchVersion !== options.dispatchLease.version
    ) {
      logger.info('tryon-service', 'Store dispatch lease is owned by another request', {
        taskId: claimed.id,
      })
      return submissionResultFromTask(claimed)
    }
    dispatchFence = options.dispatchLease
    task = claimed
  } else {
    try {
      task = await prisma.tryOnTask.create({
        data: {
          userId: null,
          type: TryOnType.GLASSES,
          userImageUrl: 'pending://user',
          itemImageUrl: 'pending://item',
          status: TaskStatus.PENDING,
          origin,
          merchantId,
          merchantSessionId,
          merchantFrameId,
          idempotencyKey,
          clientSubmissionId,
          expiresAt: attribution.expiresAt,
          retentionStatus: 'ACTIVE',
          metadata: {
            ...(options?.metadata || {}),
            serviceType,
            isAsync,
            effectivePrompt,
            renderedPrompt: resolvedPrompt.renderedPrompt,
            promptVersion,
            promptSource: resolvedPrompt.source,
            retryCount: 0,
            clientSubmissionId,
            source: 'store',
            claimFirst: true,
            originalUserFileName: userImageFile.name,
            originalItemFileName: itemImageFile.name,
          },
          dispatchLeaseOwner: dispatchFence.owner,
          dispatchLeaseUntil: new Date(directLease.dispatchLeaseUntil),
          dispatchVersion: dispatchFence.version,
        },
      })
    } catch (error) {
      if (!isUniqueConstraintError(error)) throw error
      const raced = await prisma.tryOnTask.findUnique({ where: { idempotencyKey } })
      if (!raced) throw error
      if (
        raced.merchantId !== merchantId ||
        raced.merchantSessionId !== merchantSessionId ||
        raced.merchantFrameId !== merchantFrameId
      ) {
        throw new Error('Store idempotency key conflict')
      }
      logger.info('tryon-service', 'Reusing Store idempotent try-on submission (claim race)', {
        taskId: raced.id,
        idempotencyKey,
      })
      return submissionResultFromTask(raced)
    }
  }

  // Refresh metadata for pre-claimed rows that still need prompt/dispatch fields.
  if (options?.preClaimedTaskId) {
    const refreshed = await prisma.tryOnTask.updateMany({
      where: {
        id: task.id,
        dispatchLeaseOwner: dispatchFence.owner,
        dispatchVersion: dispatchFence.version,
        status: TaskStatus.PENDING,
        userImageUrl: { startsWith: 'pending:' },
      },
      data: {
        metadata: {
          ...((task.metadata as object) || {}),
          ...(options?.metadata || {}),
          serviceType,
          isAsync,
          effectivePrompt,
          renderedPrompt: resolvedPrompt.renderedPrompt,
          promptVersion,
          promptSource: resolvedPrompt.source,
          retryCount: 0,
          clientSubmissionId,
          source: 'store',
          claimFirst: true,
          originalUserFileName: userImageFile.name,
          originalItemFileName: itemImageFile.name,
        },
      },
    })
    if (refreshed.count !== 1) throw new Error('Store dispatch lease lost before upload')
    const refreshedTask = await prisma.tryOnTask.findUnique({ where: { id: task.id } })
    if (!refreshedTask) throw new Error('Store try-on task disappeared before upload')
    task = refreshedTask
  }

  const ownerKey = `store/${merchantId}`
  // A takeover gets a distinct path generation. A stale owner can therefore
  // compensate only its own uploads, never assets created by the new owner.
  const userPath = `tryon/user/${ownerKey}/${task.id}-v${dispatchFence.version}-${randomUUID()}`
  const itemPath = `tryon/item/${ownerKey}/${task.id}-v${dispatchFence.version}-${randomUUID()}`
  let userBlobUrl: string | null = null
  let itemBlobUrl: string | null = null

  const compensateUploaded = async () => {
    for (const [url, path] of [
      [userBlobUrl, userPath],
      [itemBlobUrl, itemPath],
    ] as const) {
      if (!url) continue
      try {
        if (!isMockMode) await del(path)
      } catch (delError) {
        await recordStoreOrphanBlob({
          url,
          pathname: path,
          merchantId,
          tryOnTaskId: task.id,
          error: delError instanceof Error ? delError.message : 'compensate_failed',
        })
      }
    }
  }

  try {
    if (isMockMode) {
      const settled = await Promise.allSettled([
        mockBlobUpload(userPath, userImageFile),
        mockBlobUpload(itemPath, itemImageFile),
      ])
      if (settled[0].status === 'fulfilled') userBlobUrl = settled[0].value.url
      if (settled[1].status === 'fulfilled') itemBlobUrl = settled[1].value.url
      if (settled[0].status === 'rejected' || settled[1].status === 'rejected') {
        const reason =
          settled[0].status === 'rejected'
            ? settled[0].reason
            : (settled[1] as PromiseRejectedResult).reason
        throw reason
      }
    } else {
      const settled = await Promise.allSettled([
        put(userPath, userImageFile, {
          access: storeAssetPolicy.blobAccess,
          contentType: userImageFile.type || 'image/jpeg',
        }),
        put(itemPath, itemImageFile, {
          access: storeAssetPolicy.blobAccess,
          contentType: itemImageFile.type || 'image/jpeg',
        }),
      ])
      if (settled[0].status === 'fulfilled') userBlobUrl = settled[0].value.url
      if (settled[1].status === 'fulfilled') itemBlobUrl = settled[1].value.url
      if (settled[0].status === 'rejected' || settled[1].status === 'rejected') {
        const reason =
          settled[0].status === 'rejected'
            ? settled[0].reason
            : (settled[1] as PromiseRejectedResult).reason
        throw reason
      }
    }
  } catch (error) {
    logger.error('tryon-service', 'Failed to upload Store images to blob', error as Error, {
      merchantId,
      merchantSessionId,
      taskId: task.id,
    })
    await compensateUploaded()
    await prisma.tryOnTask.updateMany({
      where: {
        id: task.id,
        dispatchLeaseOwner: dispatchFence.owner,
        dispatchVersion: dispatchFence.version,
      },
      data: {
        status: TaskStatus.FAILED,
        errorMessage: 'Failed to upload images to Store storage',
      },
    })
    throw new Error('Failed to upload images')
  }

  try {
    const attached = await prisma.tryOnTask.updateMany({
      where: {
        id: task.id,
        dispatchLeaseOwner: dispatchFence.owner,
        dispatchVersion: dispatchFence.version,
        status: TaskStatus.PENDING,
        userImageUrl: { startsWith: 'pending:' },
      },
      data: {
        userImageUrl: userBlobUrl!,
        itemImageUrl: itemBlobUrl!,
        metadata: {
          ...(task.metadata as object),
          userPathname: userPath,
          itemPathname: itemPath,
          inputAssetAccessMode: storeAssetPolicy.assetAccessMode,
          privateBlob: !storeAssetPolicy.publicPoc,
        },
      },
    })
    if (attached.count !== 1) throw new Error('Store dispatch lease lost after upload')
    const attachedTask = await prisma.tryOnTask.findUnique({ where: { id: task.id } })
    if (!attachedTask) throw new Error('Store try-on task disappeared after upload')
    task = attachedTask
  } catch (error) {
    await compensateUploaded()
    throw error
  }

  try {
    const userBuffer = Buffer.from(await userImageFile.arrayBuffer())
    const itemBuffer = Buffer.from(await itemImageFile.arrayBuffer())
    const userMime = userImageFile.type || 'image/jpeg'
    const itemMime = itemImageFile.type || 'image/jpeg'
    const userDataUri = `data:${userMime};base64,${userBuffer.toString('base64')}`
    const itemDataUri = `data:${itemMime};base64,${itemBuffer.toString('base64')}`

    const externalTaskId = await submitAsyncTask(
      userDataUri,
      itemDataUri,
      effectivePrompt,
      promptVersion,
    )

    const dispatched = await prisma.tryOnTask.updateMany({
      where: {
        id: task.id,
        dispatchLeaseOwner: dispatchFence.owner,
        dispatchVersion: dispatchFence.version,
        status: TaskStatus.PENDING,
      },
      data: {
        status: TaskStatus.PROCESSING,
        dispatchLeaseOwner: null,
        dispatchLeaseUntil: null,
        metadata: {
          ...(task.metadata as object),
          externalTaskId,
          serviceType,
          isAsync,
          effectivePrompt,
          renderedPrompt: resolvedPrompt.renderedPrompt,
          promptVersion,
          promptSource: resolvedPrompt.source,
          retryCount: 0,
          dispatchMs: Date.now() - startTime,
          inputAssetAccessMode: storeAssetPolicy.assetAccessMode,
          privateBlob: !storeAssetPolicy.publicPoc,
        },
      },
    })
    if (dispatched.count !== 1) {
      throw new Error('Store dispatch lease lost after provider submission')
    }

    return {
      taskId: task.id,
      status: 'submitted',
      serviceType,
      isAsync,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    logger.error('tryon-service', 'Store GrsAi submission failed', error as Error, {
      taskId: task.id,
      merchantId,
    })
    await prisma.tryOnTask.updateMany({
      where: {
        id: task.id,
        dispatchLeaseOwner: dispatchFence.owner,
        dispatchVersion: dispatchFence.version,
        status: { not: TaskStatus.COMPLETED },
      },
      data: {
        status: TaskStatus.FAILED,
        errorMessage,
      },
    })
    throw error
  }
}

