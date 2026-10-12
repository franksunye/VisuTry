import { prisma } from '@/lib/prisma'
import { MerchantAccessError } from './merchant-access'
import type { HumanMerchantActor } from '../domain/actor'
import {
  buildMerchantFactoryDryRunV1,
  type FactorySnapshotExperience,
  type FactorySnapshotV1,
} from '../domain/merchant-delivery-factory-v1'

/**
 * Read-only, tenant-authenticated Factory planning adapter. The HTTP boundary
 * must require an OWNER/ADMIN membership; this function also fails closed
 * when the actor lacks a membership. No Prisma writes or provider calls.
 */
export async function getMerchantFactoryDryRun(input: {
  actor: HumanMerchantActor
  proposal: unknown
}) {
  if (!input.actor.membershipId) throw new MerchantAccessError()
  const merchant = await prisma.merchant.findUnique({
    where: { id: input.actor.merchantId },
    select: {
      id: true, slug: true, classification: true, name: true, logoUrl: true,
      frames: {
        where: { status: 'ACTIVE' },
        select: { id: true },
      },
      experiences: {
        select: {
          id: true, type: true, slug: true, status: true,
          name: true, headline: true, description: true,
          presentationMode: true, journeyPolicy: true, deliveryPolicy: true,
          updatedAt: true,
          frames: {
            where: { active: true },
            orderBy: { sortOrder: 'asc' },
            select: { merchantFrameId: true },
          },
        },
      },
    },
  })
  if (!merchant) throw new MerchantAccessError()

  const toSnapshot = (experience: (typeof merchant.experiences)[number]): FactorySnapshotExperience => ({
    id: experience.id,
    status: experience.status,
    name: experience.name,
    headline: experience.headline,
    description: experience.description,
    presentationMode: experience.presentationMode,
    journeyPolicy: experience.journeyPolicy,
    deliveryPolicy: experience.deliveryPolicy,
    selectedFrameIds: experience.frames.map(frame => frame.merchantFrameId),
  })
  // Match public Store read selection. The extra ACTIVE Store guard below
  // prevents hiding inconsistent ownership/configuration behind a lucky row.
  const stores = merchant.experiences.filter(item => item.type === 'STORE')
  const activeStores = stores.filter(item => item.status === 'ACTIVE')
    .sort((a, b) => a.slug.localeCompare(b.slug) || b.updatedAt.getTime() - a.updatedAt.getTime())
  const defaultStore = activeStores[0] ?? stores.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())[0] ?? null
  const snapshot: FactorySnapshotV1 = {
    merchantId: merchant.id,
    merchantSlug: merchant.slug,
    classification: merchant.classification,
    brandDisplayName: merchant.name,
    logoAssetUrl: merchant.logoUrl,
    activeFrameIds: merchant.frames.map(frame => frame.id),
    store: defaultStore ? toSnapshot(defaultStore) : null,
    campaigns: merchant.experiences
      .filter(item => item.type === 'CAMPAIGN')
      .sort((a, b) => a.slug.localeCompare(b.slug))
      .map(item => ({ ...toSnapshot(item), slug: item.slug })),
  }
  const plan = buildMerchantFactoryDryRunV1(input.proposal, snapshot)
  if (activeStores.length > 1) {
    plan.blockers.push('Multiple ACTIVE Stores exist; resolve the live Store identity in the human workspace first')
  }
  return plan
}
