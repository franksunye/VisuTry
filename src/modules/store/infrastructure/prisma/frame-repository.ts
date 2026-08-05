import type { MerchantFrame } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import type {
  MerchantFrameRecord,
  MerchantFrameRepository,
} from '../../application/ports/repositories'
import type {
  EnrichmentStatus,
  MerchantFrameSource,
  MerchantFrameStatus,
} from '../../domain/enums'

function mapFrame(row: MerchantFrame): MerchantFrameRecord {
  return {
    id: row.id,
    merchantId: row.merchantId,
    sku: row.sku,
    name: row.name,
    imageUrl: row.imageUrl,
    imageAssetId: row.imageAssetId,
    productUrl: row.productUrl,
    price: row.price,
    currency: row.currency,
    shape: row.shape,
    material: row.material,
    color: row.color,
    widthClass: row.widthClass,
    styleTags: row.styleTags,
    source: row.source as MerchantFrameSource,
    externalId: row.externalId,
    enrichmentStatus: row.enrichmentStatus as EnrichmentStatus,
    status: row.status as MerchantFrameStatus,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

export function createPrismaMerchantFrameRepository(): MerchantFrameRepository {
  return {
    async findActiveByMerchant(merchantId) {
      const rows = await prisma.merchantFrame.findMany({
        where: { merchantId, status: 'ACTIVE' },
        orderBy: { updatedAt: 'desc' },
      })
      return rows.map(mapFrame)
    },
    async findByMerchantAndId(merchantId, frameId) {
      const row = await prisma.merchantFrame.findFirst({
        where: { id: frameId, merchantId },
      })
      return row ? mapFrame(row) : null
    },
    async findActiveByMerchantAndId(merchantId, frameId) {
      const row = await prisma.merchantFrame.findFirst({
        where: { id: frameId, merchantId, status: 'ACTIVE' },
      })
      return row ? mapFrame(row) : null
    },
  }
}
