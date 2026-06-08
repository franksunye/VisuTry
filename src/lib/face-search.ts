export function buildGoogleFrameSearchUrl(faceShape: string, style: string): string {
  const query = `best ${style} glasses for ${faceShape} face`
  return `https://www.google.com/search?q=${encodeURIComponent(query)}`
}

export function getFrameSearchStyles(
  catalogStyles?: string[],
  fallbackShape?: string
): string[] {
  if (catalogStyles && catalogStyles.length > 0) {
    return catalogStyles.slice(0, 4)
  }

  if (fallbackShape) {
    return ['aviator', 'clubmaster']
  }

  return []
}
