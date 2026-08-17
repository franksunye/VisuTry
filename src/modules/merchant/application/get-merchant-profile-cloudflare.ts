import { getCloudflareSql } from '@/data/neon-cloudflare'
import { MerchantAccessError } from './merchant-access-cloudflare'
import { requireAgentScope, type MerchantActorContext } from '../domain/actor'

export async function getMerchantProfile(input: { actor: MerchantActorContext }) {
  requireAgentScope(input.actor, 'merchant:read')
  const sql = getCloudflareSql()
  const rows = await sql`
    SELECT "id", "slug", "name", "status", "websiteUrl", "contactEmail"
    FROM "Merchant"
    WHERE "id" = ${input.actor.merchantId}
    LIMIT 1
  `
  const merchant = rows[0]
  if (!merchant) throw new MerchantAccessError()
  return {
    id: String(merchant.id),
    slug: String(merchant.slug),
    name: String(merchant.name),
    status: String(merchant.status),
    websiteUrl: merchant.websiteUrl == null ? null : String(merchant.websiteUrl),
    contactEmail: merchant.contactEmail == null ? null : String(merchant.contactEmail),
  }
}
