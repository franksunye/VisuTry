import { prisma } from '@/lib/prisma'
import { getMerchantCommerceIntelligence, type MerchantCommerceIntelligence } from './merchant-commerce-intelligence'
import { commercialStateForPresentation, getMerchantCommercialState } from './merchant-commercial-entitlements'
import type { MerchantCommercialPresentation, MerchantControlExperience, MerchantCatalogFrameSummary } from './merchant-control-center'
import { resolveCampaignConversionPolicy } from '@/modules/store/domain/campaign-policy'
import { campaignReadinessForControlCenter, evaluateCampaignReadiness } from '@/modules/store/domain/campaign-readiness'
import { resolvePresentationMode, type PresentationMode } from '@/modules/store/domain/presentation-mode'
import { validateMerchantFrameReadiness } from '../domain/merchant-frame-readiness'
import { resolveMerchantWorkspaceMode } from '../domain/merchant-workspace-mode'

export type MerchantWorkspaceDetailsRead = {
  id: string
  name: string
  websiteUrl: string | null
}

type CampaignFrameRow = {
  id: string
  sku: string | null
  externalId: string | null
  productUrl: string | null
  name: string
  brand: string | null
  imageUrl: string | null
  shape: string
  source: string
  status: string
  enrichmentStatus: string
}

function mapCampaignFrame(frame: CampaignFrameRow): MerchantCatalogFrameSummary {
  return {
    id: frame.id,
    sku: frame.sku,
    externalId: frame.externalId,
    productUrl: frame.productUrl,
    name: frame.name,
    brand: frame.brand,
    imageUrl: frame.imageUrl,
    source: frame.source,
    status: frame.status,
    enrichmentStatus: frame.enrichmentStatus,
    validation: validateMerchantFrameReadiness(frame),
  }
}

function campaignReadiness(frames: MerchantCatalogFrameSummary[], experience: {
  name: string
  headline: string | null
  status: string
  startAt: Date | null
  endAt: Date | null
  primaryCtaUrl: string | null
  secondaryCtaUrl: string | null
}) {
  return campaignReadinessForControlCenter(
    evaluateCampaignReadiness({
      ...experience,
      frames: frames.map((frame) => ({ status: frame.status, valid: frame.validation.valid })),
    }),
    frames,
  )
}

export async function getMerchantWorkspaceMode(input: { merchantId: string }) {
  const [events, activeStore] = await Promise.all([
    prisma.merchantActivationEvent.findMany({
      where: {
        merchantId: input.merchantId,
        eventType: { in: ['merchant_store_previewed', 'merchant_store_published'] },
      },
      orderBy: [{ occurredAt: 'asc' }, { createdAt: 'asc' }],
      select: { eventType: true },
    }),
    prisma.experience.findFirst({
      where: { merchantId: input.merchantId, type: 'STORE', status: 'ACTIVE' },
      select: { id: true },
    }),
  ])

  return resolveMerchantWorkspaceMode({
    hasStorePreviewedEvent: events.some((event) => event.eventType === 'merchant_store_previewed'),
    hasStorePublishedEvent: events.some((event) => event.eventType === 'merchant_store_published'),
    storeStatus: activeStore ? 'ACTIVE' : null,
  })
}

export async function getMerchantCatalogCount(input: { merchantId: string }) {
  return prisma.merchantFrame.count({ where: { merchantId: input.merchantId } })
}

export async function getMerchantCampaignExperiences(input: { merchantId: string }): Promise<MerchantControlExperience[]> {
  const merchant = await prisma.merchant.findUnique({ where: { id: input.merchantId }, select: { id: true, slug: true, referenceData: true } })
  if (!merchant) return []
  const experiences = await prisma.experience.findMany({
    where: { merchantId: merchant.id, type: 'CAMPAIGN' },
    orderBy: { updatedAt: 'desc' },
    select: {
      id: true, type: true, name: true, slug: true, status: true, headline: true, description: true,
      primaryCtaLabel: true, primaryCtaUrl: true, secondaryCtaUrl: true, startAt: true, endAt: true, campaignObjective: true, campaignGate: true,
      presentationMode: true, referenceData: true, updatedAt: true,
      frames: {
        where: { active: true },
        orderBy: { sortOrder: 'asc' },
        select: { merchantFrame: { select: { id: true, sku: true, externalId: true, productUrl: true, name: true, brand: true, imageUrl: true, shape: true, source: true, status: true, enrichmentStatus: true } } },
      },
    },
  })
  return experiences.map((experience) => {
    const selectedFrames = experience.frames.map(({ merchantFrame }) => mapCampaignFrame({ ...merchantFrame, shape: merchantFrame.shape ?? '' }))
    const policy = resolveCampaignConversionPolicy(experience)
    const readiness = campaignReadiness(selectedFrames, {
      name: experience.name,
      headline: experience.headline,
      status: experience.status,
      startAt: experience.startAt,
      endAt: experience.endAt,
      primaryCtaUrl: experience.primaryCtaUrl,
      secondaryCtaUrl: experience.secondaryCtaUrl,
    })
    return {
      id: experience.id,
      type: 'CAMPAIGN',
      name: experience.name,
      slug: experience.slug,
      status: experience.status,
      frameCount: selectedFrames.length,
      referenceData: merchant.referenceData || experience.referenceData,
      publicPath: `/en/c/${merchant.slug}/${experience.slug}`,
      headline: experience.headline,
      description: experience.description,
      primaryCtaLabel: experience.primaryCtaLabel,
      startAt: experience.startAt?.toISOString() ?? null,
      endAt: experience.endAt?.toISOString() ?? null,
      selectedFrames,
      readiness,
      lastOperation: null,
      policy: {
        objective: policy?.objective ?? null,
        gate: policy?.gate ?? null,
        presentation: resolvePresentationMode({ experienceType: 'CAMPAIGN', persistedPresentationMode: experience.presentationMode as PresentationMode | null }),
      },
      updatedAt: experience.updatedAt.toISOString(),
    }
  })
}

export async function getMerchantOperatingAnalytics(input: { merchantId: string }): Promise<MerchantCommerceIntelligence> {
  return getMerchantCommerceIntelligence({ merchantId: input.merchantId })
}

export async function getMerchantOperatingPlan(input: { merchantId: string }): Promise<MerchantCommercialPresentation> {
  return commercialStateForPresentation(await getMerchantCommercialState({ merchantId: input.merchantId }))
}

export async function getMerchantStoreStatus(input: { merchantId: string }): Promise<string | null> {
  const store = await prisma.experience.findFirst({ where: { merchantId: input.merchantId, type: 'STORE' }, select: { status: true } })
  return store?.status ?? null
}

export async function getMerchantWorkspaceDetails(input: { merchantId: string }): Promise<MerchantWorkspaceDetailsRead | null> {
  return prisma.merchant.findUnique({ where: { id: input.merchantId }, select: { id: true, name: true, websiteUrl: true } })
}
