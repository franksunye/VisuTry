import { prisma } from '@/lib/prisma'
import { resolveCampaignConversionPolicy } from '@/modules/store/domain/campaign-policy'
import { resolvePresentationMode, type PresentationMode } from '@/modules/store/domain/presentation-mode'
import type { MerchantDistributionReport } from '@/modules/store/domain/merchant-distribution-report'

export type MerchantControlExperience = {
  id: string
  type: 'STORE' | 'CAMPAIGN'
  name: string
  slug: string
  status: string
  frameCount: number
  referenceData: boolean
  publicPath: string
  policy: {
    objective: 'TRAFFIC' | 'INTENT' | 'LEAD' | null
    gate: 'NONE' | 'OPT_IN_AFTER_VALUE' | 'OPT_IN_BEFORE_AI' | null
    presentation: PresentationMode
  }
  updatedAt: string
}

export type MerchantCommerceIntelligence = {
  period: { from: string; to: string; timezone: 'UTC' }
  hasActivity: boolean
  totals: {
    visitors: number
    engagedShoppers: number
    recommendationActivity: number
    tryOnCompletions: number
    compareActivity: number
    productClicks: number
    highIntentShoppers: number
  }
  rates: { engagement: number | null; recommendation: number | null; tryOn: number | null; compare: number | null }
  acquisitionSources: Array<{ source: string; visitors: number }>
  distributionReport?: MerchantDistributionReport
  experiences: Array<{
    id: string
    type: 'STORE' | 'CAMPAIGN'
    name: string
    status: string
    referenceData: boolean
    visitors: number
    engagedShoppers: number
    recommendationActivity: number
    tryOnCompletions: number
    compareActivity: number
    productClicks: number
    highIntentShoppers: number
  }>
}

export type MerchantControlCenter = {
  merchant: { id: string; slug: string; name: string; websiteUrl: string | null; status: string; referenceData: boolean }
  store: MerchantControlExperience | null
  experiences: MerchantControlExperience[]
  activeCampaignCount: number
  shopperActivityAvailable: boolean
  credentialUsage: { active: number }
  commerceIntelligence?: MerchantCommerceIntelligence
}

export async function getMerchantControlCenter(input: { merchantId: string }): Promise<MerchantControlCenter | null> {
  const merchant = await prisma.merchant.findUnique({
    where: { id: input.merchantId },
    select: { id: true, slug: true, name: true, websiteUrl: true, status: true, referenceData: true },
  })
  if (!merchant) return null

  const [experiences, shopperSessions, activeCredentials] = await Promise.all([
    prisma.experience.findMany({
      where: { merchantId: merchant.id },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true, type: true, name: true, slug: true, status: true,
        campaignObjective: true, campaignGate: true, presentationMode: true,
        referenceData: true, updatedAt: true,
        frames: { where: { active: true }, select: { merchantFrameId: true } },
      },
    }),
    prisma.merchantSession.count({ where: { merchantId: merchant.id } }),
    prisma.merchantAgentCredential.count({ where: { merchantId: merchant.id, status: 'ACTIVE' } }),
  ])

  const mapped = experiences.map((experience): MerchantControlExperience => {
    const campaignPolicy = resolveCampaignConversionPolicy(experience)
    return {
      id: experience.id,
      type: experience.type,
      name: experience.name,
      slug: experience.slug,
      status: experience.status,
      frameCount: experience.frames.length,
      referenceData: merchant.referenceData || experience.referenceData,
      publicPath: experience.type === 'STORE' ? `/en/store/${merchant.slug}` : `/en/c/${merchant.slug}/${experience.slug}`,
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
    experiences: mapped,
    activeCampaignCount: mapped.filter((experience) => experience.type === 'CAMPAIGN' && experience.status === 'ACTIVE').length,
    shopperActivityAvailable: shopperSessions > 0,
    credentialUsage: { active: activeCredentials },
  }
}
