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

const publicExperienceSelect = {
  id: true,
  merchantId: true,
  type: true,
  slug: true,
  name: true,
  status: true,
  headline: true,
  description: true,
  heroAssetUrl: true,
  referenceData: true,
  updatedAt: true,
  frames: {
    where: { active: true },
    orderBy: [{ sortOrder: 'asc' as const }, { createdAt: 'asc' as const }],
    select: { merchantFrameId: true },
  },
}

type PublicExperienceRow = {
  id: string
  merchantId: string
  type: Experience['type']
  slug: string
  name: string
  status: Experience['status']
  headline: string | null
  description: string | null
  heroAssetUrl: string | null
  referenceData: boolean
  updatedAt: Date
  frames: Array<{ merchantFrameId: string }>
}

function mapPublicExperience(row: PublicExperienceRow): ExperienceRecord {
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
    primaryCtaType: null,
    primaryCtaLabel: null,
    primaryCtaUrl: null,
    secondaryCtaType: null,
    secondaryCtaLabel: null,
    secondaryCtaUrl: null,
    offerLabel: null,
    offerCode: null,
    offerTerms: null,
    startAt: null,
    endAt: null,
    referenceData: row.referenceData,
    defaultSource: null,
    defaultCampaign: null,
    referenceMetadata: null,
    frameIds: row.frames.map((frame) => frame.merchantFrameId),
    createdAt: row.updatedAt,
    updatedAt: row.updatedAt,
  }
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
    async findPublicStoreByMerchant(merchantId) {
      try {
        const rows = await prisma.experience.findMany({
          where: { merchantId, type: 'STORE' },
          orderBy: [{ status: 'asc' }, { slug: 'asc' }, { updatedAt: 'desc' }],
          select: publicExperienceSelect,
        })
        const activeRow = rows.find((row) => row.status === 'ACTIVE')
        const row = activeRow ?? [...rows].sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())[0]
        return row ? mapPublicExperience(row) : null
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
    async findPublicCampaignByMerchantAndSlug(merchantId, slug) {
      try {
        const row = await prisma.experience.findFirst({
          where: { merchantId, slug, type: 'CAMPAIGN' },
          select: publicExperienceSelect,
        })
        return row ? mapPublicExperience(row) : null
      } catch (error) {
        if (isExperienceTableUnavailable(error)) return null
        throw error
      }
    },
  }
}
