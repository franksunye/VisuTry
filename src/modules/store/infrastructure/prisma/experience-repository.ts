import type { Experience } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import type { ExperienceRecord, ExperienceRepository } from '../../application/ports/repositories'
import type { ExperienceStatus, ExperienceType } from '../../domain/experience'

type ExperienceWithFrames = Experience & {
  frames: Array<{ merchantFrameId: string }>
}

function mapExperience(row: ExperienceWithFrames): ExperienceRecord {
  return {
    id: row.id,
    merchantId: row.merchantId,
    type: row.type as ExperienceType,
    slug: row.slug,
    name: row.name,
    status: row.status as ExperienceStatus,
    headline: row.headline,
    description: row.description,
    heroAssetUrl: row.heroAssetUrl,
    primaryCtaType: row.primaryCtaType,
    primaryCtaLabel: row.primaryCtaLabel,
    primaryCtaUrl: row.primaryCtaUrl,
    secondaryCtaType: row.secondaryCtaType,
    secondaryCtaLabel: row.secondaryCtaLabel,
    secondaryCtaUrl: row.secondaryCtaUrl,
    offerLabel: row.offerLabel,
    offerCode: row.offerCode,
    offerTerms: row.offerTerms,
    startAt: row.startAt,
    endAt: row.endAt,
    referenceData: row.referenceData,
    defaultSource: row.defaultSource,
    defaultCampaign: row.defaultCampaign,
    referenceMetadata: (row.referenceMetadata as Record<string, unknown> | null) ?? null,
    frameIds: row.frames.map((frame) => frame.merchantFrameId),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

const includeFrames = {
  frames: {
    where: { active: true },
    orderBy: [{ sortOrder: 'asc' as const }, { createdAt: 'asc' as const }],
    select: { merchantFrameId: true },
  },
}

function isExperienceTableUnavailable(error: unknown): boolean {
  return (error as { code?: string }).code === 'P2021'
}

export function createPrismaExperienceRepository(): ExperienceRepository {
  return {
    async findByMerchantAndId(merchantId, experienceId) {
      try {
        const row = await prisma.experience.findFirst({
          where: { id: experienceId, merchantId },
          include: includeFrames,
        })
        return row ? mapExperience(row) : null
      } catch (error) {
        if (isExperienceTableUnavailable(error)) return null
        throw error
      }
    },
    async findDefaultStore(merchantId) {
      try {
        const row = await prisma.experience.findFirst({
          where: { merchantId, type: 'STORE', status: 'ACTIVE' },
          orderBy: [{ slug: 'asc' }, { createdAt: 'asc' }],
          include: includeFrames,
        })
        return row ? mapExperience(row) : null
      } catch (error) {
        if (isExperienceTableUnavailable(error)) return null
        throw error
      }
    },
    async hasAnyByMerchant(merchantId) {
      try {
        return Boolean(await prisma.experience.findFirst({
          where: { merchantId },
          select: { id: true },
        }))
      } catch (error) {
        if (isExperienceTableUnavailable(error)) return false
        throw error
      }
    },
    async findActiveCampaignByMerchantAndSlug(merchantId, slug) {
      try {
        const row = await prisma.experience.findFirst({
          where: { merchantId, slug, type: 'CAMPAIGN', status: 'ACTIVE' },
          include: includeFrames,
        })
        return row ? mapExperience(row) : null
      } catch (error) {
        if (isExperienceTableUnavailable(error)) return null
        throw error
      }
    },
  }
}
