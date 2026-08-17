import { getCloudflareSql } from '@/data/neon-cloudflare'
import { resolveCampaignConversionPolicy } from '@/modules/store/domain/campaign-policy'
import { resolvePresentationMode, type PresentationMode } from '@/modules/store/domain/presentation-mode'

export type MerchantControlExperience = {
  id: string
  type: 'STORE' | 'CAMPAIGN'
  name: string
  slug: string
  status: string
  frameCount: number
  referenceData: boolean
  publicPath: string
  policy: { objective: 'TRAFFIC' | 'INTENT' | 'LEAD' | null; gate: 'NONE' | 'OPT_IN_AFTER_VALUE' | 'OPT_IN_BEFORE_AI' | null; presentation: PresentationMode }
  updatedAt: string
}

export type MerchantControlCenter = {
  merchant: { id: string; slug: string; name: string; websiteUrl: string | null; status: string; referenceData: boolean }
  store: MerchantControlExperience | null
  experiences: MerchantControlExperience[]
  activeCampaignCount: number
  shopperActivityAvailable: boolean
  credentialUsage: { active: number }
}

export async function getMerchantControlCenter(input: { merchantId: string }): Promise<MerchantControlCenter | null> {
  const sql = getCloudflareSql()
  const merchantRows = await sql`
    SELECT "id", "slug", "name", "websiteUrl", "status", "referenceData"
    FROM "Merchant"
    WHERE "id" = ${input.merchantId}
    LIMIT 1
  `
  const merchant = merchantRows[0]
  if (!merchant) return null

  const [experiences, sessionCount, credentialCount] = await Promise.all([
    sql`
      SELECT e."id", e."type", e."name", e."slug", e."status", e."campaignObjective",
        e."campaignGate", e."presentationMode", e."referenceData", e."updatedAt",
        count(ef."merchantFrameId") FILTER (WHERE ef."active" = true)::int AS "frameCount"
      FROM "Experience" e
      LEFT JOIN "ExperienceFrame" ef ON ef."experienceId" = e."id"
      WHERE e."merchantId" = ${input.merchantId}
      GROUP BY e."id"
      ORDER BY e."updatedAt" DESC
    `,
    sql`SELECT count(*)::int AS "count" FROM "MerchantSession" WHERE "merchantId" = ${input.merchantId}`,
    sql`SELECT count(*)::int AS "count" FROM "MerchantAgentCredential" WHERE "merchantId" = ${input.merchantId} AND "status" = 'ACTIVE'`,
  ])

  const mapped = experiences.map((experience): MerchantControlExperience => {
    const policy = resolveCampaignConversionPolicy({
      type: String(experience.type),
      campaignObjective: experience.campaignObjective == null ? null : String(experience.campaignObjective),
      campaignGate: experience.campaignGate == null ? null : String(experience.campaignGate),
    } as never)
    const type = String(experience.type) as 'STORE' | 'CAMPAIGN'
    const slug = String(experience.slug)
    return {
      id: String(experience.id),
      type,
      name: String(experience.name),
      slug,
      status: String(experience.status),
      frameCount: Number(experience.frameCount ?? 0),
      referenceData: Boolean(merchant.referenceData) || Boolean(experience.referenceData),
      publicPath: type === 'STORE' ? `/en/store/${String(merchant.slug)}` : `/en/c/${String(merchant.slug)}/${slug}`,
      policy: {
        objective: policy?.objective ?? null,
        gate: policy?.gate ?? null,
        presentation: resolvePresentationMode({ experienceType: type, persistedPresentationMode: experience.presentationMode == null ? null : String(experience.presentationMode) as PresentationMode }),
      },
      updatedAt: (experience.updatedAt instanceof Date ? experience.updatedAt : new Date(String(experience.updatedAt))).toISOString(),
    }
  })

  return {
    merchant: {
      id: String(merchant.id),
      slug: String(merchant.slug),
      name: String(merchant.name),
      websiteUrl: merchant.websiteUrl == null ? null : String(merchant.websiteUrl),
      status: String(merchant.status),
      referenceData: Boolean(merchant.referenceData),
    },
    store: mapped.find((experience) => experience.type === 'STORE') ?? null,
    experiences: mapped,
    activeCampaignCount: mapped.filter((experience) => experience.type === 'CAMPAIGN' && experience.status === 'ACTIVE').length,
    shopperActivityAvailable: Number(sessionCount[0]?.count ?? 0) > 0,
    credentialUsage: { active: Number(credentialCount[0]?.count ?? 0) },
  }
}
