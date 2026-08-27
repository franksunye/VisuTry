import type { Merchant, MerchantStatus as PrismaMerchantStatus } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import type { MerchantRecord, MerchantRepository } from '../../application/ports/repositories'
import type { MerchantStatus } from '../../domain/enums'

function mapMerchant(row: Merchant): MerchantRecord {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    logoUrl: row.logoUrl,
    websiteUrl: row.websiteUrl,
    contactEmail: row.contactEmail,
    accentColor: row.accentColor,
    status: row.status as MerchantStatus,
    classification: row.classification,
    pilotType: row.pilotType,
    sponsoredUsagePolicyKey: row.sponsoredUsagePolicyKey,
    referenceData: row.referenceData,
    defaultSource: row.defaultSource,
    defaultCampaign: row.defaultCampaign,
    tryOnEnabled: row.tryOnEnabled,
    compareEnabled: row.compareEnabled,
    maxCompareFrames: row.maxCompareFrames,
    inquiryEnabled: row.inquiryEnabled,
    planCode: row.planCode,
    commercialStage: row.commercialStage,
    pricingVersion: row.pricingVersion,
    entitlementVersion: row.entitlementVersion,
    commerceSessionAllowance: row.commerceSessionAllowance,
    standardRenderAllowance: row.standardRenderAllowance,
    premiumRenderAllowance: row.premiumRenderAllowance,
    campaignAllowance: row.campaignAllowance,
    entitlementEffectiveFrom: row.entitlementEffectiveFrom,
    billingPeriodEnd: row.billingPeriodEnd,
    commercialExceptionCode: row.commercialExceptionCode,
    commercialStatus: row.commercialStatus,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

export function createPrismaMerchantRepository(): MerchantRepository {
  return {
    async findPublicBySlug(slug) {
      const row = await prisma.merchant.findUnique({
        where: { slug },
        select: {
          id: true,
          slug: true,
          name: true,
          logoUrl: true,
          websiteUrl: true,
          accentColor: true,
          status: true,
          classification: true,
          pilotType: true,
          sponsoredUsagePolicyKey: true,
          referenceData: true,
          updatedAt: true,
        },
      })
      if (!row) return null
      return {
        id: row.id,
        slug: row.slug,
        name: row.name,
        logoUrl: row.logoUrl,
        websiteUrl: row.websiteUrl,
        contactEmail: null,
        accentColor: row.accentColor,
        status: row.status as MerchantStatus,
        classification: row.classification,
        pilotType: row.pilotType,
        sponsoredUsagePolicyKey: row.sponsoredUsagePolicyKey,
        referenceData: row.referenceData,
        defaultSource: null,
        defaultCampaign: null,
        tryOnEnabled: true,
        compareEnabled: true,
        maxCompareFrames: 2,
        inquiryEnabled: false,
        planCode: null,
        commercialStage: null,
        pricingVersion: null,
        entitlementVersion: null,
        commerceSessionAllowance: null,
        standardRenderAllowance: null,
        premiumRenderAllowance: null,
        campaignAllowance: null,
        entitlementEffectiveFrom: null,
        billingPeriodEnd: null,
        commercialExceptionCode: null,
        commercialStatus: null,
        createdAt: row.updatedAt,
        updatedAt: row.updatedAt,
      }
    },
    async findBySlug(slug) {
      const row = await prisma.merchant.findUnique({ where: { slug } })
      return row ? mapMerchant(row) : null
    },
    async findById(merchantId) {
      const row = await prisma.merchant.findUnique({ where: { id: merchantId } })
      return row ? mapMerchant(row) : null
    },
    async listAllAdmin(limit = 50) {
      const rows = await prisma.merchant.findMany({
        take: limit,
        orderBy: { createdAt: 'desc' },
      })
      return rows.map(mapMerchant)
    },
  }
}

export function isActiveMerchantStatus(status: PrismaMerchantStatus | MerchantStatus): boolean {
  return status === 'ACTIVE'
}
