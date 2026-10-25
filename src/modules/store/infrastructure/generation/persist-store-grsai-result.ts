/**
 * Store-specific provider result persistence (existing Blob policy + result leases).
 * Registered into shared poll core — Consumer tryon-service must not import this.
 */

import { head, put } from '@vercel/blob'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { TaskStatus } from '@prisma/client'
import { isMockMode } from '@/lib/mocks'
import { mockBlobUpload } from '@/lib/mocks/blob'
import { isBlobConflictError, type DispatchFence } from '@/modules/store/application/store-dispatch-lease'
import { acquireStoreResultPersistLease } from '@/modules/store/application/store-task-leases'
import { resolveStoreAssetAccessPolicy } from '@/modules/store/infrastructure/config/store-asset-access-policy'
import type {
  GrsaiSucceededPersistHandler,
  GrsaiSucceededPersistInput,
} from '@/lib/generation/tryon-result-persist'
import type { TryOnPollResult } from '@/lib/generation/tryon-types'
import { recordUsableGenerationSuccess } from '@/lib/generation/telemetry'
import { readBoundedKieResult, kieResultExtension } from '@/lib/generation/kie-result-media'

async function storeCompletedResult(taskId: string, result: TryOnPollResult): Promise<TryOnPollResult> {
  if (result.status === TaskStatus.COMPLETED) {
    await recordUsableGenerationSuccess(taskId)
  }
  return result
}

