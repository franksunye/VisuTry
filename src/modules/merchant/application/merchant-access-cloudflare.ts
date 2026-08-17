import { getCloudflareSql } from '@/data/neon-cloudflare'
import { isMerchantMembershipRole, type MerchantMembershipRecord, type MerchantMembershipRole } from '../domain/membership'

export type MerchantMembershipRepository = {
  findUnique: (args: {
    where: { userId_merchantId: { userId: string; merchantId: string } }
    select: { id: true; userId: true; merchantId: true; role: true; createdAt: true; updatedAt: true }
  }) => Promise<MerchantMembershipRecord | null>
}

export type MerchantAuthorization = {
  userId: string
  merchantId: string
  membershipId: string
  role: MerchantMembershipRole
}

export class MerchantAccessError extends Error {
  readonly code = 'MERCHANT_ACCESS_NOT_FOUND'
  readonly httpStatus = 404

  constructor() {
    super('Merchant access was not found.')
    this.name = 'MerchantAccessError'
  }
}

function mapMembership(row: Record<string, unknown>): MerchantMembershipRecord | null {
  const role = String(row.role)
  if (!isMerchantMembershipRole(role)) return null
  return {
    id: String(row.id),
    userId: String(row.userId),
    merchantId: String(row.merchantId),
    role,
    createdAt: row.createdAt instanceof Date ? row.createdAt : new Date(String(row.createdAt)),
    updatedAt: row.updatedAt instanceof Date ? row.updatedAt : new Date(String(row.updatedAt)),
  }
}

const membershipRepository: MerchantMembershipRepository = {
  async findUnique({ where }) {
    const sql = getCloudflareSql()
    const rows = await sql`
      SELECT "id", "userId", "merchantId", "role", "createdAt", "updatedAt"
      FROM "MerchantMembership"
      WHERE "userId" = ${where.userId_merchantId.userId}
        AND "merchantId" = ${where.userId_merchantId.merchantId}
      LIMIT 1
    `
    return rows[0] ? mapMembership(rows[0]) : null
  },
}

export async function requireMerchantMembership(input: {
  userId: string
  merchantId: string
  roles?: readonly MerchantMembershipRole[]
  repository?: MerchantMembershipRepository
}): Promise<MerchantAuthorization> {
  const membership = await (input.repository ?? membershipRepository).findUnique({
    where: { userId_merchantId: { userId: input.userId, merchantId: input.merchantId } },
    select: { id: true, userId: true, merchantId: true, role: true, createdAt: true, updatedAt: true },
  })
  if (!membership) throw new MerchantAccessError()
  if (input.roles && !input.roles.includes(membership.role)) throw new MerchantAccessError()
  return {
    userId: membership.userId,
    merchantId: membership.merchantId,
    membershipId: membership.id,
    role: membership.role,
  }
}
