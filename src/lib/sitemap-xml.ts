export type SitemapEntry = {
  url: string
  lastModified?: Date | string
  changeFrequency?: string
  priority?: number
  alternates?: { languages?: Record<string, string | undefined> }
  images?: string[]
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function formatLastModified(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : value
}

export function serializeSitemap(entries: readonly SitemapEntry[]): string {
  const body = entries.map((entry) => {
    const alternates = Object.entries(entry.alternates?.languages || {})
      .filter((entry): entry is [string, string] => typeof entry[1] === 'string')
      .map(([locale, href]) => `    <xhtml:link rel="alternate" hreflang="${escapeXml(locale)}" href="${escapeXml(href)}" />`)
      .join('\n')
    const images = (entry.images || [])
      .map((image) => `    <image:image><image:loc>${escapeXml(image)}</image:loc></image:image>`)
      .join('\n')

    return [
      '  <url>',
      `    <loc>${escapeXml(entry.url)}</loc>`,
      entry.lastModified ? `    <lastmod>${escapeXml(formatLastModified(entry.lastModified))}</lastmod>` : null,
      entry.changeFrequency ? `    <changefreq>${escapeXml(entry.changeFrequency)}</changefreq>` : null,
      typeof entry.priority === 'number' ? `    <priority>${entry.priority}</priority>` : null,
      alternates || null,
      images || null,
      '  </url>',
    ].filter(Boolean).join('\n')
  }).join('\n')

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">',
    body,
    '</urlset>',
  ].join('\n')
}

export function serializeSitemapIndex(locations: readonly string[]): string {
  const body = locations
    .map((location) => `  <sitemap><loc>${escapeXml(location)}</loc></sitemap>`)
    .join('\n')

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    body,
    '</sitemapindex>',
  ].join('\n')
}
