import { prisma } from '@/lib/prisma'
import { resolveCampaignConversionPolicy } from '@/modules/store/domain/campaign-policy'
import { resolvePresentationMode, type PresentationMode } from '@/modules/store/domain/presentation-mode'
import { validateCatalogFrame } from './merchant-onboarding-cloudflare'
import { getMerchantCommerceIntelligence, type MerchantCommerceIntelligence } from './merchant-commerce-intelligence'

export type { MerchantCommerceIntelligence }

export type MerchantCatalogFrameSummary = {
  id: string
  sku: string | null
  name: string
  brand: string | null
  imageUrl: string | null
  source: string
  status: string
  enrichmentStatus: string
  validation: { valid: boolean; issues: string[]; warnings: string[] }
}

export type MerchantCatalogSummary = {
  total: number
  active: number
  valid: number
  invalid: number
  sourceCounts: Array<{ source: string; count: number }>
}

export type MerchantControlExperience = {
  id: string
  type: 'STORE' | 'CAMPAIGN'
  name: string
  slug: string
  status: string
  frameCount: number
  referenceData: boolean
  publicPath: string
  headline: string | null
  description: string | null
  primaryCtaLabel: string | null
  startAt: string | null
  endAt: string | null
  selectedFrames: MerchantCatalogFrameSummary[]
  readiness: { status: 'VALID' | 'NEEDS_ATTENTION' | 'INCOMPLETE'; validCount: number; invalidCount: number; issues: string[] }
  lastOperation: { label: string; actor: string; at: string } | null
  policy: {
    objective: 'TRAFFIC' | 'INTENT' | 'LEAD' | null
    gate: 'NONE' | 'OPT_IN_AFTER_VALUE' | 'OPT_IN_BEFORE_AI' | null
    presentation: PresentationMode
  }
  updatedAt: string
}

export type MerchantControlCenter = {
  merchant: { id: string; slug: string; name: string; websiteUrl: string | null; status: string; referenceData: boolean }
  store: MerchantControlExperience | null
  catalog: MerchantCatalogSummary
  experiences: MerchantControlExperience[]
  activeCampaignCount: number
  shopperActivityAvailable: boolean
  credentialUsage: { active: number }
  commerceIntelligence?: MerchantCommerceIntelligence
}

type LocalFrame = { id: string; sku: string | null; name: string; brand: string | null; imageUrl: string | null; shape: string; widthClass: string | null; source: string; status: string; enrichmentStatus: string }

function mapLocalFrame(frame: LocalFrame): MerchantCatalogFrameSummary {
  return { ...frame, validation: validateCatalogFrame(frame) }
}

function mapLocalOperation(action: string, actorType: string, createdAt: Date) {
  const labels: Record<string, string> = { 'store.created': 'Created', 'campaign.created': 'Created', 'store.frames_updated': 'Catalog updated', 'campaign.frames_updated': 'Catalog updated', 'store.published': 'Published', 'campaign.published': 'Published', 'campaign.updated': 'Updated' }
  const label = labels[action]
  if (!label) return null
  return { label, actor: actorType === 'HUMAN' ? 'Human' : actorType === 'AGENT' ? 'Agent' : 'System', at: createdAt.toISOString() }
}

function localReadiness(frames: MerchantCatalogFrameSummary[]): MerchantControlExperience['readiness'] {
  if (frames.length === 0) return { status: 'INCOMPLETE', validCount: 0, invalidCount: 0, issues: ['NO_SELECTED_FRAMES'] }
  const validCount = frames.filter((frame) => frame.validation.valid).length
  const issues = [...new Set(frames.flatMap((frame) => [...frame.validation.issues, ...frame.validation.warnings]))]
  return { status: validCount === frames.length ? 'VALID' : 'NEEDS_ATTENTION', validCount, invalidCount: frames.length - validCount, issues }
}

