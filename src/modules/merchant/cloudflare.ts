export * from './domain/membership'
export * from './domain/agent-credentials'
export * from './domain/actor'
export * from './application/merchant-access-cloudflare'
export * from './application/merchant-memberships-cloudflare'
export * from './application/merchant-provisioning-cloudflare'
export * from './application/merchant-agent-credentials-cloudflare'
export * from './application/get-merchant-profile-cloudflare'
export * from './application/merchant-agent-rate-limit-cloudflare'
export * from './application/merchant-onboarding-cloudflare'
export * from './application/merchant-control-center-cloudflare'

export class MerchantProfileError extends Error {
  readonly code = 'CLOUDFLARE_PROFILE_WRITE_UNSUPPORTED'

  constructor() {
    super('Merchant profile writes remain on the Vercel backend.')
    this.name = 'MerchantProfileError'
  }
}

export async function updateMerchantProfile(_input: {
  userId: string
  merchantId: string
  name?: string
  websiteUrl?: string | null
}): Promise<never> {
  throw new MerchantProfileError()
}
