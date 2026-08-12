export function productBrandForFrame(frame: {
  brand?: string | null
}): string | null {
  const brand = frame.brand?.trim()
  return brand || null
}
