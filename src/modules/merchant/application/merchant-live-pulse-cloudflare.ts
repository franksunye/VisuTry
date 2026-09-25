import { getCloudflareSql } from '@/data/neon-cloudflare'
import {
  buildMerchantLivePulse,
  merchantLivePulseWindows,
  type MerchantLivePulseActivityRow,
} from '../domain/merchant-live-pulse'

function number(value: unknown): number {
  return Number(value ?? 0)
}

function text(value: unknown): string | null {
  return value == null ? null : String(value)
}

function activityRows(rows: Array<Record<string, unknown>>): MerchantLivePulseActivityRow[] {
  return rows.map((row) => ({
    id: String(row.id),
    type: String(row.type),
    createdAt: row.createdAt instanceof Date ? row.createdAt : String(row.createdAt),
    experienceId: text(row.experienceId),
    experienceType: text(row.experienceType),
    experienceName: text(row.experienceName),
    frameId: text(row.frameId),
    frameName: text(row.frameName),
  }))
}

/** Cloudflare's equivalent bounded read; it shares the same DTO assembler. */
export async function getMerchantLivePulse(input: { merchantId: string; now?: Date }) {
  const now = input.now ?? new Date()
  const { activeSince, activitySince } = merchantLivePulseWindows(now)
  const sql = getCloudflareSql()

  const [activeRows, visitorRows, tryOnRows, productClickRows, eventRows, intentRows] = await Promise.all([
    sql`SELECT count(*)::int AS "count" FROM (
          SELECT s."id"
          FROM "MerchantSession" s JOIN "Merchant" m ON m."id" = s."merchantId"
          WHERE s."merchantId" = ${input.merchantId} AND m."referenceData" = false
            AND s."referenceData" = false AND s."status" = 'ACTIVE'
            AND s."expiresAt" > ${now} AND s."lastActiveAt" >= ${activeSince} AND s."lastActiveAt" < ${now}
          UNION
          SELECT ev."merchantSessionId"
          FROM "MerchantEvent" ev
          JOIN "Merchant" m ON m."id" = ev."merchantId"
          JOIN "MerchantSession" s ON s."id" = ev."merchantSessionId" AND s."merchantId" = ev."merchantId"
          WHERE ev."merchantId" = ${input.merchantId} AND m."referenceData" = false
            AND ev."referenceData" = false AND ev."merchantSessionId" IS NOT NULL
            AND ev."type" IN ('merchant_page_viewed', 'merchant_photo_uploaded', 'merchant_recommendation_started', 'merchant_recommendation_completed', 'merchant_frame_selected', 'merchant_tryon_started', 'merchant_tryon_completed', 'merchant_tryon_failed', 'merchant_compare_started', 'merchant_favorite_saved', 'merchant_product_clicked', 'merchant_inquiry_submitted')
            AND ev."createdAt" >= ${activeSince} AND ev."createdAt" < ${now}
            AND s."referenceData" = false AND s."status" = 'ACTIVE' AND s."expiresAt" > ${now}
          UNION
          SELECT i."merchantSessionId"
          FROM "MerchantIntent" i
          JOIN "Merchant" m ON m."id" = i."merchantId"
          JOIN "MerchantSession" s ON s."id" = i."merchantSessionId" AND s."merchantId" = i."merchantId"
          WHERE i."merchantId" = ${input.merchantId} AND m."referenceData" = false
            AND i."type" IN ('FAVORITE', 'PRODUCT_CLICK', 'INQUIRY')
            AND i."createdAt" >= ${activeSince} AND i."createdAt" < ${now}
            AND s."referenceData" = false AND s."status" = 'ACTIVE' AND s."expiresAt" > ${now}
        ) AS active_sessions`,
    sql`SELECT count(*)::int AS "count"
        FROM "MerchantSession" s JOIN "Merchant" m ON m."id" = s."merchantId"
        WHERE s."merchantId" = ${input.merchantId} AND m."referenceData" = false
          AND s."referenceData" = false AND s."createdAt" >= ${activitySince} AND s."createdAt" < ${now}`,
    sql`SELECT count(*)::int AS "count"
        FROM "MerchantEvent" ev JOIN "Merchant" m ON m."id" = ev."merchantId"
        WHERE ev."merchantId" = ${input.merchantId} AND m."referenceData" = false
          AND ev."referenceData" = false AND ev."type" = 'merchant_tryon_completed'
          AND ev."createdAt" >= ${activitySince} AND ev."createdAt" < ${now}`,
    sql`SELECT count(*)::int AS "count"
        FROM "MerchantIntent" i JOIN "Merchant" m ON m."id" = i."merchantId"
        JOIN "MerchantSession" s ON s."id" = i."merchantSessionId" AND s."merchantId" = i."merchantId"
        WHERE i."merchantId" = ${input.merchantId} AND m."referenceData" = false
          AND s."referenceData" = false AND i."type" = 'PRODUCT_CLICK'
          AND i."createdAt" >= ${activitySince} AND i."createdAt" < ${now}`,
    sql`SELECT ev."id", ev."type", ev."createdAt", e."id" AS "experienceId",
          e."type" AS "experienceType", e."name" AS "experienceName",
          f."id" AS "frameId", f."name" AS "frameName"
        FROM "MerchantEvent" ev JOIN "Merchant" m ON m."id" = ev."merchantId"
        LEFT JOIN "Experience" e ON e."id" = ev."experienceId" AND e."merchantId" = ev."merchantId"
        LEFT JOIN "MerchantFrame" f ON f."id" = ev."merchantFrameId" AND f."merchantId" = ev."merchantId"
        WHERE ev."merchantId" = ${input.merchantId} AND m."referenceData" = false
          AND ev."referenceData" = false
          AND ev."type" IN ('merchant_tryon_completed', 'merchant_compare_started', 'merchant_recommendation_completed')
          AND ev."createdAt" >= ${activitySince} AND ev."createdAt" < ${now}
        ORDER BY ev."createdAt" DESC, ev."id" DESC LIMIT 10`,
    sql`SELECT i."id", i."type"::text AS "type", i."createdAt", e."id" AS "experienceId",
          e."type" AS "experienceType", e."name" AS "experienceName",
          f."id" AS "frameId", f."name" AS "frameName"
        FROM "MerchantIntent" i JOIN "Merchant" m ON m."id" = i."merchantId"
        JOIN "MerchantSession" s ON s."id" = i."merchantSessionId" AND s."merchantId" = i."merchantId"
        LEFT JOIN "Experience" e ON e."id" = i."experienceId" AND e."merchantId" = i."merchantId"
        LEFT JOIN "MerchantFrame" f ON f."id" = i."merchantFrameId" AND f."merchantId" = i."merchantId"
        WHERE i."merchantId" = ${input.merchantId} AND m."referenceData" = false
          AND s."referenceData" = false AND i."type" = 'PRODUCT_CLICK'
          AND i."createdAt" >= ${activitySince} AND i."createdAt" < ${now}
        ORDER BY i."createdAt" DESC, i."id" DESC LIMIT 10`,
  ])

  const count = (rows: Array<Record<string, unknown>>) => number(rows[0]?.count)
  return buildMerchantLivePulse({
    now,
    activeShoppers: count(activeRows as Array<Record<string, unknown>>),
    visitors: count(visitorRows as Array<Record<string, unknown>>),
    tryOnCompletions: count(tryOnRows as Array<Record<string, unknown>>),
    productClicks: count(productClickRows as Array<Record<string, unknown>>),
    events: activityRows(eventRows as Array<Record<string, unknown>>),
    intents: activityRows(intentRows as Array<Record<string, unknown>>),
  })
}
