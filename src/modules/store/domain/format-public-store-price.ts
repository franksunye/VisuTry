/** Format a real Store price in minor currency units; absent prices stay absent. */
export function formatPublicStorePrice(price: number | null, currency: string | null): string | null {
  if (price === null || price === undefined || !currency?.trim()) return null
  const code = currency.trim().toUpperCase()
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: code,
    }).format(price / 100)
  } catch {
    return `${(price / 100).toFixed(2)} ${code}`
  }
}
