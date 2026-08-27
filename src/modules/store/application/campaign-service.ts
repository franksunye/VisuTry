import { Prisma, type Experience, type MerchantFrame } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { validateCatalogFrame } from '@/modules/merchant/application/merchant-onboarding'
import { resolveCampaignConversionPolicy, isCampaignGate, isCampaignObjective, isPresentationMode, type CampaignGate, type CampaignObjective } from '../domain/campaign-policy'
import {
  assertCampaignPublishable,
  CampaignServiceError,
  evaluateCampaignReadiness,
  isSafeCampaignCtaUrl,
} from '../domain/campaign-readiness'
import { resolvePresentationMode, type PresentationMode } from '../domain/presentation-mode'
import { MerchantAccessError } from '@/modules/merchant/application/merchant-access'
import { withPublicDiscoveryInvalidation } from './public-discovery-invalidation'

export { CampaignServiceError }

const MAX_CAMPAIGN_FRAMES = 100

export type CampaignReadModel = {
  id: string
  merchantId: string
  slug: string
  name: string
  status: Experience['status']
  objective: CampaignObjective
  gate: CampaignGate
  presentationMode: PresentationMode
  headline: string | null
  description: string | null
  primaryCtaType: string | null
  primaryCtaLabel: string | null
  primaryCtaUrl: string | null
  secondaryCtaType: string | null
  secondaryCtaLabel: string | null
  secondaryCtaUrl: string | null
  startAt: Date | null
  endAt: Date | null
  frameIds: string[]
  frameCount: number
  referenceData: boolean
  publicPath: string
  readiness: { ready: boolean; blockingIssues: string[]; warnings: string[] }
}

type CampaignFrame = {
  merchantFrameId: string
  merchantFrame: Pick<MerchantFrame, 'id' | 'sku' | 'externalId' | 'productUrl' | 'name' | 'imageUrl' | 'shape' | 'widthClass' | 'source' | 'enrichmentStatus' | 'status'> | null
}

type CampaignRow = Experience & { frames: CampaignFrame[] }

const campaignFramesInclude = {
  frames: {
    where: { active: true },
    orderBy: [{ sortOrder: 'asc' as const }, { createdAt: 'asc' as const }],
    include: {
      merchantFrame: {
        select: { id: true, sku: true, externalId: true, productUrl: true, name: true, imageUrl: true, shape: true, widthClass: true, source: true, enrichmentStatus: true, status: true },
      },
    },
  },
}

function slugify(value: string): string {
  const slug = value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
  return slug || 'campaign'
}

const safeCtaUrl = isSafeCampaignCtaUrl

function parseDate(value: string | Date | null | undefined, field: string): Date | null | undefined {
  if (value === undefined) return undefined
  if (value === null || value === '') return null
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) throw new CampaignServiceError('INVALID_REQUEST', `Invalid ${field}.`)
  return date
}

function validateDateRange(startAt: Date | null | undefined, endAt: Date | null | undefined) {
  if (startAt && endAt && startAt >= endAt) throw new CampaignServiceError('INVALID_DATE_RANGE', 'startAt must be earlier than endAt.')
}

function validatePolicy(input: { objective: unknown; gate: unknown; presentationMode: unknown }) {
  if (!isCampaignObjective(input.objective) || !isCampaignGate(input.gate) || !isPresentationMode(input.presentationMode)) {
    throw new CampaignServiceError('INVALID_CAMPAIGN_POLICY', 'Campaign objective, gate, and presentation mode must use supported values.')
  }
}

