import { prisma } from '@/lib/prisma'
import { MerchantAccessError } from './merchant-access'
import { requireAgentScope, type AgentMerchantActor } from '../domain/actor'
import { merchantAgentBrandReadModel } from './merchant-agent-brand-read-model'

/**
 * Agent-visible Brand Kit state. Read-only; no upload, update, or media URL
 * dereference. The authenticated credential supplies the tenant identity.
 */
export async function getMerchantAgentBrandKit(input: {
  actor: AgentMerchantActor
  experienceId?: string
}) {
  requireAgentScope(input.actor, 'merchant:read')
  requireAgentScope(input.actor, 'experience:read')
  const merchant = await prisma.merchant.findUnique({
    where: { id: input.actor.merchantId },
    select: { id: true, name: true, logoUrl: true, accentColor: true },
  })
  if (!merchant) throw new MerchantAccessError()
  const experience = input.experienceId
    ? await prisma.experience.findFirst({
        where: {
          id: input.experienceId,
          merchantId: input.actor.merchantId,
          type: { in: ['STORE', 'CAMPAIGN'] },
        },
        select: { id: true, type: true, status: true, heroAssetUrl: true },
      })
    : null
  if (input.experienceId && !experience) throw new MerchantAccessError()
  return merchantAgentBrandReadModel({ merchant, experience })
}
