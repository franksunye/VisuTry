import { validatePublicHtmlDocument } from './public-html-release'

/**
 * One-time, explicitly allowlisted repair for two stale Cloudflare HTML objects.
 * No wildcard, prefix, hostname, cache-tag, or purge-everything operation.
 * This does not extend the seven-route Public HTML Worker release contract.
 */
export const SEO_EDGE_CACHE_TARGETS = [
  { path: '/ru/style/round-face', title: 'Лучшие очки для круглого лица' },
  { path: '/de/style/round-face', title: 'Beste Brillen für ein rundes Gesicht' },
] as const

export function seoEdgeExactPurgeBody(): { files: string[] } {
  const files = SEO_EDGE_CACHE_TARGETS.map(({ path }) => `https://www.visutry.com${path}`)
  if (files.length !== 2 || new Set(files).size !== 2 || files.some((url) => {
    const parsed = new URL(url)
    return parsed.origin !== 'https://www.visutry.com'
      || parsed.search !== '' || parsed.hash !== ''
      || !SEO_EDGE_CACHE_TARGETS.some(({ path }) => path === parsed.pathname)
  })) {
    throw new Error('unsafe SEO edge purge targets')
  }
  return { files }
}

function normalizeVisibleText(value: string): string {
  return value.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
}

export function validateSeoEdgeOriginDocument(
  target: (typeof SEO_EDGE_CACHE_TARGETS)[number],
  response: Response,
  html: string,
): string[] {
  const errors = validatePublicHtmlDocument(target.path, response, html)
  const title = html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1]
  const h1 = html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1]
  if (!title || normalizeVisibleText(title) !== target.title) {
    errors.push(`expected new title ${target.title}`)
  }
  if (!h1 || normalizeVisibleText(h1) !== target.title) {
    errors.push(`expected new H1 ${target.title}`)
  }
  const robotTags = html.match(/<meta\b[^>]*name=["']robots["'][^>]*>/gi) ?? []
  if (robotTags.some((tag) => /noindex/i.test(tag)) || /noindex/i.test(response.headers.get('x-robots-tag') ?? '')) {
    errors.push('origin is noindex')
  }
  return errors
}
