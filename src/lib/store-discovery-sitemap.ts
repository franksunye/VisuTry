import type { MetadataRoute } from 'next'
import { unstable_cache } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { resolveExperienceSearchVisibility } from '@/modules/store/domain/experience-search-visibility'
import { PUBLIC_DISCOVERY_CACHE } from '@/lib/store-discovery-cache'

export type PublicSitemapExperience = {
  type: 'STORE' | 'CAMPAIGN'
  slug: string
  name: string
  status: 'DRAFT' | 'ACTIVE' | 'ENDED' | 'ARCHIVED'
  headline: string | null
  referenceData: boolean
  updatedAt: Date
  frames: Array<{ productUrl: string | null; updatedAt: Date }>
}

export type PublicSitemapMerchant = {
  slug: string
  name: string
  websiteUrl: string | null
  pilotType: string
  referenceData: boolean
  sponsoredUsagePolicyKey: string | null
  updatedAt: Date
  experiences: PublicSitemapExperience[]
}

function latestDate(values: Date[]): Date {
  return values.reduce((latest, value) => value > latest ? value : latest)
}

/** Build only English sitemap entries that the shared visibility policy indexes. */
export function buildPublicExperienceSitemapEntries(input: {
  baseUrl: string
  merchants: PublicSitemapMerchant[]
}): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = []

  input.merchants.forEach((merchant) => {
    const campaigns = merchant.experiences.filter((experience) => experience.type === 'CAMPAIGN')
    const store = merchant.experiences.find((experience) => experience.type === 'STORE' && experience.status === 'ACTIVE')
      || merchant.experiences.find((experience) => experience.type === 'STORE')
    if (store) campaigns.unshift(store)

    campaigns.forEach((experience) => {
      const visibility = resolveExperienceSearchVisibility({
        merchant: {
          name: merchant.name,
          status: 'ACTIVE',
          websiteUrl: merchant.websiteUrl,
          pilotType: merchant.pilotType,
          referenceData: merchant.referenceData,
          sponsoredUsagePolicyKey: merchant.sponsoredUsagePolicyKey,
        },
        experience,
        frames: experience.frames,
      })
      if (visibility !== 'PUBLIC_INDEX') return

      const path = experience.type === 'STORE'
        ? `/store/${merchant.slug}`
        : `/c/${merchant.slug}/${experience.slug}`
      entries.push({
        url: `${input.baseUrl}/en${path}`,
        lastModified: latestDate([
          merchant.updatedAt,
          experience.updatedAt,
          ...experience.frames.map((frame) => frame.updatedAt),
        ]),
        changeFrequency: 'weekly',
        priority: experience.type === 'STORE' ? 0.7 : 0.75,
        alternates: { languages: { en: `${input.baseUrl}/en${path}`, 'x-default': `${input.baseUrl}/en${path}` } },
      })
    })
  })

  return entries
}

async function readPublicSitemapMerchants(): Promise<PublicSitemapMerchant[]> {
  const merchants = await prisma.merchant.findMany({
    where: { status: 'ACTIVE' },
    select: {
      slug: true,
      name: true,
      websiteUrl: true,
      pilotType: true,
      referenceData: true,
      sponsoredUsagePolicyKey: true,
      updatedAt: true,
      experiences: {
        where: { type: { in: ['STORE', 'CAMPAIGN'] } },
        orderBy: [{ type: 'asc' }, { updatedAt: 'desc' }],
        select: {
          type: true,
          slug: true,
          name: true,
          status: true,
          headline: true,
          referenceData: true,
          updatedAt: true,
          frames: {
            where: {
              active: true,
              merchantFrame: { status: 'ACTIVE' },
            },
            select: {
              merchantFrame: { select: { productUrl: true, updatedAt: true } },
            },
          },
        },
      },
    },
  })

  return merchants.map((merchant) => ({
    ...merchant,
    experiences: merchant.experiences.map((experience) => ({
      ...experience,
      frames: experience.frames.map((frame) => frame.merchantFrame),
    })),
  }))
}

const getCachedPublicSitemapMerchants = unstable_cache(
  readPublicSitemapMerchants,
  ['public-discovery-sitemap-merchants'],
  {
    revalidate: PUBLIC_DISCOVERY_CACHE.sitemapRevalidateSeconds,
    tags: [PUBLIC_DISCOVERY_CACHE.tags.sitemap],
  },
)

export async function getCachedPublicExperienceSitemapEntries(
  baseUrl: string,
): Promise<MetadataRoute.Sitemap> {
  return buildPublicExperienceSitemapEntries({
    baseUrl,
    merchants: await getCachedPublicSitemapMerchants(),
  })
}
