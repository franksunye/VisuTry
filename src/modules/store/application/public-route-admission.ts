import { unstable_cache } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { resolveExperienceSearchVisibility } from '../domain/experience-search-visibility'
import { PUBLIC_DISCOVERY_CACHE } from '@/lib/store-discovery-cache'

export const PUBLIC_MERCHANT_SLUG_MAX_LENGTH = 180
export const PUBLIC_EXPERIENCE_SLUG_MAX_LENGTH = 240

const PUBLIC_ROUTE_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/u

export type PublicRouteAdmission = {
  store: boolean
  campaigns: string[]
}

export type PublicRouteAdmissionIndex = Record<string, PublicRouteAdmission>

type AdmissionExperience = {
  id: string
  type: 'STORE' | 'CAMPAIGN'
  slug: string
  name: string
  status: 'DRAFT' | 'ACTIVE' | 'ENDED' | 'ARCHIVED'
  headline: string | null
  description: string | null
  referenceData: boolean
  updatedAt: Date
  frameCount: number
  hasProductDestination: boolean
}

type AdmissionMerchant = {
  slug: string
  name: string
  status: 'ACTIVE' | 'SUSPENDED' | 'INACTIVE'
  websiteUrl: string | null
  pilotType: string
  referenceData: boolean
  sponsoredUsagePolicyKey: string | null
  experiences: AdmissionExperience[]
}

export function isPublicRouteSlug(
  value: unknown,
  maxLength: number,
): value is string {
  return typeof value === 'string'
    && value.length > 0
    && value.length <= maxLength
    && PUBLIC_ROUTE_SLUG_PATTERN.test(value)
}

export function isPublicMerchantSlug(value: unknown): value is string {
  return isPublicRouteSlug(value, PUBLIC_MERCHANT_SLUG_MAX_LENGTH)
}

export function isPublicExperienceSlug(value: unknown): value is string {
  return isPublicRouteSlug(value, PUBLIC_EXPERIENCE_SLUG_MAX_LENGTH)
}

function isRoutableExperience(merchant: AdmissionMerchant, experience: AdmissionExperience): boolean {
  return resolveExperienceSearchVisibility({
    merchant,
    experience,
    frames: [],
    frameCount: experience.frameCount,
    hasProductDestination: experience.hasProductDestination,
  }) !== 'PRIVATE'
}

function latestExperience(experiences: AdmissionExperience[]): AdmissionExperience | null {
  return experiences.reduce<AdmissionExperience | null>(
    (latest, experience) => !latest || experience.updatedAt > latest.updatedAt ? experience : latest,
    null,
  )
}

/**
 * Builds the bounded public route index from the same domain visibility rule
 * used by sitemap and discovery. The result is serializable and keyed only by
 * the finite set of current merchants, never by an incoming request slug.
 */
export function buildPublicRouteAdmissionIndex(
  merchants: AdmissionMerchant[],
): PublicRouteAdmissionIndex {
  return Object.fromEntries(merchants.filter((merchant) => merchant.status === 'ACTIVE').map((merchant) => {
    const stores = merchant.experiences.filter((experience) => experience.type === 'STORE')
    const selectedStore = stores.find((experience) => experience.status === 'ACTIVE')
      ?? latestExperience(stores)
    const campaigns = merchant.experiences
      .filter((experience) => experience.type === 'CAMPAIGN' && isRoutableExperience(merchant, experience))
      .map((experience) => experience.slug)

    return [merchant.slug, {
      store: Boolean(selectedStore && isRoutableExperience(merchant, selectedStore)),
      campaigns,
    }]
  }))
}

async function readPublicRouteAdmissionIndex(): Promise<PublicRouteAdmissionIndex> {
  const [merchants, frameCounts, productDestinationCounts] = await Promise.all([
    prisma.merchant.findMany({
      where: { status: 'ACTIVE' },
      select: {
        slug: true,
        name: true,
        status: true,
        websiteUrl: true,
        pilotType: true,
        referenceData: true,
        sponsoredUsagePolicyKey: true,
        experiences: {
          where: { type: { in: ['STORE', 'CAMPAIGN'] } },
          orderBy: [{ status: 'asc' }, { slug: 'asc' }, { updatedAt: 'desc' }],
          select: {
            id: true,
            type: true,
            slug: true,
            name: true,
            status: true,
            headline: true,
            description: true,
            referenceData: true,
            updatedAt: true,
          },
        },
      },
    }),
    prisma.experienceFrame.groupBy({
      by: ['experienceId'],
      where: {
        active: true,
        merchantFrame: { status: 'ACTIVE' },
        experience: {
          merchant: { status: 'ACTIVE' },
          type: { in: ['STORE', 'CAMPAIGN'] },
        },
      },
      _count: { _all: true },
    }),
    prisma.experienceFrame.groupBy({
      by: ['experienceId'],
      where: {
        active: true,
        merchantFrame: {
          status: 'ACTIVE',
          OR: [
            { productUrl: { startsWith: 'http://' } },
            { productUrl: { startsWith: 'https://' } },
          ],
        },
        experience: {
          merchant: { status: 'ACTIVE' },
          type: { in: ['STORE', 'CAMPAIGN'] },
        },
      },
      _count: { _all: true },
    }),
  ])

  const frameCountByExperience = new Map(frameCounts.map((row) => [row.experienceId, row._count._all]))
  const productDestinationByExperience = new Set(productDestinationCounts.map((row) => row.experienceId))

  return buildPublicRouteAdmissionIndex(merchants.map((merchant) => ({
    ...merchant,
    experiences: merchant.experiences.map((experience) => ({
      ...experience,
      frameCount: frameCountByExperience.get(experience.id) ?? 0,
      hasProductDestination: productDestinationByExperience.has(experience.id),
    })),
  })))
}

const getCachedPublicRouteAdmissionIndex = unstable_cache(
  readPublicRouteAdmissionIndex,
  ['public-route-admission-index'],
  {
    revalidate: PUBLIC_DISCOVERY_CACHE.sitemapRevalidateSeconds,
    tags: [PUBLIC_DISCOVERY_CACHE.tags.routeAdmission],
  },
)

export async function getPublicRouteAdmissionIndex(): Promise<PublicRouteAdmissionIndex> {
  return getCachedPublicRouteAdmissionIndex()
}

export async function isPublicStoreRouteAdmitted(input: { merchantSlug: string }): Promise<boolean> {
  if (!isPublicMerchantSlug(input.merchantSlug)) return false
  const index = await getPublicRouteAdmissionIndex()
  return Boolean(index[input.merchantSlug]?.store)
}

export async function isPublicCampaignRouteAdmitted(input: {
  merchantSlug: string
  experienceSlug: string
}): Promise<boolean> {
  if (!isPublicMerchantSlug(input.merchantSlug) || !isPublicExperienceSlug(input.experienceSlug)) return false
  const index = await getPublicRouteAdmissionIndex()
  return Boolean(index[input.merchantSlug]?.campaigns.includes(input.experienceSlug))
}
