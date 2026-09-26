import { get } from '@vercel/blob'
import { prisma } from '@/lib/prisma'
import { isMockMode } from '@/lib/mocks'
import { hashSessionCapability } from '../domain/session'
import { sanitizeDecisionResultPayload } from '../domain/decision-result'
import { isHttpOrHttpsUrl } from '../domain/privacy'
import { resolveExperienceDeliveryPolicy, type ExperienceDeliveryPolicy } from '../domain/delivery-profile'

const MAX_SHARE_TOKEN_LENGTH = 200

type DecisionResultShareRow = {
  expiresAt: Date
  revokedAt: Date | null
  result: {
    id: string
    merchantId: string
    merchantSessionId: string
    expiresAt: Date
    payload: unknown
    merchant: { id: string; slug: string; name: string; status: string; accentColor: string | null; websiteUrl: string | null }
    experience: {
      id: string
      type: 'STORE' | 'CAMPAIGN'
      slug: string
      name: string
      primaryCtaType: string | null
      primaryCtaLabel: string | null
      primaryCtaUrl: string | null
      secondaryCtaType: string | null
      secondaryCtaLabel: string | null
      secondaryCtaUrl: string | null
      deliveryPolicy: unknown
    } | null
  }
}

function validToken(token: string): boolean {
  return token.length > 0 && token.length <= MAX_SHARE_TOKEN_LENGTH && /^[A-Za-z0-9_-]+$/.test(token)
}

function decisionResultAssetRef(token: string, taskId: string): string {
  return hashSessionCapability(`${token}:${taskId}`).slice(0, 32)
}

async function findShare(token: string): Promise<DecisionResultShareRow | null> {
  if (!validToken(token)) return null
  const share = await prisma.decisionResultShare.findUnique({
    where: { tokenHash: hashSessionCapability(token) },
    include: {
      result: {
        include: {
          merchant: { select: { id: true, slug: true, name: true, status: true, accentColor: true, websiteUrl: true } },
          experience: { select: { id: true, type: true, slug: true, name: true, primaryCtaType: true, primaryCtaLabel: true, primaryCtaUrl: true, secondaryCtaType: true, secondaryCtaLabel: true, secondaryCtaUrl: true, deliveryPolicy: true } },
        },
      },
    },
  })
  if (!share || share.revokedAt || share.expiresAt.getTime() <= Date.now()) return null
  if (share.result.expiresAt.getTime() <= Date.now()) return null
  if (share.result.merchantId !== share.result.merchant.id) return null
  if (share.result.merchant.status !== 'ACTIVE') return null
  return share as DecisionResultShareRow
}

function safeHandoff(label: string | null, type: string | null, url: string | null) {
  if (!label || !url) return null
  if (url.startsWith('/') && !url.startsWith('//') && !url.includes('\\')) return { label, type: type || 'LINK', url }
  if (isHttpOrHttpsUrl(url)) return { label, type: type || 'LINK', url }
  return null
}

export type DecisionResultView = {
  expiresAt: string
  merchant: { name: string; slug: string; accentColor: string | null; websiteUrl: string | null }
  experience: { type: 'STORE' | 'CAMPAIGN'; slug: string; name: string; primaryCta: ReturnType<typeof safeHandoff>; secondaryCta: ReturnType<typeof safeHandoff>; deliveryPolicy: ExperienceDeliveryPolicy } | null
  journey: ReturnType<typeof sanitizeDecisionResultPayload>['journey']
  faceFit: ReturnType<typeof sanitizeDecisionResultPayload>['faceFit']
  recommendation: ReturnType<typeof sanitizeDecisionResultPayload>['recommendation']
  selectedFrameIds: string[]
  favoriteFrameIds: string[]
  compare: ReturnType<typeof sanitizeDecisionResultPayload>['compare']
  tryOnResults: Array<{
    assetRef: string
    frameId: string
    name: string | null
    sku: string | null
    productUrl: string | null
    imageUrl: string
    completedAt: string
  }>
}