function mapCampaign(row: CampaignRow, merchantSlug: string, merchantReferenceData: boolean): CampaignReadModel {
  const policy = resolveCampaignConversionPolicy(row)
  if (!policy) throw new CampaignServiceError('INVALID_REQUEST', 'Experience is not a Campaign.')
  const presentationMode = resolvePresentationMode({ experienceType: 'CAMPAIGN', persistedPresentationMode: row.presentationMode })
  const frameChecks = row.frames.map((frame) => frame.merchantFrame
    ? validateCatalogFrame(frame.merchantFrame)
    : { valid: false, issues: ['FRAME_NOT_FOUND'], warnings: [] })
  const { ready, blockingIssues, warnings } = evaluateCampaignReadiness({
    name: row.name,
    headline: row.headline,
    status: row.status,
    startAt: row.startAt,
    endAt: row.endAt,
    primaryCtaUrl: row.primaryCtaUrl,
    secondaryCtaUrl: row.secondaryCtaUrl,
    frames: row.frames.map((frame, index) => ({
      status: frame.merchantFrame?.status ?? null,
      valid: frameChecks[index].valid,
    })),
  })
  return {
    id: row.id,
    merchantId: row.merchantId,
    slug: row.slug,
    name: row.name,
    status: row.status,
    objective: policy.objective,
    gate: policy.gate,
    presentationMode,
    headline: row.headline,
    description: row.description,
    primaryCtaType: row.primaryCtaType,
    primaryCtaLabel: row.primaryCtaLabel,
    primaryCtaUrl: row.primaryCtaUrl,
    secondaryCtaType: row.secondaryCtaType,
    secondaryCtaLabel: row.secondaryCtaLabel,
    secondaryCtaUrl: row.secondaryCtaUrl,
    startAt: row.startAt,
    endAt: row.endAt,
    frameIds: row.frames.map((frame) => frame.merchantFrameId),
    frameCount: row.frames.length,
    referenceData: merchantReferenceData || row.referenceData,
    publicPath: `/en/c/${merchantSlug}/${row.slug}`,
    readiness: { ready, blockingIssues, warnings },
  }
}

async function campaignRow(merchantId: string, campaignId: string) {
  const row = await prisma.experience.findFirst({
    where: { id: campaignId, merchantId, type: 'CAMPAIGN' },
    include: campaignFramesInclude,
  })
  if (!row) throw new MerchantAccessError()
  const merchant = await prisma.merchant.findUnique({ where: { id: merchantId }, select: { slug: true, referenceData: true } })
  if (!merchant) throw new MerchantAccessError()
  return { row, merchant }
}

export async function listCampaigns(input: { merchantId: string; cursor?: string; limit?: number }) {
  const limit = Math.min(Math.max(input.limit ?? 50, 1), 100)
  const merchant = await prisma.merchant.findUnique({ where: { id: input.merchantId }, select: { slug: true, referenceData: true } })
  if (!merchant) throw new MerchantAccessError()
  const rows = await prisma.experience.findMany({
    where: { merchantId: input.merchantId, type: 'CAMPAIGN' },
    orderBy: { id: 'asc' },
    ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
    take: limit + 1,
    include: campaignFramesInclude,
  })
  const page = rows.slice(0, limit).map((row) => mapCampaign(row, merchant.slug, merchant.referenceData))
  return { items: page, nextCursor: rows.length > limit ? page.at(-1)?.id ?? null : null }
}

export async function getCampaign(input: { merchantId: string; campaignId: string }) {
  const { row, merchant } = await campaignRow(input.merchantId, input.campaignId)
  return mapCampaign(row, merchant.slug, merchant.referenceData)
}

