export const MERCHANT_MEMBERSHIP_ROLES = ['OWNER', 'ADMIN'] as const
export type MerchantMembershipRole = (typeof MERCHANT_MEMBERSHIP_ROLES)[number]

export type MerchantMembershipRecord = {
  id: string
  userId: string
  merchantId: string
  role: MerchantMembershipRole
  createdAt: Date
  updatedAt: Date
}

export function isMerchantMembershipRole(value: string): value is MerchantMembershipRole {
  return (MERCHANT_MEMBERSHIP_ROLES as readonly string[]).includes(value)
}

export function canManageMerchant(role: MerchantMembershipRole): boolean {
  return role === 'OWNER' || role === 'ADMIN'
}
