/** @jest-environment node */
import fs from 'fs'
import path from 'path'
import { locales } from '@/i18n'
import { getAllBlogPosts, getBlogArticleLocales, blogPostPath } from '@/lib/blog'
import { generateBlogArticleSEO } from '@/lib/blog-seo'
import { generateMetadata as rayBanMetadata } from '@/app/[locale]/(public)/blog/rayban-glasses-virtual-tryon-guide/page'
import { GET as blogSitemap } from '@/app/sitemaps/blog.xml/route'

const rayBan = 'rayban-glasses-virtual-tryon-guide'
const advisor = 'ai-face-analysis-for-glasses-guide'
const localizedArticles = [
  'eyewear-trends-2026-glasses-sunglasses',
  'how-to-choose-glasses-for-your-face',
  'best-ai-virtual-glasses-tryon-tools-2025',
  'celebrity-glasses-style-guide-2025',
  'browline-clubmaster-glasses-complete-guide',
  'prescription-glasses-online-shopping-guide-2025',
  'prescription-glasses-virtual-tryon-guide',
  'find-perfect-glasses-online-guide',
  'virtual-try-on-reduce-eyewear-returns',
  'acetate-vs-plastic-eyeglass-frames-guide',
  'oliver-peoples-finley-vintage-review',
  'tom-ford-luxury-eyewear-guide-2025',
]

describe('genuine blog multilingual publication contract', () => {
  it('has 14 published originals, 13 genuine nine-way article owners, and English-only Ray-Ban', async () => {
    const posts = await getAllBlogPosts()
    expect(posts).toHaveLength(14)
    expect(getBlogArticleLocales(advisor)).toEqual(locales)
    for (const slug of localizedArticles) expect(getBlogArticleLocales(slug)).toEqual(locales)
    expect(getBlogArticleLocales(rayBan)).toEqual(['en'])
    expect(posts.reduce((sum, post) => sum + getBlogArticleLocales(post.slug).length, 0)).toBe(118)
  })

  it('links only genuinely translated owner languages from every blog index', () => {
    for (const slug of localizedArticles) {
      for (const locale of locales) expect(blogPostPath(locale, slug)).toBe('/' + locale + '/blog/' + slug)
    }
    expect(blogPostPath('ar', advisor)).toBe('/ar/blog/' + advisor)
    expect(blogPostPath('fr', rayBan)).toBe('/en/blog/' + rayBan)
    expect(blogPostPath('ja', rayBan)).toBe('/en/blog/' + rayBan)
  })

  it('has native metadata with reciprocal nine-way hreflang, while Ray-Ban stays English-only', async () => {
    const common = { title: 'Native content', description: 'Native translated page', type: 'article' as const }
    for (const slug of localizedArticles) {
      for (const locale of locales) {
        const meta = generateBlogArticleSEO({ ...common, locale, pathname: '/blog/' + slug })
        expect(meta.alternates?.canonical).toBe('https://www.visutry.com/' + locale + '/blog/' + slug)
        for (const lang of locales) {
          expect(meta.alternates?.languages?.[lang]).toBe('https://www.visutry.com/' + lang + '/blog/' + slug)
        }
      }
    }
    const en = await rayBanMetadata({ params: { locale: 'en' } })
    const ar = await rayBanMetadata({ params: { locale: 'ar' } })
    expect(en.alternates?.canonical).toBe('https://www.visutry.com/en/blog/' + rayBan)
    expect(ar.alternates?.canonical).toBe('https://www.visutry.com/en/blog/' + rayBan)
    expect(ar.robots).toMatchObject({ index: false })
    expect(ar.alternates?.languages?.ar).toBeUndefined()
    expect(() => generateBlogArticleSEO({ ...common, locale: 'en', pathname: '/not-a-blog' })).toThrow()
  })

  it('publishes 118 unique, authentic blog article-language URLs, not historical English-body shells', async () => {
    const response = await blogSitemap()
    expect(response.status).toBe(200)
    const xml = await response.text()
    const locs = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map(m => m[1])
    expect(locs).toHaveLength(118)
    expect(new Set(locs).size).toBe(118)
    const expected = [advisor, ...localizedArticles]
      .flatMap(slug => locales.map(locale => 'https://www.visutry.com/' + locale + '/blog/' + slug))
      .concat('https://www.visutry.com/en/blog/' + rayBan)
    expect(locs.sort()).toEqual(expected.sort())
    expect(xml).not.toContain('https://www.visutry.com/ja/blog/' + rayBan)
    expect(xml).not.toContain('https://www.visutry.com/ar/blog/' + rayBan)
  })

  it('keeps all 12 original English article modules attached to centralized SEO policy', () => {
    for (const slug of localizedArticles) {
      const source = fs.readFileSync(path.join(
        process.cwd(), 'src', 'app', '[locale]', '(public)', 'blog', slug, 'page.tsx',
      ), 'utf8')
      expect(source).toContain('generateBlogArticleSEO({')
    }
  })
})
