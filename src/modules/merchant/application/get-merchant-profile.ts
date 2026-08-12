import { createPrismaMerchantRepository } from '@/modules/store/infrastructure/prisma/merchant-repository'
import type { MerchantRepository } from '@/modules/store/application/ports/repositories'
import { MerchantAccessError } from './merchant-access'
import { requireAgentScope, type MerchantActorContext } from '../domain/actor'

export async function getMerchantProfile(input: {
  actor: MerchantActorContext
  repository?: Pick<MerchantRepository, 'findById'>
}) {
  requireAgentScope(input.actor, 'merchant:read')
  const merchant = await (input.repository ?? createPrismaMerchantRepository()).findById(input.actor.merchantId)
  if (!merchant) throw new MerchantAccessError()

  return {
    id: merchant.id,
    slug: merchant.slug,
    name: merchant.name,
    status: merchant.status,
    websiteUrl: merchant.websiteUrl,
    contactEmail: merchant.contactEmail,
  }
}