export async function createCampaignDraft(input: {
  merchantId: string
  name: string
  slug?: string | null
  headline?: string | null
  description?: string | null
  objective?: CampaignObjective
  gate?: CampaignGate
  presentationMode?: PresentationMode
  startAt?: string | null
  endAt?: string | null
  primaryCtaType?: string | null
  primaryCtaLabel?: string | null
  primaryCtaUrl?: string | null
  secondaryCtaType?: string | null
  secondaryCtaLabel?: string | null
  secondaryCtaUrl?: string | null
}) {
  const name = input.name.trim()
  if (!name) throw new CampaignServiceError('INVALID_REQUEST', 'Campaign name is required.')
  const objective = input.objective ?? 'INTENT'
  const gate = input.gate ?? 'NONE'
  const presentationMode = input.presentationMode ?? 'EDITORIAL_FIRST'
  validatePolicy({ objective, gate, presentationMode })
  const startAt = parseDate(input.startAt, 'startAt') ?? null
  const endAt = parseDate(input.endAt, 'endAt') ?? null
  validateDateRange(startAt, endAt)
  for (const [field, url] of [['primaryCtaUrl', input.primaryCtaUrl], ['secondaryCtaUrl', input.secondaryCtaUrl]] as const) {
    if (!safeCtaUrl(url)) throw new CampaignServiceError('INVALID_REQUEST', `${field} must be an https URL or internal path.`)
  }
  const merchant = await prisma.merchant.findUnique({ where: { id: input.merchantId }, select: { slug: true, referenceData: true } })
  if (!merchant) throw new MerchantAccessError()
  const requestedSlug = slugify(input.slug || name)
  const existing = await prisma.experience.findFirst({ where: { merchantId: input.merchantId, slug: requestedSlug } })
  if (existing) {
    const compatible = existing.type === 'CAMPAIGN'
      && existing.status === 'DRAFT'
      && existing.name === name
      && (existing.campaignObjective ?? 'INTENT') === objective
      && (existing.campaignGate ?? 'NONE') === gate
      && (existing.presentationMode ?? 'EDITORIAL_FIRST') === presentationMode
      && existing.headline === (input.headline?.trim() || null)
      && existing.description === (input.description?.trim() || null)
      && existing.startAt?.getTime() === startAt?.getTime()
      && existing.endAt?.getTime() === endAt?.getTime()
      && existing.primaryCtaType === (input.primaryCtaType?.trim() || null)
      && existing.primaryCtaLabel === (input.primaryCtaLabel?.trim() || null)
      && existing.primaryCtaUrl === (input.primaryCtaUrl?.trim() || null)
      && existing.secondaryCtaType === (input.secondaryCtaType?.trim() || null)
      && existing.secondaryCtaLabel === (input.secondaryCtaLabel?.trim() || null)
      && existing.secondaryCtaUrl === (input.secondaryCtaUrl?.trim() || null)
    if (compatible) return mapCampaign(await campaignRow(input.merchantId, existing.id).then((result) => result.row), merchant.slug, merchant.referenceData)
    throw new CampaignServiceError('CAMPAIGN_SLUG_CONFLICT', 'A Campaign already uses this slug.', 409)
  }
  const created = await withPublicDiscoveryInvalidation({
    target: { kind: 'experience', merchantSlug: merchant.slug, experienceSlug: requestedSlug },
    mutation: () => prisma.experience.create({
      data: { merchantId: input.merchantId, type: 'CAMPAIGN', slug: requestedSlug, name, status: 'DRAFT', headline: input.headline?.trim() || null, description: input.description?.trim() || null, campaignObjective: objective, campaignGate: gate, presentationMode, startAt, endAt, primaryCtaType: input.primaryCtaType?.trim() || null, primaryCtaLabel: input.primaryCtaLabel?.trim() || null, primaryCtaUrl: input.primaryCtaUrl?.trim() || null, secondaryCtaType: input.secondaryCtaType?.trim() || null, secondaryCtaLabel: input.secondaryCtaLabel?.trim() || null, secondaryCtaUrl: input.secondaryCtaUrl?.trim() || null },
      include: campaignFramesInclude,
    }),
  })
  return mapCampaign(created, merchant.slug, merchant.referenceData)
}

export async function updateCampaign(input: {
  merchantId: string
  campaignId: string
  name?: string
  headline?: string | null
  description?: string | null
  objective?: CampaignObjective
  gate?: CampaignGate
  presentationMode?: PresentationMode
  startAt?: string | null
  endAt?: string | null
  primaryCtaType?: string | null
  primaryCtaLabel?: string | null
  primaryCtaUrl?: string | null
  secondaryCtaType?: string | null
  secondaryCtaLabel?: string | null
  secondaryCtaUrl?: string | null
}) {
  const current = await campaignRow(input.merchantId, input.campaignId)
  const objective = input.objective ?? current.row.campaignObjective ?? 'INTENT'
  const gate = input.gate ?? current.row.campaignGate ?? 'NONE'
  const presentationMode = input.presentationMode ?? current.row.presentationMode ?? 'EDITORIAL_FIRST'
  validatePolicy({ objective, gate, presentationMode })
  const startAt = parseDate(input.startAt, 'startAt')
  const endAt = parseDate(input.endAt, 'endAt')
  validateDateRange(startAt === undefined ? current.row.startAt : startAt, endAt === undefined ? current.row.endAt : endAt)
  for (const url of [input.primaryCtaUrl, input.secondaryCtaUrl]) if (!safeCtaUrl(url)) throw new CampaignServiceError('INVALID_REQUEST', 'CTA URL must be an https URL or internal path.')
  const data: Prisma.ExperienceUpdateInput = { campaignObjective: objective, campaignGate: gate, presentationMode }
  if (input.name !== undefined) { if (!input.name.trim()) throw new CampaignServiceError('INVALID_REQUEST', 'Campaign name is required.'); data.name = input.name.trim() }
  for (const field of ['headline', 'description', 'primaryCtaType', 'primaryCtaLabel', 'primaryCtaUrl', 'secondaryCtaType', 'secondaryCtaLabel', 'secondaryCtaUrl'] as const) if (input[field] !== undefined) data[field] = typeof input[field] === 'string' ? input[field].trim() : input[field]
  if (startAt !== undefined) data.startAt = startAt
  if (endAt !== undefined) data.endAt = endAt
  const updated = await withPublicDiscoveryInvalidation({
    target: { kind: 'experience', merchantSlug: current.merchant.slug, experienceSlug: current.row.slug },
    mutation: () => prisma.experience.update({ where: { id: current.row.id }, data, include: campaignFramesInclude }),
  })
  return mapCampaign(updated, current.merchant.slug, current.merchant.referenceData)
}