export async function getMerchantControlCenter(input: { merchantId: string }): Promise<MerchantControlCenter | null> {
  const merchant = await prisma.merchant.findUnique({
    where: { id: input.merchantId },
    select: { id: true, slug: true, name: true, websiteUrl: true, status: true, referenceData: true },
  })
  if (!merchant) return null

  const [experiences, shopperSessions, activeCredentials, catalogFrames, commerceIntelligence] = await Promise.all([
    prisma.experience.findMany({
      where: { merchantId: merchant.id },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true, type: true, name: true, slug: true, status: true,
        headline: true, description: true, primaryCtaLabel: true, startAt: true, endAt: true,
        campaignObjective: true, campaignGate: true, presentationMode: true,
        referenceData: true, updatedAt: true,
        frames: { where: { active: true }, orderBy: { sortOrder: 'asc' }, select: { merchantFrameId: true, merchantFrame: { select: { id: true, sku: true, name: true, brand: true, imageUrl: true, shape: true, widthClass: true, source: true, status: true, enrichmentStatus: true } } } },
      },
    }),
    prisma.merchantSession.count({ where: { merchantId: merchant.id } }),
    prisma.merchantAgentCredential.count({ where: { merchantId: merchant.id, status: 'ACTIVE' } }),
    prisma.merchantFrame.findMany({ where: { merchantId: merchant.id }, orderBy: { name: 'asc' }, select: { id: true, sku: true, name: true, brand: true, imageUrl: true, shape: true, widthClass: true, source: true, status: true, enrichmentStatus: true } }),
    getMerchantCommerceIntelligence({ merchantId: merchant.id }),
  ])

  const operationRows = await prisma.merchantOperationAudit.findMany({ where: { merchantId: merchant.id, resourceType: 'Experience' }, orderBy: { createdAt: 'desc' }, select: { resourceId: true, action: true, actorType: true, createdAt: true } })
  const latestOperations = new Map<string, { label: string; actor: string; at: string }>()
  for (const row of operationRows) {
    if (!row.resourceId || latestOperations.has(row.resourceId)) continue
    const operation = mapLocalOperation(row.action, row.actorType, row.createdAt)
    if (operation) latestOperations.set(row.resourceId, operation)
  }
  const mapFrame = (frame: LocalFrame) => mapLocalFrame(frame)
  const catalogMapped = (catalogFrames as unknown as LocalFrame[]).map(mapFrame)
  const sourceCounts = new Map<string, number>()
  for (const frame of catalogMapped) sourceCounts.set(frame.source, (sourceCounts.get(frame.source) ?? 0) + 1)

  const mapped = experiences.map((experience): MerchantControlExperience => {
    const campaignPolicy = resolveCampaignConversionPolicy(experience)
    const selectedFrames = experience.frames.map((frame) => mapFrame(frame.merchantFrame as unknown as LocalFrame))
    return {
      id: experience.id,
      type: experience.type,
      name: experience.name,
      slug: experience.slug,
      status: experience.status,
      frameCount: experience.frames.length,
      referenceData: merchant.referenceData || experience.referenceData,
      publicPath: experience.type === 'STORE' ? `/en/store/${merchant.slug}` : `/en/c/${merchant.slug}/${experience.slug}`,
      headline: experience.headline ?? null,
      description: experience.description ?? null,
      primaryCtaLabel: experience.primaryCtaLabel ?? null,
      startAt: experience.startAt?.toISOString() ?? null,
      endAt: experience.endAt?.toISOString() ?? null,
      selectedFrames,
      readiness: localReadiness(selectedFrames),
      lastOperation: latestOperations.get(experience.id) ?? null,
      policy: {
        objective: campaignPolicy?.objective ?? null,
        gate: campaignPolicy?.gate ?? null,
        presentation: resolvePresentationMode({ experienceType: experience.type, persistedPresentationMode: experience.presentationMode }),
      },
      updatedAt: experience.updatedAt.toISOString(),
    }
  })

  return {
    merchant,
    store: mapped.find((experience) => experience.type === 'STORE') ?? null,
    catalog: {
      total: catalogMapped.length,
      active: catalogMapped.filter((frame) => frame.status === 'ACTIVE').length,
      valid: catalogMapped.filter((frame) => frame.validation.valid).length,
      invalid: catalogMapped.filter((frame) => !frame.validation.valid).length,
      sourceCounts: [...sourceCounts.entries()].sort(([left], [right]) => left.localeCompare(right)).map(([source, count]) => ({ source, count })),
    },
    experiences: mapped,
    activeCampaignCount: mapped.filter((experience) => experience.type === 'CAMPAIGN' && experience.status === 'ACTIVE').length,
    shopperActivityAvailable: commerceIntelligence.hasActivity || shopperSessions > 0,
    credentialUsage: { active: activeCredentials },
    commerceIntelligence,
  }
}