export const persistStoreGrsaiSucceededResult: GrsaiSucceededPersistHandler = async (
  input: GrsaiSucceededPersistInput,
): Promise<TryOnPollResult> => {
  const {
    taskId,
    merchantId,
    pollImageUrl,
    pollProgress,
    pollMetadata,
    externalPollMetadata,
    latestBeforePersist,
  } = input

  const storeResultPolicy = resolveStoreAssetAccessPolicy()
  const resultOwnerKey = `store/${merchantId ?? taskId}`
  const isKie = externalPollMetadata.serviceType === 'kie'
  const resultBasePath = `tryon/result/${resultOwnerKey}/${taskId}`
  let resultPathname = `${resultBasePath}.png`

  // A peer may have already persisted JPEG/PNG/WebP. Check the real pathname
  // when reconciling a leased result; never pretend a JPEG is a .png blob.
  async function findExistingResult(): Promise<{ url: string; pathname: string }> {
    const paths = isKie
      ? ['jpg', 'png', 'webp'].map(ext => `${resultBasePath}.${ext}`)
      : [resultPathname]
    for (const pathname of paths) {
      try {
        const existing = await head(pathname)
        return { url: existing.url, pathname }
      } catch {
        // No matching object yet; inspect the next supported media format.
      }
    }
    throw new Error('Store result blob unavailable')
  }

  if (latestBeforePersist?.status === TaskStatus.COMPLETED) {
    return storeCompletedResult(taskId, {
      status: TaskStatus.COMPLETED,
      resultImageUrl: latestBeforePersist.resultImageUrl || undefined,
      progress: 100,
      isNewCompletion: false,
    })
  }

  let resultPersistFence: DispatchFence | null = null
  if (!isMockMode) {
    const metaBefore = (latestBeforePersist?.metadata ?? {}) as Record<string, unknown>
    const now = new Date()
    const leaseIsActive =
      latestBeforePersist?.resultPersistLeaseUntil != null &&
      latestBeforePersist.resultPersistLeaseUntil.getTime() > now.getTime()
    if (leaseIsActive) {
      try {
        const existing = await findExistingResult()
        const updateResult = await prisma.tryOnTask.updateMany({
          where: {
            id: taskId,
            status: { not: TaskStatus.COMPLETED },
          },
          data: {
            status: TaskStatus.COMPLETED,
            resultImageUrl: existing.url,
            errorMessage: null,
            metadata: {
              ...metaBefore,
              ...externalPollMetadata,
              resultPathname: existing.pathname,
              resultAssetAccessMode: storeResultPolicy.assetAccessMode,
              privateBlob: !storeResultPolicy.publicPoc,
              privatePersistPending: false,
              privatePersistError: null,
              completionTime: Date.now(),
              resultReconciledFromExistingBlob: true,
            },
            resultPersistLeaseOwner: null,
            resultPersistLeaseUntil: null,
          },
        })
        return storeCompletedResult(taskId, {
          status: TaskStatus.COMPLETED,
          resultImageUrl: existing.url,
          progress: 100,
          isNewCompletion: updateResult.count > 0,
        })
      } catch {
        // Lease holder still uploading
      }
      return {
        status: TaskStatus.PROCESSING,
        progress: pollProgress ?? 90,
      }
    }

    const expectedVersion = latestBeforePersist?.resultPersistVersion ?? 0
    const acquired = await acquireStoreResultPersistLease({
      taskId,
      expectedVersion,
      now,
    })
    if (!acquired) {
      try {
        const existing = await findExistingResult()
        const reconciled = await prisma.tryOnTask.updateMany({
          where: { id: taskId, status: { not: TaskStatus.COMPLETED } },
          data: {
            status: TaskStatus.COMPLETED,
            resultImageUrl: existing.url,
            errorMessage: null,
            metadata: {
              ...metaBefore,
              ...externalPollMetadata,
              resultPathname: existing.pathname,
              resultAssetAccessMode: storeResultPolicy.assetAccessMode,
              privateBlob: !storeResultPolicy.publicPoc,
              privatePersistPending: false,
              privatePersistError: null,
              completionTime: Date.now(),
              resultReconciledFromExistingBlob: true,
            },
            resultPersistLeaseOwner: null,
            resultPersistLeaseUntil: null,
          },
        })
        return storeCompletedResult(taskId, {
          status: TaskStatus.COMPLETED,
          resultImageUrl: existing.url,
          progress: 100,
          isNewCompletion: reconciled.count > 0,
        })
      } catch {
        return {
          status: TaskStatus.PROCESSING,
          progress: pollProgress ?? 90,
        }
      }
    }
    resultPersistFence = acquired
  }

  let persistedUrl: string | null = null
  try {
    const response = await fetch(
      pollImageUrl,
      isKie ? { redirect: 'error', cache: 'no-store' } : undefined,
    )
    if (!response.ok) {
      throw new Error(`Failed to fetch provider result (${response.status})`)
    }
    const blob = isKie ? await readBoundedKieResult(response) : await response.blob()
    const extension = isKie ? kieResultExtension(blob.type) : 'png'
    resultPathname = `${resultBasePath}.${extension}`
    const file = new File([blob], `result-${taskId}.${extension}`, { type: blob.type || 'image/png' })

    if (isMockMode) {
      const uploaded = await mockBlobUpload(resultPathname, file)
      persistedUrl = uploaded.url
    } else {
      try {
        const uploadedBlob = await put(resultPathname, file, {
          access: storeResultPolicy.blobAccess,
          contentType: file.type || 'image/png',
        })
        persistedUrl = uploadedBlob.url
      } catch (putError) {
        if (!isBlobConflictError(putError)) throw putError
        const existing = await findExistingResult()
        persistedUrl = existing.url
        logger.debug('store', 'Store result blob already present; reconciling', {
          taskId,
          pathname: resultPathname,
        })
      }
    }
    logger.info('store', 'Store GrsAi result persisted to blob', {
      taskId,
      pathname: resultPathname,
      access: storeResultPolicy.blobAccess,
    })
  } catch (uploadError) {
    logger.error(
      'store',
      'Failed to persist Store GrsAi result to blob',
      uploadError as Error,
      { taskId },
    )

    if (isBlobConflictError(uploadError) && !isMockMode) {
      try {
        const existing = await findExistingResult()
        persistedUrl = existing.url
      } catch {
        persistedUrl = null
      }
    }

    if (!persistedUrl) {
      await prisma.tryOnTask.updateMany({
        where: {
          id: taskId,
          status: { not: TaskStatus.COMPLETED },
          ...(resultPersistFence
            ? {
                resultPersistLeaseOwner: resultPersistFence.owner,
                resultPersistVersion: resultPersistFence.version,
              }
            : {}),
        },
        data: {
          status: TaskStatus.PROCESSING,
          errorMessage: null,
          metadata: {
            ...externalPollMetadata,
            privatePersistPending: true,
            privatePersistError:
              uploadError instanceof Error
                ? uploadError.message.slice(0, 500)
                : 'persist_failed',
            providerResultPresent: true,
          },
          ...(resultPersistFence
            ? {
                resultPersistLeaseOwner: null,
                resultPersistLeaseUntil: null,
              }
            : {}),
        },
      })
      const afterFail = await prisma.tryOnTask.findUnique({
        where: { id: taskId },
        select: { status: true, resultImageUrl: true },
      })
      if (afterFail?.status === TaskStatus.COMPLETED) {
        return storeCompletedResult(taskId, {
          status: TaskStatus.COMPLETED,
          resultImageUrl: afterFail.resultImageUrl || undefined,
          progress: 100,
          isNewCompletion: false,
        })
      }
      return {
        status: TaskStatus.PROCESSING,
        progress: pollProgress ?? 90,
        error: undefined,
      }
    }
  }

  if (!persistedUrl) {
    return {
      status: TaskStatus.PROCESSING,
      progress: pollProgress ?? 90,
    }
  }

  const updateResult = await prisma.tryOnTask.updateMany({
    where: {
      id: taskId,
      status: { not: TaskStatus.COMPLETED },
      ...(resultPersistFence
        ? {
            resultPersistLeaseOwner: resultPersistFence.owner,
            resultPersistVersion: resultPersistFence.version,
          }
        : {}),
    },
    data: {
      status: TaskStatus.COMPLETED,
      resultImageUrl: persistedUrl,
      errorMessage: null,
      metadata: {
        ...(pollMetadata || {}),
        ...externalPollMetadata,
        resultPathname,
        resultAssetAccessMode: storeResultPolicy.assetAccessMode,
        privateBlob: !storeResultPolicy.publicPoc,
        privatePersistPending: false,
        privatePersistError: null,
        completionTime: Date.now(),
      },
      ...(resultPersistFence
        ? {
            resultPersistLeaseOwner: null,
            resultPersistLeaseUntil: null,
          }
        : {}),
    },
  })

  const isNewCompletion = updateResult.count > 0
  if (!isNewCompletion) {
    const completed = await prisma.tryOnTask.findUnique({
      where: { id: taskId },
      select: { status: true, resultImageUrl: true },
    })
    if (completed?.status !== TaskStatus.COMPLETED) {
      return {
        status: TaskStatus.PROCESSING,
        progress: pollProgress ?? 90,
        isNewCompletion: false,
      }
    }
    return storeCompletedResult(taskId, {
      status: TaskStatus.COMPLETED,
      resultImageUrl: completed.resultImageUrl || persistedUrl,
      progress: 100,
      isNewCompletion: false,
    })
  }

  return storeCompletedResult(taskId, {
    status: TaskStatus.COMPLETED,
    resultImageUrl: persistedUrl,
    progress: 100,
    isNewCompletion,
  })
}
