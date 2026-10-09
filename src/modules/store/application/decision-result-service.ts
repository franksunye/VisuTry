import { get } from '@vercel/blob'
import { prisma } from '@/lib/prisma'
import { isMockMode } from '@/lib/mocks'
import { readMockBlob } from '@/lib/mocks/blob'
import { hashSessionCapability } from '../domain/session'
import { sanitizeCatalogImageUrl, sanitizeDecisionResultPayload } from '../domain/decision-result'
import { isSafeCampaignCtaUrl } from '../domain/campaign-readiness'
import { resolveMerchantHandoff } from '../domain/merchant-handoff'
import { resolveExperienceDeliveryPolicy, type ExperienceDeliveryPolicy } from '../domain/delivery-profile'
import { resolveMerchantCommercialCapability } from '../domain/merchant-commercial-capability'
import { isCanonicalVisuTryDemo } from '../domain/prepared-demo-results'
import type { DecisionResultTryOnReference } from '../domain/decision-result'
import { findPreparedDemoAsset } from '../infrastructure/prepared-demo/prepared-result-manifest'
import { readPreparedDemoResultAsset } from '../infrastructure/prepared-demo/prepared-result-asset-store'

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
    merchant: { id: string; slug: string; name: string; status: string; logoUrl: string | null; accentColor: string | null; websiteUrl: string | null; referenceData: boolean; classification: string; pilotType: string; planCode: string | null; commercialStatus: string | null; commercialExceptionCode: string | null }
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

function safeMerchantLogoUrl(value: string | null): string | null {
  if (!value || value.length > 2048 || value.trim() !== value || value.includes('\\') || /[\u0000-\u001f]/.test(value)) return null
  if (value.startsWith('/')) return value.startsWith('//') || value.startsWith('/api/') ? null : value
  try {
    const url = new URL(value)
    return url.protocol === 'https:' && url.hostname && !url.username && !url.password ? url.toString() : null
  } catch {
    return null
  }
}

function isLocalDecisionResultFixture(metadata: unknown): boolean {
  return typeof metadata === 'object' && metadata !== null && !Array.isArray(metadata) &&
    (metadata as Record<string, unknown>).localDecisionResultE2EFixture === true
}

export function createDecisionResultAssetRef(token: string, reference: DecisionResultTryOnReference): string {
  const sourceIdentity = reference.source === 'LIVE_TRYON'
    ? reference.taskId
    : `PREPARED_DEMO:${reference.sourceRef.assetKey}:${reference.frameId}`
  return hashSessionCapability(`${token}:${sourceIdentity}`).slice(0, 32)
}

function manifestMatchesPreparedReference(reference: Extract<DecisionResultTryOnReference, { source: 'PREPARED_DEMO' }>) {
  const asset = findPreparedDemoAsset(reference.sourceRef.assetKey)
  if (
    !asset ||
    asset.source !== 'PREPARED_DEMO' ||
    asset.provenanceId !== reference.sourceRef.provenanceId ||
    asset.manifestVersion !== reference.sourceRef.manifestVersion ||
    asset.shopperProfileId !== reference.sourceRef.shopperProfileId ||
    asset.shopperProfileVersion !== reference.sourceRef.shopperProfileVersion ||
    !asset.createdAt ||
    !asset.reviewedAt ||
    !asset.provenanceNote.trim() ||
    !asset.rightsUseApproval.trim() ||
    !asset.demoOnly ||
    !asset.notForSale
  ) return null
  return asset
}

async function findShare(token: string): Promise<DecisionResultShareRow | null> {
  if (!validToken(token)) return null
  const share = await prisma.decisionResultShare.findUnique({
    where: { tokenHash: hashSessionCapability(token) },
    include: {
      result: {
        include: {
          merchant: { select: { id: true, slug: true, name: true, status: true, logoUrl: true, accentColor: true, websiteUrl: true, referenceData: true, classification: true, pilotType: true, planCode: true, commercialStatus: true, commercialExceptionCode: true } },
          experience: { select: { id: true, type: true, slug: true, name: true, primaryCtaType: true, primaryCtaLabel: true, primaryCtaUrl: true, secondaryCtaType: true, secondaryCtaLabel: true, secondaryCtaUrl: true, deliveryPolicy: true } },
        },
      },
    },
  })
  if (!share || share.revokedAt || share.expiresAt.getTime() <= Date.now()) return null
  if (share.result.expiresAt.getTime() <= Date.now()) return null
  if (share.result.merchantId !== share.result.merchant.id) return null
  if (share.result.merchant.status !== 'ACTIVE') return null
  if (!resolveMerchantCommercialCapability(share.result.merchant).decisions.DECISION_RESULT.allowed) return null
  return share as DecisionResultShareRow
}