export async function setCampaignFrames(input: { merchantId: string; campaignId: string; frameIds: string[] }) {
  if (input.frameIds.length > MAX_CAMPAIGN_FRAMES) throw new CampaignServiceError('INVALID_REQUEST', `frameIds cannot exceed ${MAX_CAMPAIGN_FRAMES}.`)
  const frameIds = [...new Set(input.frameIds)]
  const current = await campaignRow(input.merchantId, input.campaignId)
  const frames = await prisma.merchantFrame.findMany({
    where: { merchantId: input.merchantId, id: { in: frameIds }, status: 'ACTIVE' },
    select: { id: true, sku: true, externalId: true, productUrl: true, name: true, imageUrl: true, shape: true, widthClass: true, source: true, enrichmentStatus: true, status: true },
  })
  if (frames.length !== frameIds.length || frames.some((frame) => !validateCatalogFrame(frame).valid)) throw new MerchantAccessError()
  await withPublicDiscoveryInvalidation({
    target: { kind: 'experience', merchantSlug: current.merchant.slug, experienceSlug: current.row.slug },
    mutation: () => prisma.$transaction(async (tx) => {
      await tx.experienceFrame.deleteMany({ where: { experienceId: input.campaignId, merchantId: input.merchantId } })
      if (frameIds.length) await tx.experienceFrame.createMany({ data: frameIds.map((merchantFrameId, sortOrder) => ({ experienceId: input.campaignId, merchantId: input.merchantId, merchantFrameId, sortOrder, active: true })) })
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }),
  })
  return { frameIds }
}

export async function previewCampaign(input: { merchantId: string; campaignId: string }) {
  return getCampaign(input)
}

export async function publishCampaign(input: { merchantId: string; campaignId: string; approved: boolean }) {
  if (!input.approved) throw new CampaignServiceError('PUBLISH_APPROVAL_REQUIRED', 'Publishing requires explicit approval.')
  const current = await campaignRow(input.merchantId, input.campaignId)
  const model = mapCampaign(current.row, current.merchant.slug, current.merchant.referenceData)
  assertCampaignPublishable(model.readiness, true)
  if (current.row.status === 'ACTIVE') return model
  const updated = await withPublicDiscoveryInvalidation({
    target: { kind: 'experience', merchantSlug: current.merchant.slug, experienceSlug: current.row.slug },
    mutation: () => prisma.experience.update({ where: { id: current.row.id }, data: { status: 'ACTIVE' }, include: campaignFramesInclude }),
  })
  return mapCampaign(updated, current.merchant.slug, current.merchant.referenceData)
}

export async function archiveCampaign(input: { merchantId: string; campaignId: string }) {
  const current = await campaignRow(input.merchantId, input.campaignId)
  const updated = await withPublicDiscoveryInvalidation({
    target: { kind: 'experience', merchantSlug: current.merchant.slug, experienceSlug: current.row.slug },
    mutation: () => prisma.experience.update({ where: { id: current.row.id }, data: { status: 'ARCHIVED' }, include: campaignFramesInclude }),
  })
  return mapCampaign(updated, current.merchant.slug, current.merchant.referenceData)
}
