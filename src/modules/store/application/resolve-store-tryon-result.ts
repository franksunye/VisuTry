/**
 * Stream a completed Store try-on result for the owning capability session.
 */

import { get } from '@vercel/blob'
import { prisma } from '@/lib/prisma'
import { isMockMode } from '@/lib/mocks'
import {
  StoreDomainError,
  merchantInactive,
  merchantNotFound,
  sessionUnauthorized,
} from '../domain'
import type {
  MerchantRepository,
  MerchantSessionRepository,
} from './ports/repositories'
import { requireOperableStoreSession } from './require-store-session'

export { buildStoreTryOnResultDeliveryUrl } from './store-result-delivery'

export type ResolveStoreTryOnResult = {
  taskId: string
  contentType: string
  body: Buffer
}

async function readPrivateResultBytes(input: {
  resultImageUrl: string
  resultPathname?: string | null
}): Promise<{ body: Buffer; contentType: string }> {
  if (isMockMode) {
    const response = await fetch(input.resultImageUrl)
    if (!response.ok) {
      throw new StoreDomainError('VALIDATION_ERROR', 'Result image unavailable.', 404)
    }
    return {
      body: Buffer.from(await response.arrayBuffer()),
      contentType: response.headers.get('content-type') || 'image/png',
    }
  }

  const key = input.resultPathname || input.resultImageUrl
  const result = await get(key, { access: 'private' })
  if (!result?.stream) {
    throw new StoreDomainError('VALIDATION_ERROR', 'Result image unavailable.', 404)
  }
  const reader = result.stream.getReader()
  const chunks: Uint8Array[] = []
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    if (value) chunks.push(value)
  }
  return {
    body: Buffer.concat(chunks.map((c) => Buffer.from(c))),
    contentType: result.blob.contentType || 'image/png',
  }
}

export async function resolveStoreTryOnResult(input: {
  merchants: MerchantRepository
  sessions: MerchantSessionRepository
  slug: string
  merchantSessionId: string
  capabilityToken: string | null
  taskId: string
}): Promise<ResolveStoreTryOnResult> {
  const merchant = await input.merchants.findBySlug(input.slug)
  if (!merchant) throw merchantNotFound()
  if (merchant.status !== 'ACTIVE') throw merchantInactive()

  const session = await requireOperableStoreSession({
    sessions: input.sessions,
    merchantId: merchant.id,
    merchantSessionId: input.merchantSessionId,
    capabilityToken: input.capabilityToken,
  })

  const task = await prisma.tryOnTask.findFirst({
    where: {
      id: input.taskId,
      merchantId: merchant.id,
      merchantSessionId: session.id,
      origin: { in: ['STORE_DEMO', 'STORE_PILOT'] },
      status: 'COMPLETED',
    },
    select: {
      id: true,
      resultImageUrl: true,
      metadata: true,
      expiresAt: true,
      retentionStatus: true,
    },
  })

  if (!task?.resultImageUrl || task.resultImageUrl.startsWith('pending:')) {
    throw sessionUnauthorized()
  }
  if (task.retentionStatus === 'DELETED') {
    throw new StoreDomainError('VALIDATION_ERROR', 'Result image unavailable.', 404)
  }
  if (task.expiresAt && task.expiresAt.getTime() <= Date.now()) {
    throw new StoreDomainError('VALIDATION_ERROR', 'Result image has expired.', 410)
  }

  const metadata = (task.metadata ?? {}) as Record<string, unknown>
  const resultPathname =
    typeof metadata.resultPathname === 'string' ? metadata.resultPathname : null

  const bytes = await readPrivateResultBytes({
    resultImageUrl: task.resultImageUrl,
    resultPathname,
  })

  return {
    taskId: task.id,
    contentType: bytes.contentType,
    body: bytes.body,
  }
}