export type DecisionResultView = {
  expiresAt: string
  merchant: { name: string; slug: string; logoUrl: string | null; accentColor: string | null; websiteUrl: string | null; referenceData: boolean }
  experience: { type: 'STORE' | 'CAMPAIGN'; slug: string; name: string; primaryCta: ReturnType<typeof resolveMerchantHandoff>; secondaryCta: ReturnType<typeof resolveMerchantHandoff>; deliveryPolicy: ExperienceDeliveryPolicy } | null
  journey: ReturnType<typeof sanitizeDecisionResultPayload>['journey']
  faceFit: ReturnType<typeof sanitizeDecisionResultPayload>['faceFit']
  recommendation: ReturnType<typeof sanitizeDecisionResultPayload>['recommendation']
  selectedFrameIds: string[]
  favoriteFrameIds: string[]
  compare: ReturnType<typeof sanitizeDecisionResultPayload>['compare']
  compareFrames: Array<{ frameId: string; name: string; imageUrl: string | null; productUrl: string | null }>
  tryOnResults: Array<{
    assetRef: string
    source: 'LIVE_TRYON' | 'PREPARED_DEMO'
    disclosure: 'PREPARED_DEMO' | 'LOCAL_QA_FIXTURE' | null
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
  const liveReferences = payload.tryOnResults.filter((result) => result.source === 'LIVE_TRYON')
  const taskIds = liveReferences.map((result) => result.taskId)
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
          metadata: true,
          merchantFrame: { select: { name: true, sku: true, productUrl: true } },
        },
      })
    : []
  const taskById = new Map(tasks.filter((task) => task.resultImageUrl && (!task.expiresAt || task.expiresAt.getTime() > Date.now())).map((task) => [task.id, task]))
  const tryOnResults = (await Promise.all(payload.tryOnResults.map(async (reference) => {
    if (reference.source === 'LIVE_TRYON') {
      const task = taskById.get(reference.taskId)
      if (!task?.resultImageUrl || task.merchantFrameId !== reference.frameId) return null
      const assetRef = createDecisionResultAssetRef(token, reference)
      return {
        assetRef,
        source: 'LIVE_TRYON' as const,
        disclosure: isLocalDecisionResultFixture(task.metadata) ? 'LOCAL_QA_FIXTURE' as const : null,
        frameId: reference.frameId,
        name: task.merchantFrame?.name ?? null,
        sku: task.merchantFrame?.sku ?? null,
        productUrl: task.merchantFrame?.productUrl ?? null,
        imageUrl: `/api/store/results/${encodeURIComponent(token)}/try-on/${assetRef}`,
        completedAt: reference.completedAt,
      }
    }

    if (!isCanonicalVisuTryDemo(share.result.merchant)) return null
    const asset = manifestMatchesPreparedReference(reference)
    if (!asset) return null
    const frame = await prisma.merchantFrame.findFirst({
      where: {
        id: reference.frameId,
        merchantId: share.result.merchantId,
        sku: asset.frameSku,
        status: 'ACTIVE',
      },
      select: { name: true, sku: true, productUrl: true },
    })
    if (!frame || !await readPreparedDemoResultAsset(asset)) return null
    const assetRef = createDecisionResultAssetRef(token, reference)
    return {
      assetRef,
      source: 'PREPARED_DEMO' as const,
      disclosure: asset.assetClass === 'LOCAL_QA_FIXTURE' ? 'LOCAL_QA_FIXTURE' as const : 'PREPARED_DEMO' as const,
      frameId: reference.frameId,
      name: frame.name,
      sku: frame.sku,
      productUrl: frame.productUrl,
      imageUrl: `/api/store/results/${encodeURIComponent(token)}/try-on/${assetRef}`,
      completedAt: reference.presentedAt,
    }
  }))).filter((item): item is NonNullable<typeof item> => item !== null)
  const comparedIds = payload.compare?.frameIds ?? []
  const comparedRows = comparedIds.length ? await prisma.merchantFrame.findMany({
    where: { id: { in: comparedIds }, merchantId: share.result.merchantId, status: 'ACTIVE' },
    select: { id: true, name: true, imageUrl: true, productUrl: true },
  }) : []
  const comparedRowsById = new Map(comparedRows.map((frame) => [frame.id, frame]))
  const recommendedById = new Map(payload.recommendation?.frames.map((frame) => [frame.frameId, frame]) ?? [])
  const compareFrames = comparedIds.flatMap((frameId) => {
    const snapshot = recommendedById.get(frameId)
    const current = comparedRowsById.get(frameId)
    if (!snapshot && !current) return []
    const productUrl = snapshot?.productUrl ?? current?.productUrl ?? null
    return [{
      frameId,
      name: snapshot?.name ?? current?.name ?? 'Compared frame',
      imageUrl: snapshot?.imageUrl ?? sanitizeCatalogImageUrl(current?.imageUrl),
      productUrl: productUrl && isSafeCampaignCtaUrl(productUrl) ? productUrl : null,
    }]
  })
  return {
    expiresAt: share.result.expiresAt.toISOString(),
    merchant: {
      name: share.result.merchant.name,
      slug: share.result.merchant.slug,
      logoUrl: safeMerchantLogoUrl(share.result.merchant.logoUrl),
      accentColor: share.result.merchant.accentColor,
      websiteUrl: share.result.merchant.websiteUrl,
      referenceData: share.result.merchant.referenceData,
    },
    experience: share.result.experience ? {
      type: share.result.experience.type,
      slug: share.result.experience.slug,
      name: share.result.experience.name,
      deliveryPolicy: resolveExperienceDeliveryPolicy(share.result.experience.deliveryPolicy),
      primaryCta: resolveMerchantHandoff({ type: share.result.experience.primaryCtaType, label: share.result.experience.primaryCtaLabel, url: share.result.experience.primaryCtaUrl }),
      secondaryCta: resolveMerchantHandoff({ type: share.result.experience.secondaryCtaType, label: share.result.experience.secondaryCtaLabel, url: share.result.experience.secondaryCtaUrl }),
    } : null,
    journey: payload.journey,
    faceFit: payload.faceFit,
    recommendation: payload.recommendation,
    selectedFrameIds: payload.selectedFrameIds,
    favoriteFrameIds: payload.favoriteFrameIds,
    compare: payload.compare,
    compareFrames,
    tryOnResults,
  }
}