export async function getDecisionResultView(token: string): Promise<DecisionResultView | null> {
  const share = await findShare(token)
  if (!share) return null
  const payload = sanitizeDecisionResultPayload(share.result.payload)
  const taskIds = payload.tryOnResults.map((result) => result.taskId)
  const tasks = taskIds.length
    ? await prisma.tryOnTask.findMany({
        where: {
          id: { in: taskIds },
          merchantId: share.result.merchantId,
          merchantSessionId: share.result.merchantSessionId,
          origin: { in: ['STORE_DEMO', 'STORE_PILOT'] },
          status: 'COMPLETED',
          retentionStatus: { not: 'DELETED' },
        },
        select: {
          id: true,
          merchantFrameId: true,
          resultImageUrl: true,
          expiresAt: true,
          merchantFrame: { select: { name: true, sku: true, productUrl: true } },
        },
      })
    : []
  const taskById = new Map(tasks.filter((task) => task.resultImageUrl && (!task.expiresAt || task.expiresAt.getTime() > Date.now())).map((task) => [task.id, task]))
  return {
    expiresAt: share.result.expiresAt.toISOString(),
    merchant: share.result.merchant,
    experience: share.result.experience ? {
      type: share.result.experience.type,
      slug: share.result.experience.slug,
      name: share.result.experience.name,
      deliveryPolicy: resolveExperienceDeliveryPolicy(share.result.experience.deliveryPolicy),
      primaryCta: safeHandoff(share.result.experience.primaryCtaLabel, share.result.experience.primaryCtaType, share.result.experience.primaryCtaUrl),
      secondaryCta: safeHandoff(share.result.experience.secondaryCtaLabel, share.result.experience.secondaryCtaType, share.result.experience.secondaryCtaUrl),
    } : null,
    journey: payload.journey,
    faceFit: payload.faceFit,
    recommendation: payload.recommendation,
    selectedFrameIds: payload.selectedFrameIds,
    favoriteFrameIds: payload.favoriteFrameIds,
    compare: payload.compare,
    tryOnResults: payload.tryOnResults.flatMap((reference) => {
      const task = taskById.get(reference.taskId)
      if (!task?.resultImageUrl || task.merchantFrameId !== reference.frameId) return []
      return [{
        assetRef: decisionResultAssetRef(token, task.id),
        frameId: reference.frameId,
        name: task.merchantFrame?.name ?? null,
        sku: task.merchantFrame?.sku ?? null,
        productUrl: task.merchantFrame?.productUrl ?? null,
        imageUrl: `/api/store/results/${encodeURIComponent(token)}/try-on/${decisionResultAssetRef(token, task.id)}`,
        completedAt: reference.completedAt,
      }]
    }),
  }
}

async function resolveResultAsset(token: string, assetRef: string) {
  const share = await findShare(token)
  if (!share) return null
  const payload = sanitizeDecisionResultPayload(share.result.payload)
  const reference = payload.tryOnResults.find((result) => decisionResultAssetRef(token, result.taskId) === assetRef)
  if (!reference) return null
  const taskId = reference.taskId
  const task = await prisma.tryOnTask.findFirst({
    where: {
      id: taskId,
      merchantId: share.result.merchantId,
      merchantSessionId: share.result.merchantSessionId,
      origin: { in: ['STORE_DEMO', 'STORE_PILOT'] },
      status: 'COMPLETED',
      retentionStatus: { not: 'DELETED' },
    },
    select: { id: true, merchantFrameId: true, resultImageUrl: true, metadata: true, expiresAt: true },
  })
  if (!task?.resultImageUrl || !reference || task.merchantFrameId !== reference.frameId || (task.expiresAt && task.expiresAt.getTime() <= Date.now())) return null
  const metadata = (task.metadata ?? {}) as Record<string, unknown>
  return {
    resultImageUrl: task.resultImageUrl,
    resultPathname: typeof metadata.resultPathname === 'string' ? metadata.resultPathname : null,
    accessMode: metadata.resultAssetAccessMode === 'PUBLIC_TEMPORARY' || metadata.privateBlob === false ? 'PUBLIC_TEMPORARY' as const : 'PRIVATE_SIGNED' as const,
    expiresAt: task.expiresAt,
  }
}

export async function resolveDecisionResultAsset(input: { token: string; assetRef: string }): Promise<{ body: Buffer; contentType: string; expiresAt: Date | null } | null> {
  const access = await resolveResultAsset(input.token, input.assetRef)
  if (!access) return null
  if (isMockMode || access.accessMode === 'PUBLIC_TEMPORARY') {
    const response = await fetch(access.resultImageUrl)
    if (!response.ok) return null
    return { body: Buffer.from(await response.arrayBuffer()), contentType: response.headers.get('content-type') || 'image/png', expiresAt: access.expiresAt }
  }
  const result = await get(access.resultPathname || access.resultImageUrl, { access: 'private' })
  if (!result?.stream) return null
  const reader = result.stream.getReader()
  const chunks: Uint8Array[] = []
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    if (value) chunks.push(value)
  }
  return { body: Buffer.concat(chunks.map((chunk) => Buffer.from(chunk))), contentType: result.blob.contentType || 'image/png', expiresAt: access.expiresAt }
}
