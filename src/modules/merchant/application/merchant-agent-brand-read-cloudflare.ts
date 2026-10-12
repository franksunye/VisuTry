import { getCloudflareSql } from '@/data/neon-cloudflare'
import { MerchantAccessError } from './merchant-access-cloudflare'
import { requireAgentScope, type AgentMerchantActor } from '../domain/actor'
import { merchantAgentBrandReadModel } from './merchant-agent-brand-read-model'

/** Same safe response and scope contract as canonical Node, using Cloudflare SQL reads. */
export async function getMerchantAgentBrandKit(input: {
  actor: AgentMerchantActor
  experienceId?: string
}) {
  requireAgentScope(input.actor, 'merchant:read')
  requireAgentScope(input.actor, 'experience:read')
  const sql = getCloudflareSql()
  const rows = await sql`
    SELECT "id", "name", "logoUrl", "accentColor"
    FROM "Merchant"
    WHERE "id" = ${input.actor.merchantId}
    LIMIT 1
  `
  const merchant = rows[0]
  if (!merchant) throw new MerchantAccessError()
  const experienceRows = input.experienceId
    ? await sql`
        SELECT "id", "type", "status", "heroAssetUrl"
        FROM "Experience"
        WHERE "id" = ${input.experienceId}
          AND "merchantId" = ${input.actor.merchantId}
          AND "type" IN ('STORE', 'CAMPAIGN')
        LIMIT 1
      `
    : []
  if (input.experienceId && !experienceRows[0]) throw new MerchantAccessError()
  const experience = experienceRows[0]
  return merchantAgentBrandReadModel({
    merchant: {
      id: String(merchant.id),
      name: String(merchant.name),
      logoUrl: merchant.logoUrl == null ? null : String(merchant.logoUrl),
      accentColor: merchant.accentColor == null ? null : String(merchant.accentColor),
    },
    experience: experience
      ? {
          id: String(experience.id),
          type: String(experience.type) as 'STORE' | 'CAMPAIGN',
          status: String(experience.status),
          heroAssetUrl: experience.heroAssetUrl == null ? null : String(experience.heroAssetUrl),
        }
      : null,
  })
}