async function resolveResultAsset(token: string, assetRef: string) {
  const share = await findShare(token)
  if (!share) return null
  const payload = sanitizeDecisionResultPayload(share.result.payload)
  const reference = payload.tryOnResults.find((result) => createDecisionResultAssetRef(token, result) === assetRef)
  if (!reference) return null
  if (reference.source === 'PREPARED_DEMO') {
    if (!isCanonicalVisuTryDemo(share.result.merchant)) return null
    const asset = manifestMatchesPreparedReference(reference)
    if (!asset) return null
    const frame = await prisma.merchantFrame.findFirst({
      where: {
        id: reference.frameId,
        merchantId: share.result.merchantId,
        sku: asset.frameSku,
        status: 'ACTIVE',
      },
      select: { id: true },
    })
    if (!frame) return null
    const preparedBytes = await readPreparedDemoResultAsset(asset)
    if (!preparedBytes) return null
    return {
      source: 'PREPARED_DEMO' as const,
      body: preparedBytes.body,
      contentType: preparedBytes.contentType,
      expiresAt: share.result.expiresAt,
    }
  }

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
    source: 'LIVE_TRYON' as const,
    resultImageUrl: task.resultImageUrl,
    resultPathname: typeof metadata.resultPathname === 'string' ? metadata.resultPathname : null,
    accessMode: metadata.resultAssetAccessMode === 'PUBLIC_TEMPORARY' || metadata.privateBlob === false ? 'PUBLIC_TEMPORARY' as const : 'PRIVATE_SIGNED' as const,
    expiresAt: task.expiresAt,
  }
}

export async function resolveDecisionResultAsset(input: { token: string; assetRef: string }): Promise<{ body: Buffer; contentType: string; expiresAt: Date | null } | null> {
  const access = await resolveResultAsset(input.token, input.assetRef)
  if (!access) return null
  if (access.source === 'PREPARED_DEMO') {
    return { body: access.body, contentType: access.contentType, expiresAt: access.expiresAt }
  }
  if (isMockMode) {
    const local = await readMockBlob(access.resultPathname || access.resultImageUrl)
    if (!local) return null
    return { ...local, expiresAt: access.expiresAt }
  }
  if (access.accessMode === 'PUBLIC_TEMPORARY') {
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
