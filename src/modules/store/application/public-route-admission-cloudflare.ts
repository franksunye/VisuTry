import { unstable_cache } from 'next/cache'
import { getCloudflareSql } from '@/data/neon-cloudflare'
import { resolveExperienceSearchVisibility } from '../domain/experience-search-visibility'
import { PUBLIC_DISCOVERY_CACHE, publicDiscoveryCacheNamespace } from '@/lib/store-discovery-cache'

export const PUBLIC_MERCHANT_SLUG_MAX_LENGTH = 180
export const PUBLIC_EXPERIENCE_SLUG_MAX_LENGTH = 240

const PUBLIC_ROUTE_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/u

export type PublicRouteAdmission = { store: boolean; campaigns: string[] }
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

type Row = Record<string, unknown>

function dateValue(value: unknown): Date {
  return value instanceof Date ? value : new Date(String(value))
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

export function isPublicRouteSlug(value: unknown, maxLength: number): value is string {
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

export function buildPublicRouteAdmissionIndex(
  merchants: AdmissionMerchant[],
): PublicRouteAdmissionIndex {
  return Object.fromEntries(merchants.filter((merchant) => merchant.status === 'ACTIVE').map((merchant) => {
    const stores = merchant.experiences.filter((experience) => experience.type === 'STORE')
    const selectedStore = stores.find((experience) => experience.status === 'ACTIVE') ?? latestExperience(stores)
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
  const sql = getCloudflareSql()
  const rows = await sql`
    SELECT
      m."slug" AS "merchantSlug",
      m."name" AS "merchantName",
      m."status" AS "merchantStatus",
      m."websiteUrl" AS "merchantWebsiteUrl",
      m."pilotType" AS "merchantPilotType",
      m."referenceData" AS "merchantReferenceData",
      m."sponsoredUsagePolicyKey" AS "merchantSponsoredUsagePolicyKey",
      e."id" AS "experienceId",
      e."type" AS "experienceType",
      e."slug" AS "experienceSlug",
      e."name" AS "experienceName",
      e."status" AS "experienceStatus",
      e."headline" AS "experienceHeadline",
      e."description" AS "experienceDescription",
      e."referenceData" AS "experienceReferenceData",
      e."updatedAt" AS "experienceUpdatedAt",
      COUNT(mf."id")::int AS "frameCount",
      COALESCE(BOOL_OR(
        mf."productUrl" LIKE 'http://%' OR mf."productUrl" LIKE 'https://%'
      ), false) AS "hasProductDestination"
    FROM "Merchant" m
    LEFT JOIN "Experience" e
      ON e."merchantId" = m."id"
      AND e."type" IN ('STORE', 'CAMPAIGN')
    LEFT JOIN "ExperienceFrame" ef
      ON ef."experienceId" = e."id"
      AND ef."merchantId" = e."merchantId"
      AND ef."active" = true
    LEFT JOIN "MerchantFrame" mf
      ON mf."id" = ef."merchantFrameId"
      AND mf."merchantId" = ef."merchantId"
      AND mf."status" = 'ACTIVE'
    WHERE m."status" = 'ACTIVE'
    GROUP BY
      m."slug", m."name", m."status", m."websiteUrl", m."pilotType", m."referenceData",
      m."sponsoredUsagePolicyKey", e."id", e."type", e."slug", e."name", e."status",
      e."headline", e."description", e."referenceData", e."updatedAt"
    ORDER BY m."slug" ASC, e."updatedAt" DESC
  `

  const merchants = new Map<string, AdmissionMerchant>()
  for (const row of rows as Row[]) {
    const merchantSlug = String(row.merchantSlug)
    const merchant = merchants.get(merchantSlug) ?? {
      slug: merchantSlug,
      name: String(row.merchantName),
      status: String(row.merchantStatus) as AdmissionMerchant['status'],
      websiteUrl: row.merchantWebsiteUrl == null ? null : String(row.merchantWebsiteUrl),
      pilotType: String(row.merchantPilotType ?? 'LIVE'),
      referenceData: Boolean(row.merchantReferenceData),
      sponsoredUsagePolicyKey: row.merchantSponsoredUsagePolicyKey == null ? null : String(row.merchantSponsoredUsagePolicyKey),
      experiences: [],
    }
    if (row.experienceId != null) {
      merchant.experiences.push({
        id: String(row.experienceId),
        type: String(row.experienceType) as AdmissionExperience['type'],
        slug: String(row.experienceSlug),
        name: String(row.experienceName),
        status: String(row.experienceStatus) as AdmissionExperience['status'],
        headline: row.experienceHeadline == null ? null : String(row.experienceHeadline),
        description: row.experienceDescription == null ? null : String(row.experienceDescription),
        referenceData: Boolean(row.experienceReferenceData),
        updatedAt: dateValue(row.experienceUpdatedAt),
        frameCount: Number(row.frameCount ?? 0),
        hasProductDestination: Boolean(row.hasProductDestination),
      })
    }
    merchants.set(merchantSlug, merchant)
  }
  return buildPublicRouteAdmissionIndex([...merchants.values()])
}

const getCachedPublicRouteAdmissionIndex = unstable_cache(
  readPublicRouteAdmissionIndex,
  ['public-route-admission-index', publicDiscoveryCacheNamespace()],
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
