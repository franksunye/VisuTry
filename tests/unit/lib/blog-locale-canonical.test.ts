/** @jest-environment node */
import fs from 'fs'
import path from 'path'
import { locales } from '@/i18n'
import { getAllBlogPosts, getBlogArticleLocales, blogPostPath } from '@/lib/blog'
import { generateBlogArticleSEO } from '@/lib/blog-seo'
import { GET as blogSitemap } from '@/app/sitemaps/blog.xml/route'

const translated = 'ai-face-analysis-for-glasses-guide'
const rayBan = 'rayban-glasses-virtual-tryon-guide'
const spanishFrench = 'prescription-glasses-virtual-tryon-guide'
const englishOnly = 'acetate-vs-plastic-eyeglass-frames-guide'
const fullNative = ['find-perfect-glasses-online-guide', 'how-to-choose-glasses-for-your-face', 'prescription-glasses-online-shopping-guide-2025']

describe('published blog locale contract', () => {
  it('counts only real editorial translations', async () => {
    const posts = await getAllBlogPosts()
    expect(posts).toHaveLength(14)
    expect(getBlogArticleLocales(translated)).toEqual(locales)
    expect(getBlogArticleLocales(rayBan)).toEqual(['en'])
    expect(getBlogArticleLocales(englishOnly)).toEqual(['en'])
    expect(getBlogArticleLocales(spanishFrench)).toEqual(locales)
    fullNative.forEach(slug => expect(getBlogArticleLocales(slug)).toEqual(locales))
    expect(posts.reduce((sum, post) => sum + getBlogArticleLocales(post.slug).length, 0)).toBe(54)
  })

  it('uses the canonical language from blog and tag indexes', () => {
    expect(blogPostPath('de', translated)).toBe('/de/blog/' + translated)
    expect(blogPostPath('fr', englishOnly)).toBe('/en/blog/' + englishOnly)
    expect(blogPostPath('ja', rayBan)).toBe('/en/blog/' + rayBan)
    expect(blogPostPath('en', englishOnly)).toBe('/en/blog/' + englishOnly)
    expect(blogPostPath('es', spanishFrench)).toBe('/es/blog/' + spanishFrench)
    expect(blogPostPath('de', spanishFrench)).toBe('/de/blog/' + spanishFrench)
    expect(blogPostPath('ja', fullNative[0])).toBe('/ja/blog/' + fullNative[0])
  })

  it('keeps old pages indexable but prefers English for an untranslated article', () => {
    const common = { title: 'Example', description: 'Example body', type: 'article' as const }
    const fr = generateBlogArticleSEO({ ...common, locale: 'fr', pathname: '/blog/' + englishOnly })
    const englishUrl = 'https://www.visutry.com/en/blog/' + englishOnly
    expect(fr.alternates?.canonical).toBe(englishUrl)
    expect(fr.alternates?.languages).toEqual({ en: englishUrl, 'x-default': englishUrl })
    expect(fr.robots).toEqual(expect.objectContaining({ index: true, follow: true }))
    expect(fr.openGraph).toEqual(expect.objectContaining({ locale: 'en_US', url: englishUrl }))

    const en = generateBlogArticleSEO({ ...common, locale: 'en', pathname: '/blog/' + englishOnly })
    expect(en.alternates?.canonical).toBe(englishUrl)
    expect(en.alternates?.languages).toEqual({ en: englishUrl, 'x-default': englishUrl })

    const native = generateBlogArticleSEO({ ...common, locale: 'fr', pathname: '/blog/' + translated })
    expect(native.alternates?.canonical).toBe('https://www.visutry.com/fr/blog/' + translated)
    expect(native.alternates?.languages).toEqual(expect.objectContaining({
      en: expect.any(String), fr: expect.any(String), ja: expect.any(String),
    }))
    const spanish = generateBlogArticleSEO({ ...common, locale: 'es', pathname: '/blog/' + spanishFrench })
    expect(spanish.alternates?.canonical).toBe('https://www.visutry.com/es/blog/' + spanishFrench)
    expect(spanish.alternates?.languages).toEqual(expect.objectContaining({
      en: expect.any(String), es: expect.any(String), fr: expect.any(String),
    }))
    const nowJapanese = generateBlogArticleSEO({ ...common, locale: 'ja', pathname: '/blog/' + spanishFrench })
    expect(nowJapanese.alternates?.canonical).toBe('https://www.visutry.com/ja/blog/' + spanishFrench)
    expect(nowJapanese.alternates?.languages?.ja).toBe('https://www.visutry.com/ja/blog/' + spanishFrench)

    expect(() => generateBlogArticleSEO({ ...common, locale: 'en', pathname: '/other' })).toThrow()
  })

  it('emits 54 true article-language sitemap URLs rather than 118 duplicated shells', async () => {
    const response = await blogSitemap()
    expect(response.status).toBe(200)
    const xml = await response.text()
    expect((xml.match(/<loc>/g) || [])).toHaveLength(54)
    expect(xml).toContain('https://www.visutry.com/en/blog/' + englishOnly)
    expect(xml).not.toContain('https://www.visutry.com/fr/blog/' + englishOnly)
    expect(xml).not.toContain('https://www.visutry.com/ja/blog/' + rayBan)
    expect(xml).toContain('https://www.visutry.com/es/blog/' + spanishFrench)
    expect(xml).toContain('https://www.visutry.com/fr/blog/' + spanishFrench)
    expect(xml).toContain('https://www.visutry.com/ja/blog/' + spanishFrench)
    for (const slug of fullNative) {
      for (const locale of locales) expect(xml).toContain('https://www.visutry.com/' + locale + '/blog/' + slug)
    }
    for (const locale of locales) {
      expect(xml).toContain(`https://www.visutry.com/${locale}/blog/${translated}`)
    }
  })

  it('binds all remaining eight English-only article metadata owners to the centralized policy', async () => {
    const posts = await getAllBlogPosts()
    const slugs = posts.filter((p) => getBlogArticleLocales(p.slug).length === 1 && p.slug !== rayBan)
    expect(slugs).toHaveLength(8)
    for (const post of slugs) {
      const source = fs.readFileSync(path.join(
        process.cwd(), 'src', 'app', '[locale]', '(public)', 'blog', post.slug, 'page.tsx',
      ), 'utf8')
      expect(source).toContain('generateBlogArticleSEO({')
    }
  })
})
