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
import { submitKieTask, KieProviderError } from "@/lib/kie"
import { selectNewTryOnProvider } from "@/lib/generation/kie-routing"
import { logger } from "@/lib/logger"
import { TaskStatus, TryOnType } from "@prisma/client"
import { randomUUID } from "node:crypto"
import { resolveTryOnPrompt } from "@/lib/try-on-prompt-registry"
import { recordStoreOrphanBlob } from "@/modules/store/application/cleanup-store-orphan-blobs"
import { isMockMode } from "@/lib/mocks"
import { mockBlobUpload } from "@/lib/mocks/blob"
import { resolveStoreAssetAccessPolicy } from "@/modules/store/infrastructure/config/store-asset-access-policy"
import type { TryOnSubmissionResult } from "@/lib/generation/tryon-types"
import {
  startGenerationRequest,
  startGenerationAttempt,
  markGenerationAttemptSubmitted,
  recordGenerationFailure,
  generationLogFields,
} from "@/lib/generation/telemetry"
import { GRSAI_TRY_ON_MODEL, KIE_TRY_ON_MODEL } from "@/lib/generation/providers"

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
  userId?: string | null
  idempotencyKey: string
  expiresAt?: Date
}

/**
 * Store-attributed Try-On submission.
 * Does not require a consumer User and never settles consumer credits.
 * Uses the shared new-task provider selection; Store sponsorship remains local.
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
    onProviderAccepted?: () => Promise<void>
  },
): Promise<TryOnSubmissionResult> {
  const clientSubmissionId = options?.clientSubmissionId
  const startTime = Date.now()
  const { merchantId, merchantSessionId, merchantFrameId, origin, idempotencyKey } = attribution

  logger.debug('store', 'Starting Store try-on task', {
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
  const isAsync = true
  const storeAssetPolicy = resolveStoreAssetAccessPolicy()
  // Operator routing applies only to newly claimed requests. Store/Campaign
  // keep the same selected storage access policy as Grsai.
  const serviceType = selectNewTryOnProvider('store')
  const providerModel = serviceType === 'kie' ? KIE_TRY_ON_MODEL : GRSAI_TRY_ON_MODEL
  const metadataTelemetry = (options?.metadata ?? {}) as Record<string, unknown>
  const telemetryOrigin =
    metadataTelemetry.telemetryOrigin === 'CAMPAIGN' ? 'CAMPAIGN' : 'STORE'
  const telemetryStoreId = typeof metadataTelemetry.storeId === 'string' ? metadataTelemetry.storeId : null
  const telemetryCampaignId = typeof metadataTelemetry.campaignId === 'string' ? metadataTelemetry.campaignId : null
  const telemetryIsTest = metadataTelemetry.telemetryIsTest === true

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
      logger.debug('store', 'Store dispatch lease is owned by another request', {
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
          userId: attribution.userId ?? null,
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
      logger.debug('store', 'Reusing Store idempotent try-on submission (claim race)', {
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

  await startGenerationRequest({
    tryOnTaskId: task.id,
    origin: telemetryOrigin,
    userId: attribution.userId,
    merchantId,
    storeId: telemetryStoreId,
    campaignId: telemetryCampaignId,
    clientSubmissionId,
    generationType: 'GLASSES',
    provider: serviceType,
    model: providerModel,
    startedAt: task.createdAt,
    isTest: telemetryIsTest,
  })

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

  // False means all work so far is local/pre-provider and a failure can
  // release the sponsored reservation. True means the provider call has
  // started; an exception is delivery-uncertain and must retain the row.
  let providerStarted = false
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
    logger.error('store', 'Failed to upload Store images to blob', error as Error, {
      merchantId,
      merchantSessionId,
      taskId: task.id,
      origin: telemetryOrigin,
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
    await recordGenerationFailure(task.id, 'Failed to upload images to Store storage', {
      source: 'upload',
      failureStage: 'ASSET_UPLOAD',
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

    // Kie has no cross-provider idempotent createTask endpoint. Persist
    // PROCESSING/UNKNOWN before outbound submission; never turn an ambiguous
    // response into FAILED or permit an automatic re-dispatch.
    if (serviceType === 'kie') {
      const attemptHandle = await startGenerationAttempt({
        tryOnTaskId: task.id,
        provider: 'kie',
        model: KIE_TRY_ON_MODEL,
      })
      const armed = await prisma.tryOnTask.updateMany({
        where: {
          id: task.id,
          dispatchLeaseOwner: dispatchFence.owner,
          dispatchVersion: dispatchFence.version,
          status: TaskStatus.PENDING,
        },
        data: {
          status: TaskStatus.PROCESSING,
          metadata: {
            ...(task.metadata as object),
            serviceType: 'kie',
            isAsync: true,
            dispatchOutcome: 'UNKNOWN',
            providerSubmissionStatus: 'SUBMITTING',
          },
        },
      })
      if (armed.count !== 1) {
        throw new Error('Store Kie dispatch lease lost before submission')
      }
      let acceptedId: string | undefined
      const submitStartedAt = Date.now()
      const attemptLog = generationLogFields(attemptHandle, {
        tryOnTaskId: task.id,
        clientSubmissionId,
        origin: telemetryOrigin,
        provider: 'kie',
        model: KIE_TRY_ON_MODEL,
      })
      try {
        providerStarted = true
        // Includes both reference uploads and the single non-idempotent
        // createTask. The route has a 60-second execution budget.
        acceptedId = await submitKieTask(
          userDataUri, itemDataUri, effectivePrompt, promptVersion,
          startTime + 50_000,
        )
        const committed = await prisma.tryOnTask.updateMany({
          where: {
            id: task.id,
            dispatchLeaseOwner: dispatchFence.owner,
            dispatchVersion: dispatchFence.version,
            status: TaskStatus.PROCESSING,
          },
          data: {
            dispatchLeaseOwner: null,
            dispatchLeaseUntil: null,
            metadata: {
              ...(task.metadata as object),
              externalTaskId: acceptedId,
              serviceType: 'kie',
              isAsync: true,
              dispatchOutcome: 'ACCEPTED',
              providerSubmissionStatus: 'ACCEPTED',
              dispatchMs: Date.now() - startTime,
              inputAssetAccessMode: storeAssetPolicy.assetAccessMode,
              privateBlob: storeAssetPolicy.blobAccess === 'private',
            },
          },
        })
        if (committed.count !== 1) {
          throw new Error('Store Kie task accepted but local dispatch fence changed')
        }
        // Telemetry/usage write failure must never erase the already-persisted
        // provider ID or allow a second billable task.
        try {
          await markGenerationAttemptSubmitted(task.id, acceptedId, Date.now() - submitStartedAt)
        } catch (telemetryError) {
          logger.warn('store', 'Accepted Kie task needs telemetry reconciliation', {
            taskId: task.id, merchantId,
          })
        }
        try {
          await options?.onProviderAccepted?.()
        } catch (accountingError) {
          logger.error('store', 'Kie task accepted; sponsored usage reconciliation required',
            accountingError as Error, { taskId: task.id, merchantId })
        }
        return { taskId: task.id, status: 'submitted', serviceType: 'kie', isAsync: true }
      } catch (error) {
        const definitelyNotSent =
          error instanceof KieProviderError && error.acceptance === 'not-sent'
        if (definitelyNotSent) {
          // No billable createTask was sent. Explicit retries may use a NEW
          // logical task, and the sponsored reservation can be released.
          providerStarted = false
        }
        await prisma.tryOnTask.updateMany({
          where: {
            id: task.id,
            dispatchLeaseOwner: dispatchFence.owner,
            dispatchVersion: dispatchFence.version,
            status: TaskStatus.PROCESSING,
          },
          data: {
            status: definitelyNotSent ? TaskStatus.FAILED : TaskStatus.PROCESSING,
            errorMessage: definitelyNotSent ? 'Kie did not accept the generation request' : null,
            metadata: {
              ...(task.metadata as object),
              serviceType: 'kie',
              isAsync: true,
              ...(acceptedId ? { externalTaskId: acceptedId } : {}),
              dispatchOutcome: definitelyNotSent ? 'NOT_SENT' : 'UNKNOWN',
              providerSubmissionStatus: definitelyNotSent ? 'NOT_SENT' : 'UNKNOWN',
              privateBlob: storeAssetPolicy.blobAccess === 'private',
            },
          },
        })
        throw error
      }
    }

    // Set immediately before the provider call. A thrown request may have
    // reached the provider, so the caller must retain the reservation.
    providerStarted = true
    const attemptHandle = await startGenerationAttempt({
      tryOnTaskId: task.id,
      provider: 'grsai',
      model: GRSAI_TRY_ON_MODEL,
    })
    const submitStartedAt = Date.now()
    const attemptLog = generationLogFields(attemptHandle, {
      tryOnTaskId: task.id,
      clientSubmissionId,
      origin: telemetryOrigin,
      provider: 'grsai',
      model: GRSAI_TRY_ON_MODEL,
    })
    const externalTaskId = await submitAsyncTask(
      userDataUri,
      itemDataUri,
      effectivePrompt,
      promptVersion,
      {
        taskId: task.id,
        clientSubmissionId,
        origin,
        ...attemptLog,
      },
    )
    await markGenerationAttemptSubmitted(task.id, externalTaskId, Date.now() - submitStartedAt)

    // This callback is the cost boundary: the provider accepted a costly
    // generation. It is intentionally best-effort; a failed accounting write
    // leaves the reservation active and therefore cannot grant another free run.
    try {
      await options?.onProviderAccepted?.()
    } catch (accountingError) {
      logger.error('store', 'Failed to finalize sponsored usage after provider acceptance', accountingError as Error, {
        taskId: task.id,
        merchantId,
      })
    }

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
    if (error && typeof error === 'object') {
      ;(error as { providerStarted?: boolean }).providerStarted = providerStarted
    }
    logger.error('store', 'Store generation submission failed', error as Error, {
      taskId: task.id,
      merchantId,
      origin: telemetryOrigin,
    })
    if (serviceType !== 'kie' || !providerStarted) {
      // Kie with a known NOT_SENT outcome is safe to mark FAILED. UNKNOWN
      // acceptance must remain PROCESSING and must not release reservations.
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
      await recordGenerationFailure(task.id, errorMessage, { source: 'submit', failureStage: 'SUBMIT' })
    }
    throw error
  }
}
