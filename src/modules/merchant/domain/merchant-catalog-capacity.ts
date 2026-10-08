export type MerchantCatalogCapacity = {
  limit: number | null
  current: number
  remaining: number | null
  proposedNew: number
  overLimit: number
}

export type MerchantCatalogCapacityIdentity = {
  sku: string | null
  source: string
  externalId: string | null
  productUrl: string | null
}

export type MerchantCatalogCapacityGuardQuery = {
  text: string
  params: unknown[]
}

/**
 * Build the final PostgreSQL capacity assertion used by the Cloudflare batch
 * transaction. The caller must first lock the Merchant row in that same
 * transaction. Under READ COMMITTED, this following statement then sees the
 * latest committed Catalog count after any competing import releases the lock.
 *
 * A failed assertion deliberately raises SQLSTATE 22012 (division by zero),
 * causing PostgreSQL to abort and roll back the complete transaction batch.
 */
export function buildMerchantCatalogCapacityGuardQuery(input: {
  merchantId: string
  expectedPlanCode: string | null
  expectedCommercialStatus: string | null
  limit: number | null
  frames: MerchantCatalogCapacityIdentity[]
}): MerchantCatalogCapacityGuardQuery {
  const params: unknown[] = [
    input.merchantId,
    input.expectedPlanCode,
    input.expectedCommercialStatus,
    input.limit,
  ]
  const tuples = input.frames.map((frame) => {
    const start = params.length + 1
    params.push(frame.sku, frame.source, frame.externalId, frame.productUrl)
    return `($${start}::text, $${start + 1}::text, $${start + 2}::text, $${start + 3}::text)`
  }).join(',\n')

  return {
    text: `
      WITH proposed("sku", "source", "externalId", "productUrl") AS MATERIALIZED (
        VALUES ${tuples}
      ),
      merchant AS MATERIALIZED (
        SELECT "id", "planCode", "commercialStatus"
        FROM "Merchant"
        WHERE "id" = $1
      ),
      catalog_count AS MATERIALIZED (
        SELECT count(*)::int AS "current"
        FROM "MerchantFrame" frame
        JOIN merchant ON merchant."id" = frame."merchantId"
      ),
      proposed_additions AS MATERIALIZED (
        SELECT count(*)::int AS "count"
        FROM proposed
        CROSS JOIN merchant
        WHERE NOT EXISTS (
          SELECT 1
          FROM "MerchantFrame" frame
          WHERE frame."merchantId" = merchant."id"
            AND (
              (proposed."sku" IS NOT NULL AND frame."sku" = proposed."sku")
              OR (proposed."externalId" IS NOT NULL AND frame."source"::text = proposed."source" AND frame."externalId" = proposed."externalId")
              OR (proposed."productUrl" IS NOT NULL AND frame."productUrl" = proposed."productUrl")
            )
        )
      ),
      decision AS MATERIALIZED (
        SELECT
          merchant."planCode" IS NOT DISTINCT FROM $2::text
            AND merchant."commercialStatus" IS NOT DISTINCT FROM $3::text
            AND ($4::int IS NULL OR catalog_count."current" + proposed_additions."count" <= $4::int) AS "allowed"
        FROM merchant
        CROSS JOIN catalog_count
        CROSS JOIN proposed_additions
      )
      SELECT 1 / CASE WHEN COALESCE((SELECT bool_or("allowed") FROM decision), FALSE) THEN 1 ELSE 0 END AS "capacityGuard"
    `,
    params,
  }
}

export function merchantCatalogCapacityErrorCode(error: unknown): string | null {
  const seen = new Set<unknown>()
  let current: unknown = error
  while (current && typeof current === 'object' && !seen.has(current)) {
    seen.add(current)
    const row = current as { code?: unknown; cause?: unknown }
    if (typeof row.code === 'string') return row.code
    current = row.cause
  }
  return null
}

export function isMerchantCatalogTransactionConflict(error: unknown): boolean {
  const seen = new Set<unknown>()
  let current: unknown = error
  while (current && typeof current === 'object' && !seen.has(current)) {
    seen.add(current)
    const row = current as { code?: unknown; cause?: unknown }
    if (row.code === 'P2034' || row.code === '40001' || row.code === '40P01') return true
    current = row.cause
  }
  return false
}

/**
 * Summarizes whether a reviewed proposal fits the canonical catalog allowance.
 * The final import mutation remains authoritative because capacity can change
 * after inspection.
 */
export function resolveMerchantCatalogCapacity(input: {
  current: number
  limit: number | null
  proposedNew: number
}): MerchantCatalogCapacity {
  const current = Math.max(0, Math.trunc(input.current))
  const proposedNew = Math.max(0, Math.trunc(input.proposedNew))
  const limit = input.limit == null ? null : Math.max(0, Math.trunc(input.limit))
  const remaining = limit == null ? null : Math.max(0, limit - current)
  const overLimit = remaining == null ? 0 : Math.max(0, proposedNew - remaining)

  return { limit, current, remaining, proposedNew, overLimit }
}
