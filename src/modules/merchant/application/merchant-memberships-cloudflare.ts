import { getCloudflareSql } from '@/data/neon-cloudflare'
import type { MerchantMembershipRecord, MerchantMembershipRole } from '../domain/membership'
import { MerchantAccessError, requireMerchantMembership } from './merchant-access-cloudflare'

export type MerchantSummary = { id: string; slug: string; name: string; status: string }
export type MerchantForUser = { merchant: MerchantSummary; membership: MerchantMembershipRecord }

function dateValue(value: unknown): Date {
  return value instanceof Date ? value : new Date(String(value))
}

function mapRow(row: Record<string, unknown>): MerchantForUser {
  return {
    merchant: {
      id: String(row.merchantId),
      slug: String(row.slug),
      name: String(row.name),
      status: String(row.merchantStatus),
    },
    membership: {
      id: String(row.membershipId),
      userId: String(row.userId),
      merchantId: String(row.merchantId),
      role: String(row.role) as MerchantMembershipRole,
      createdAt: dateValue(row.membershipCreatedAt),
      updatedAt: dateValue(row.membershipUpdatedAt),
    },
  }
}

async function rowsForUser(userId: string, merchantId?: string): Promise<MerchantForUser[]> {
  const sql = getCloudflareSql()
  const rows = merchantId
    ? await sql`
        SELECT mm."id" AS "membershipId", mm."userId", mm."merchantId", mm."role",
          mm."createdAt" AS "membershipCreatedAt", mm."updatedAt" AS "membershipUpdatedAt",
          m."slug", m."name", m."status" AS "merchantStatus"
        FROM "MerchantMembership" mm
        JOIN "Merchant" m ON m."id" = mm."merchantId"
        WHERE mm."userId" = ${userId} AND mm."merchantId" = ${merchantId}
        ORDER BY mm."createdAt" ASC
      `
    : await sql`
        SELECT mm."id" AS "membershipId", mm."userId", mm."merchantId", mm."role",
          mm."createdAt" AS "membershipCreatedAt", mm."updatedAt" AS "membershipUpdatedAt",
          m."slug", m."name", m."status" AS "merchantStatus"
        FROM "MerchantMembership" mm
        JOIN "Merchant" m ON m."id" = mm."merchantId"
        WHERE mm."userId" = ${userId}
        ORDER BY mm."createdAt" ASC
      `
  return rows.map(mapRow)
}

export async function listMerchantsForUser(userId: string): Promise<MerchantForUser[]> {
  return rowsForUser(userId)
}

export async function getMerchantForUser(input: { userId: string; merchantId: string }): Promise<MerchantForUser> {
  await requireMerchantMembership(input)
  const row = (await rowsForUser(input.userId, input.merchantId))[0]
  if (!row) throw new MerchantAccessError()
  return row
}

function unsupportedWrite(method: string): never {
  throw new Error(`Cloudflare merchant membership ${method} is deferred to the write phase`)
}

export async function createMerchantMembership(_input: { actorUserId: string; userId: string; merchantId: string; role: MerchantMembershipRole }): Promise<MerchantMembershipRecord> {
  return unsupportedWrite('create')
}

export async function listMembersForMerchant(_input: { actorUserId: string; merchantId: string }): Promise<MerchantMembershipRecord[]> {
  return unsupportedWrite('member listing')
}

export async function removeMerchantMembership(_input: { actorUserId: string; userId: string; merchantId: string }): Promise<MerchantMembershipRecord> {
  return unsupportedWrite('remove')
}
