import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { requireMerchantMembership } from './merchant-access'
import { experienceCommands } from '@/modules/store/application/experience-command-service-prisma'
import { ExperienceCommandError } from '@/modules/store/application/experience-command-service'
import { withPublicDiscoveryInvalidation } from '@/modules/store/application/public-discovery-invalidation'
import { getPublicEdgeTagsForMerchant } from '@/modules/store/application/public-edge-paths-server'
import { BrandKitError, normalizeBrandAccent, normalizeBrandMediaUrl } from '../domain/merchant-brand-kit'

export async function getMerchantBrandWorkspace(merchantId: string) {
  const merchant = await prisma.merchant.findUnique({ where: { id: merchantId }, select: { id: true, name: true, slug: true, logoUrl: true, accentColor: true } })
  if (!merchant) throw new BrandKitError('EXPERIENCE_NOT_FOUND', 'Merchant not found.', 404)
  const liveExperiences = await prisma.experience.count({ where: { merchantId, status: 'ACTIVE', type: { in: ['STORE','CAMPAIGN'] } } })
  return { ...merchant, liveExperiences }
}
export async function updateMerchantBrand(input: {
  userId: string; merchantId: string; accentColor?: string | null; logoUrl?: string | null; approvedLiveChange?: boolean
}) {
  await requireMerchantMembership({ userId: input.userId, merchantId: input.merchantId, roles: ['OWNER'] })
  const accentColor = input.accentColor === undefined ? undefined : normalizeBrandAccent(input.accentColor)
  const logoUrl = input.logoUrl === undefined ? undefined : normalizeBrandMediaUrl(input.logoUrl, input.merchantId, 'logo')
  if (accentColor === undefined && logoUrl === undefined) throw new BrandKitError('INVALID_BRAND_COLOR', 'No brand changes supplied.')
  const profile = await getMerchantBrandWorkspace(input.merchantId)
  const tags = await getPublicEdgeTagsForMerchant(profile.slug)
  return withPublicDiscoveryInvalidation({
    target: { kind: 'merchant', merchantSlug: profile.slug },
    edgeTags: { before: tags, after: () => getPublicEdgeTagsForMerchant(profile.slug) },
    mutation: () => prisma.$transaction(async tx => {
      const rows = await tx.$queryRaw<Array<{ id: string }>>`SELECT "id" FROM "Merchant" WHERE "id" = ${input.merchantId} FOR UPDATE`
      if (!rows.length) throw new BrandKitError('EXPERIENCE_NOT_FOUND', 'Merchant not found.', 404)
      const count = await tx.experience.count({ where: { merchantId: input.merchantId, type: { in: ['STORE','CAMPAIGN'] }, status: 'ACTIVE' } })
      if (count && !input.approvedLiveChange) throw new BrandKitError('LIVE_CHANGE_CONFIRMATION_REQUIRED', 'Brand updates affect live Store and Campaign pages.', 409)
      return tx.merchant.update({
        where: { id: input.merchantId },
        data: { ...(accentColor !== undefined ? { accentColor } : {}), ...(logoUrl !== undefined ? { logoUrl } : {}) },
        select: { id: true, slug: true, name: true, logoUrl: true, accentColor: true },
      })
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }),
  })
}
export async function updateMerchantExperienceHero(input: {
  userId: string; merchantId: string; experienceId: string; heroAssetUrl: string | null; approvedLiveChange?: boolean
}) {
  await requireMerchantMembership({ userId: input.userId, merchantId: input.merchantId, roles: ['OWNER'] })
  const experience = await prisma.experience.findFirst({
    where: { merchantId: input.merchantId, id: input.experienceId, type: { in: ['STORE','CAMPAIGN'] } },
    select: { id: true, status: true, type: true },
  })
  if (!experience || !['DRAFT','ACTIVE'].includes(experience.status)) throw new BrandKitError('EXPERIENCE_NOT_FOUND', 'Editable Experience not found.', 404)
  if (experience.status === 'ACTIVE' && !input.approvedLiveChange) throw new BrandKitError('LIVE_CHANGE_CONFIRMATION_REQUIRED', 'This change affects a live Experience.', 409)
  const heroAssetUrl = normalizeBrandMediaUrl(input.heroAssetUrl, input.merchantId, 'hero', input.experienceId)
  try {
    await experienceCommands.updateSharedConfiguration({
      merchantId: input.merchantId, experienceId: input.experienceId,
      expectedType: experience.type as 'STORE' | 'CAMPAIGN',
      patch: { heroAssetUrl },
      draftOnly: input.approvedLiveChange !== true,
      // The command boundary owns the transaction; inspect the locked row after
      // update and roll back if an Experience became ENDED/ARCHIVED meanwhile.
      afterUpdate: async tx => {
        const fresh = await tx.experience.findFirst({
          where: { id: input.experienceId, merchantId: input.merchantId },
          select: { type: true, status: true },
        })
        if (!fresh || fresh.type !== experience.type || !['DRAFT', 'ACTIVE'].includes(fresh.status)) {
          throw new BrandKitError('EXPERIENCE_NOT_FOUND', 'The Experience is no longer editable.', 409)
        }
        if (fresh.status === 'ACTIVE' && !input.approvedLiveChange) {
          throw new BrandKitError('LIVE_CHANGE_CONFIRMATION_REQUIRED', 'Live Experience changes require approval.', 409)
        }
      },
    })
  } catch (error) {
    if (error instanceof ExperienceCommandError && error.message.includes('limited to Draft')) {
      throw new BrandKitError('LIVE_CHANGE_CONFIRMATION_REQUIRED', 'The Experience became live; review and approve the change.', 409)
    }
    throw error
  }
  return { id: experience.id, heroAssetUrl, status: experience.status }
}
