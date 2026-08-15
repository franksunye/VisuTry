import { buildCoreSitemapEntries } from '@/lib/sitemap-static'
import { serializeSitemap } from '@/lib/sitemap-xml'

export const dynamic = 'force-static'

export function GET() {
  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.visutry.com').replace(/\/+$/, '')
  return new Response(serializeSitemap(buildCoreSitemapEntries(baseUrl)), {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=0, must-revalidate',
      'CDN-Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
    },
  })
}
