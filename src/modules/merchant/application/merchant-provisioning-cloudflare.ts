import { getCloudflareSql } from '@/data/neon-cloudflare'
import { slugify } from '@/lib/programmatic-seo'
import {
  PUBLIC_SELF_SERVICE_MERCHANT_CLASSIFICATION,
  PUBLIC_SELF_SERVICE_MERCHANT_CLASSIFICATION_REASON,
  PUBLIC_SELF_SERVICE_MERCHANT_CLASSIFICATION_SOURCE,
} from '../domain/merchant-classification'
import type { MerchantMembershipRecord } from '../domain/membership'

export type CreateMerchantWithOwnerInput = {
  userId: string
  slug?: string
  name?: string
  websiteUrl?: string | null
}

export type MerchantWithOwner = {
  merchant: {
    id: string
    slug: string
    name: string
  }
  membership: MerchantMembershipRecord
}

export class MerchantProvisioningError extends Error {
  readonly code: 'INVALID_MERCHANT_NAME' | 'INVALID_WEBSITE_URL' | 'SLUG_UNAVAILABLE'

  constructor(code: MerchantProvisioningError['code'], message: string) {
    super(message)
    this.name = 'MerchantProvisioningError'
    this.code = code
  }
}

function newRecordId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `cf-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`
}

function normalizeInput(input: CreateMerchantWithOwnerInput) {
  const suppliedName = input.name === undefined ? null : input.name.trim()
  const name = suppliedName === null ? 'My Merchant Workspace' : suppliedName
  if (name.length < 2 || name.length > 120) {
    throw new MerchantProvisioningError('INVALID_MERCHANT_NAME', 'Merchant name must be between 2 and 120 characters.')
  }

  const websiteUrl = input.websiteUrl?.trim() || null
  if (websiteUrl) {
    try {
      const parsed = new URL(websiteUrl)
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') throw new Error('Unsupported protocol')
    } catch {
      throw new MerchantProvisioningError('INVALID_WEBSITE_URL', 'Website URL must be a valid http(s) URL.')
    }
  }

  const baseSlug = slugify((input.slug || name).trim()).slice(0, 180).replace(/-+$/u, '')
  if (!baseSlug) {
    throw new MerchantProvisioningError('INVALID_MERCHANT_NAME', 'Merchant name must contain letters or numbers.')
  }

  return { name, websiteUrl, baseSlug }
}

async function createMerchantWithOwnerAttempt(
  input: CreateMerchantWithOwnerInput,
  normalized: ReturnType<typeof normalizeInput>,
  slug: string,
): Promise<MerchantWithOwner | null> {
  const sql = getCloudflareSql()
  const merchantId = newRecordId()
  const membershipId = newRecordId()
  const results = await sql.transaction([
    sql`
      SELECT mm."id", mm."userId", mm."merchantId", mm."role", mm."createdAt", mm."updatedAt",
        m."slug", m."name"
      FROM "MerchantMembership" mm
      JOIN "Merchant" m ON m."id" = mm."merchantId"
      WHERE mm."userId" = ${input.userId}
      ORDER BY mm."createdAt" ASC
      LIMIT 1
    `,
    sql`UPDATE "User" SET "updatedAt" = NOW() WHERE "id" = ${input.userId}`,
    sql`
      INSERT INTO "Merchant" ("id", "slug", "name", "websiteUrl", "classification", "classificationSource", "classificationReason", "createdAt", "updatedAt")
      SELECT ${merchantId}, ${slug}, ${normalized.name}, ${normalized.websiteUrl}, ${PUBLIC_SELF_SERVICE_MERCHANT_CLASSIFICATION}, ${PUBLIC_SELF_SERVICE_MERCHANT_CLASSIFICATION_SOURCE}, ${PUBLIC_SELF_SERVICE_MERCHANT_CLASSIFICATION_REASON}, NOW(), NOW()
      WHERE NOT EXISTS (
        SELECT 1 FROM "MerchantMembership" WHERE "userId" = ${input.userId}
      )
      ON CONFLICT ("slug") DO NOTHING
      RETURNING "id", "slug", "name"
    `,
    sql`
      INSERT INTO "MerchantMembership" ("id", "userId", "merchantId", "role", "createdAt", "updatedAt")
      SELECT ${membershipId}, ${input.userId}, ${merchantId}, 'OWNER', NOW(), NOW()
      WHERE EXISTS (SELECT 1 FROM "Merchant" WHERE "id" = ${merchantId})
        AND NOT EXISTS (SELECT 1 FROM "MerchantMembership" WHERE "userId" = ${input.userId})
      ON CONFLICT ("userId", "merchantId") DO NOTHING
      RETURNING "id", "userId", "merchantId", "role", "createdAt", "updatedAt"
    `,
    sql`
      SELECT mm."id" AS "membershipId", mm."userId", mm."merchantId", mm."role",
        mm."createdAt" AS "membershipCreatedAt", mm."updatedAt" AS "membershipUpdatedAt",
        m."slug", m."name"
      FROM "MerchantMembership" mm
      JOIN "Merchant" m ON m."id" = mm."merchantId"
      WHERE mm."userId" = ${input.userId}
      ORDER BY mm."createdAt" ASC
      LIMIT 1
    `,
  ], { isolationLevel: 'Serializable' })

  const existing = results[0]?.[0] as Record<string, unknown> | undefined
  const selected = results[4]?.[0] as Record<string, unknown> | undefined
  if (existing && selected) return mapMerchantWithOwner(selected)
  if (!selected) return null
  return mapMerchantWithOwner(selected)
}

function mapMerchantWithOwner(row: Record<string, unknown>): MerchantWithOwner {
  return {
    merchant: {
      id: String(row.merchantId),
      slug: String(row.slug),
      name: String(row.name),
    },
    membership: {
      id: String(row.membershipId ?? row.id),
      userId: String(row.userId),
      merchantId: String(row.merchantId),
      role: 'OWNER',
      createdAt: new Date(String(row.membershipCreatedAt ?? row.createdAt)),
      updatedAt: new Date(String(row.membershipUpdatedAt ?? row.updatedAt)),
    },
  }
}

export async function createMerchantWithOwner(input: CreateMerchantWithOwnerInput): Promise<MerchantWithOwner> {
  const normalized = normalizeInput(input)
  for (let slugAttempt = 0; slugAttempt < 5; slugAttempt += 1) {
    const slug = slugAttempt === 0 ? normalized.baseSlug : `${normalized.baseSlug}-${slugAttempt + 1}`
    const result = await createMerchantWithOwnerAttempt(input, normalized, slug)
    if (result) return result
  }
  throw new MerchantProvisioningError('SLUG_UNAVAILABLE', 'That merchant name is currently unavailable.')
}

export async function assignMerchantOwner(_input: { userId: string; merchantId: string }): Promise<MerchantMembershipRecord> {
  throw new Error('Cloudflare merchant owner assignment is deferred to the write phase')
}
