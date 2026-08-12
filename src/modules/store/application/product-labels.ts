export function productBrandForFrame(frame: {
  name: string
  collectionTags?: string[] | null
}): string | null {
  if (!frame.collectionTags?.includes('multi-brand')) return null

  const firstWord = frame.name.trim().split(/\s+/)[0]
  return firstWord || null
}
