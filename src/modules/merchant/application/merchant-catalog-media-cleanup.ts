import { del, list } from '@vercel/blob'
import { prisma } from '@/lib/prisma'
import { parseCatalogProductMediaUrl, PRODUCT_IMAGE_ORPHAN_RETENTION_DAYS } from '@/modules/merchant/domain/merchant-catalog-media'

/** Blob-only product files older than 7 days are deleted ONLY on proven DB non-reference. */
export async function cleanupOrphanMerchantCatalogImages({
  now = new Date(), maxDeletes = 50,
}: { now?: Date; maxDeletes?: number } = {}) {
  const cutoff = now.getTime() - PRODUCT_IMAGE_ORPHAN_RETENTION_DAYS * 86400000
  let cursor: string | undefined
  let scanned = 0, eligible = 0, deleted = 0, pages = 0
  do {
    const page = await list({ prefix: 'merchant-catalog/', limit: 1000, ...(cursor ? { cursor } : {}) })
    pages++
    for (const blob of page.blobs) {
      scanned++
      const owned = parseCatalogProductMediaUrl(blob.url)
      const uploadedAt = new Date(blob.uploadedAt).getTime()
      if (!owned || !Number.isFinite(uploadedAt) || uploadedAt >= cutoff) continue
      eligible++
      // DB error or unknown reference => stop, never delete.
      const references = await prisma.merchantFrame.count({
        where: { merchantId: owned.merchantId, imageUrl: owned.url },
      })
      if (references !== 0) continue
      await del(owned.url)
      deleted++
      if (deleted >= maxDeletes) return { scanned, eligible, deleted, pages, truncated: true }
    }
    cursor = page.hasMore ? page.cursor : undefined
  } while (cursor && pages < 4)
  return { scanned, eligible, deleted, pages, truncated: Boolean(cursor) }
}
