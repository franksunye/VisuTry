/** @jest-environment node */
import { locales } from '@/i18n'
import { getBlogArticleLocales, getAllBlogPosts, blogPostPath } from '@/lib/blog'
import { getNativeAcetateGuide } from '@/config/native-acetate-frame-guide'
import { getNativeBrowlineGuide } from '@/config/native-browline-clubmaster-guide'
import { getNativeFinleyVintageGuide } from '@/config/native-finley-vintage-guide'
import { getNativeTomFordFrameGuide } from '@/config/native-tom-ford-frame-guide'
import { generateMetadata as acetateMeta } from '@/app/[locale]/(public)/blog/acetate-vs-plastic-eyeglass-frames-guide/page'
import { generateMetadata as browlineMeta } from '@/app/[locale]/(public)/blog/browline-clubmaster-glasses-complete-guide/page'
import { generateMetadata as finleyMeta } from '@/app/[locale]/(public)/blog/oliver-peoples-finley-vintage-review/page'
import { generateMetadata as tomFordMeta } from '@/app/[locale]/(public)/blog/tom-ford-luxury-eyewear-guide-2025/page'

const nativeLocales = locales.filter(locale => locale !== 'en')
const guides = [
  { slug: 'acetate-vs-plastic-eyeglass-frames-guide', get: getNativeAcetateGuide, meta: acetateMeta, sections: 4, sources: 2 },
  { slug: 'browline-clubmaster-glasses-complete-guide', get: getNativeBrowlineGuide, meta: browlineMeta, sections: 4, sources: 2 },
  { slug: 'oliver-peoples-finley-vintage-review', get: getNativeFinleyVintageGuide, meta: finleyMeta, sections: 4, sources: 1 },
  { slug: 'tom-ford-luxury-eyewear-guide-2025', get: getNativeTomFordFrameGuide, meta: tomFordMeta, sections: 3, sources: 1 },
] as const

describe('SEO P1 native wave B2: 32 complete material and brand-frame article editions', () => {
  it('provides 32 real native bodies, practical decisions, and primary source links', () => {
    for (const guide of guides) {
      expect(guide.get('en')).toBeNull()
      expect(getBlogArticleLocales(guide.slug)).toEqual(locales)
      for (const locale of nativeLocales) {
        const copy = guide.get(locale)!
        expect(copy).not.toBeNull()
        expect(copy.title.length).toBeGreaterThan(10)
        expect(copy.description.length).toBeGreaterThan(18)
        expect(copy.sections).toHaveLength(guide.sections)
        expect(copy.sections.every(s =>
          s.heading.length >= 6 && s.paragraphs.length > 0
          && s.paragraphs.every(p => p.length >= 65),
        )).toBe(true)
        expect(copy.sources).toHaveLength(guide.sources)
        expect(copy.sources?.every(s => s.label.length >= 8 && s.url.startsWith('https://'))).toBe(true)
        expect(copy.imageAlt.length).toBeGreaterThan(10)
        expect(copy.imageCaption.length).toBeGreaterThan(10)
        expect(copy.creditDisclosure.length).toBeGreaterThan(20)
        expect(copy.tryOnLabel.length).toBeGreaterThan(3)
        expect(blogPostPath(locale, guide.slug)).toBe('/' + locale + '/blog/' + guide.slug)
      }
    }
    expect(guides[0].get('ja')?.sections[2].bullets).toHaveLength(4)
  })

  it('retains explicit model, sizing, material, and no-official-catalog facts across languages', () => {
    for (const locale of nativeLocales) {
      const acetate = getNativeAcetateGuide(locale)!
      const browline = getNativeBrowlineGuide(locale)!
      const finley = getNativeFinleyVintageGuide(locale)!
      const tom = getNativeTomFordFrameGuide(locale)!
      expect(JSON.stringify(acetate.sections)).toMatch(/zyl/i)
      expect(JSON.stringify(browline.sections)).toMatch(/RB5154/)
      expect(JSON.stringify(browline.sections)).toMatch(/RB3016/)
      expect(JSON.stringify(browline.sections)).toMatch(/51[–-]21/)
      expect(JSON.stringify(finley.sections)).toMatch(/OV5397U/)
      expect(JSON.stringify(finley.sections)).toMatch(/49[–-]20/)
      expect(JSON.stringify(finley.sections)).toMatch(/52[–-]20/)
      expect(JSON.stringify(tom.sections)).toMatch(/FT5304/)
      expect(JSON.stringify(tom.sections)).toMatch(/54[–-]19[–-]145/)
      expect(browline.sources?.[0].url).toContain('ray-ban.com')
      expect(finley.sources?.[0].url).toContain('oliverpeoples.com')
      expect(tom.sources?.[0].url).toContain('tomfordfashion.com')
    }
  })

  it('publishes self canonical, nine reciprocal hreflang URLs and native titles', async () => {
    const base = 'https://www.visutry.com'
    for (const guide of guides) {
      for (const locale of nativeLocales) {
        const meta = await guide.meta({ params: { locale } })
        const copy = guide.get(locale)!
        expect(meta.title).toBe(copy.title)
        expect(meta.description).toBe(copy.description)
        expect(meta.alternates?.canonical).toBe(base + '/' + locale + '/blog/' + guide.slug)
        for (const lang of locales) {
          expect(meta.alternates?.languages?.[lang]).toBe(base + '/' + lang + '/blog/' + guide.slug)
        }
      }
    }
  })

  it('keeps precisely 14 original English articles and 86 true article-language URLs', async () => {
    const posts = await getAllBlogPosts()
    expect(posts).toHaveLength(14)
    expect(posts.filter(post => getBlogArticleLocales(post.slug).length === 9)).toHaveLength(13)
    expect(posts.reduce((n, post) => n + getBlogArticleLocales(post.slug).length, 0)).toBe(118)
    expect(getBlogArticleLocales('rayban-glasses-virtual-tryon-guide')).toEqual(['en'])
    expect(getBlogArticleLocales('virtual-try-on-reduce-eyewear-returns')).toEqual(locales)
  })

  it('uses true localized titles/descriptions and image alt text in native index cards', async () => {
    for (const locale of nativeLocales) {
      const posts = await getAllBlogPosts(locale)
      for (const guide of guides) {
        const copy = guide.get(locale)!
        const card = posts.find(post => post.slug === guide.slug)!
        expect(card.title).toBe(copy.title)
        expect(card.description).toBe(copy.description)
        expect(card.coverAlt).toBe(copy.imageAlt)
      }
      expect(posts.find(p => p.slug === 'rayban-glasses-virtual-tryon-guide')?.title)
        .toBe('Ray-Ban Virtual Try On: Compare Iconic Styles on Your Photo')
    }
  })
})
