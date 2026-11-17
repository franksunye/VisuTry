import { getBlogArticleLocales, getBlogSitemapEntries } from '@/lib/blog'
import { serializeSitemap, type SitemapEntry } from '@/lib/sitemap-xml'

export const dynamic = 'force-static'

export async function GET() {
  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.visutry.com').replace(/\/+$/, '')
  const blogPagesBase = await getBlogSitemapEntries()
  const entries: SitemapEntry[] = []

  blogPagesBase.forEach((page) => {
    const path = page.url.replace(baseUrl, '')
    const slug = path.replace(/^\/blog\//, '')
    const articleLocales = getBlogArticleLocales(slug)
    const languages: Record<string, string> = Object.fromEntries(
      articleLocales.map((locale) => [locale, `${baseUrl}/${locale}${path}`]),
    )
    languages['x-default'] = `${baseUrl}/en${path}`

    articleLocales.forEach((locale) => {
      entries.push({
        ...page,
        url: `${baseUrl}/${locale}${path}`,
        alternates: { languages },
      })
    })
  })

  return new Response(serializeSitemap(entries), {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=0, must-revalidate',
      'CDN-Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
    },
  })
}
