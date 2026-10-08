export type MerchantCatalogCapacity = {
  limit: number | null
  current: number
  remaining: number | null
  proposedNew: number
  overLimit: number
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
