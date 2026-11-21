/** @jest-environment node */
import { locales } from '@/i18n'
import { getAllBlogPosts, getBlogArticleLocales, blogPostPath } from '@/lib/blog'
import { getNativeTryOnToolComparison } from '@/config/native-tryon-tools-comparison'
import { getNativeCelebrityPhotoFrameGuide } from '@/config/native-celebrity-frame-photo-guide'
import { getNativeEyewearReturnsStudy } from '@/config/native-eyewear-returns-study'
import { getNative2026Trends, OFFICIAL_2026_TREND_SOURCES } from '@/config/native-eyewear-trends-2026'
import { STYLE_PRESETS_2026, STYLE_GROUPS_2026, STYLE_INTENTS_2026 } from '@/config/native-2026-style-presets'
import { generateMetadata as toolsMetadata } from '@/app/[locale]/(public)/blog/best-ai-virtual-glasses-tryon-tools-2025/page'
import { generateMetadata as celebMetadata } from '@/app/[locale]/(public)/blog/celebrity-glasses-style-guide-2025/page'
import { generateMetadata as returnsMetadata } from '@/app/[locale]/(public)/blog/virtual-try-on-reduce-eyewear-returns/page'
import { generateMetadata as trendsMetadata } from '@/app/[locale]/(public)/blog/eyewear-trends-2026-glasses-sunglasses/page'

const otherLocales = locales.filter(l => l !== 'en')
const entries = [
 { slug: 'best-ai-virtual-glasses-tryon-tools-2025', get: getNativeTryOnToolComparison, meta: toolsMetadata, count: 4 },
 { slug: 'celebrity-glasses-style-guide-2025', get: getNativeCelebrityPhotoFrameGuide, meta: celebMetadata, count: 3 },
 { slug: 'virtual-try-on-reduce-eyewear-returns', get: getNativeEyewearReturnsStudy, meta: returnsMetadata, count: 4 },
] as const
const trendsSlug = 'eyewear-trends-2026-glasses-sunglasses'

describe('SEO P1 final Wave: 32 full article-localized editions', () => {
  it('publishes complete native content, all required sections and use-case boundaries in 8 locales', () => {
    for (const entry of entries) {
      expect(entry.get('en')).toBeNull()
      expect(getBlogArticleLocales(entry.slug)).toEqual(locales)
      for (const locale of otherLocales) {
        const copy = entry.get(locale)!
        expect(copy.title.length).toBeGreaterThan(12)
        expect(copy.description.length).toBeGreaterThan(18)
        expect(copy.imageAlt.length).toBeGreaterThan(10)
        expect(copy.sections).toHaveLength(entry.count)
        for (const section of copy.sections) {
          expect(section.heading.length).toBeGreaterThan(5)
          expect(section.paragraphs.length).toBeGreaterThan(0)
          for (const paragraph of section.paragraphs) expect(paragraph.length).toBeGreaterThan(45)
        }
        expect(blogPostPath(locale, entry.slug)).toBe('/' + locale + '/blog/' + entry.slug)
      }
    }
    expect(getNativeTryOnToolComparison('ja')?.faq).toHaveLength(3)
    expect(getNativeTryOnToolComparison('ar')?.comparisonTable?.rows).toHaveLength(3)
    expect(getNativeCelebrityPhotoFrameGuide('es')?.sections[0].bullets).toHaveLength(3)
    expect(getNativeEyewearReturnsStudy('de')?.sections[3].bullets).toHaveLength(3)
  })

  it('preserves provider boundaries, official collaboration and denominator-complete return statistics', () => {
    for (const locale of otherLocales) {
      const providers = getNativeTryOnToolComparison(locale)!
      expect(JSON.stringify(providers.comparisonTable)).toMatch(/Warby Parker/)
      expect(JSON.stringify(providers.comparisonTable)).toMatch(/Zenni/)
      expect(JSON.stringify(providers.comparisonTable)).toMatch(/VisuTry/)
      expect(providers.sources?.some(s => s.url.includes('warbyparker.com'))).toBe(true)
      expect(providers.sources?.some(s => s.url.includes('zennioptical.com'))).toBe(true)
      const celebrity = getNativeCelebrityPhotoFrameGuide(locale)!
      expect(JSON.stringify(celebrity.sections)).toContain('JENNIE')
      expect(JSON.stringify(celebrity.sections)).toContain('Wispy 01')
      expect(celebrity.sources?.[0].url).toContain('gentlemonster.com')
      const returns = getNativeEyewearReturnsStudy(locale)!
      expect(returns.sections[3].paragraphs).toHaveLength(3)
      expect(returns.sections[3].paragraphs[2]).toMatch(/100/)
      expect(returns.sections[3].paragraphs[2]).toMatch(/3\s*[%％]/)
      expect(returns.merchantCta?.href).toBe('/en/business/pilot')
      expect(returns.merchantCta?.label.length).toBeGreaterThan(12)
    }
  })

  it('keeps original 16 trend images and intensities, 4 groups, 6 intents, 6 decisions, 6 limits and 4 FAQs in every native edition', () => {
    expect(STYLE_PRESETS_2026).toHaveLength(16)
    expect(new Set(STYLE_PRESETS_2026.map(frame => frame.id)).size).toBe(16)
    expect(STYLE_GROUPS_2026).toHaveLength(4)
    expect(STYLE_INTENTS_2026).toHaveLength(6)
    expect(getNative2026Trends('en')).toBeNull()
    for (const locale of otherLocales) {
      const copy = getNative2026Trends(locale)!
      expect(copy.title.length).toBeGreaterThan(14)
      expect(copy.lead.length).toBeGreaterThan(100)
      expect(copy.groups).toHaveLength(4)
      expect(copy.intents).toHaveLength(6)
      expect(copy.cards).toHaveLength(16)
      expect(copy.steps).toHaveLength(6)
      expect(copy.limits).toHaveLength(6)
      expect(copy.faq).toHaveLength(4)
      expect(copy.labels.tags).toHaveLength(26)
      expect(copy.groups.flatMap(g => g.frames.map(x => x.id))).toEqual(STYLE_PRESETS_2026.map(frame => frame.id))
      expect(copy.intents.every(i => i.frames.length === 3)).toBe(true)
      for (let idx=0; idx<16; idx++) {
        const frame = copy.cards[idx]
        expect(frame.id).toBe(STYLE_PRESETS_2026[idx].id)
        expect(frame.image).toBe(STYLE_PRESETS_2026[idx].image)
        expect(frame.intensity).toBe(STYLE_PRESETS_2026[idx].intensity)
        expect(frame.name.length).toBeGreaterThan(5)
        expect(frame.signal.length).toBeGreaterThan(10)
        expect(frame.bestFor.length).toBeGreaterThan(10)
        expect(frame.tags).toHaveLength(3)
      }
      expect(getBlogArticleLocales(trendsSlug)).toEqual(locales)
    }
    expect(OFFICIAL_2026_TREND_SOURCES).toHaveLength(2)
    expect(OFFICIAL_2026_TREND_SOURCES[0].url).toContain('chanel.com')
    expect(OFFICIAL_2026_TREND_SOURCES[1].url).toContain('press.rimowa.com')
  })

  it('emits nine reciprocal hreflangs and self-canonicals for the final four articles', async () => {
    for (const locale of otherLocales) {
      for (const entry of entries) {
        const meta = await entry.meta({ params: { locale } })
        const url = 'https://www.visutry.com/' + locale + '/blog/' + entry.slug
        expect(meta.title).toBe(entry.get(locale)!.title)
        expect(meta.description).toBe(entry.get(locale)!.description)
        expect(meta.alternates?.canonical).toBe(url)
        for (const lang of locales) {
          expect(meta.alternates?.languages?.[lang]).toBe('https://www.visutry.com/' + lang + '/blog/' + entry.slug)
        }
      }
      const trendMeta = await trendsMetadata({ params: { locale } })
      expect(trendMeta.title).toBe(getNative2026Trends(locale)?.title)
      expect(trendMeta.alternates?.canonical).toBe('https://www.visutry.com/' + locale + '/blog/' + trendsSlug)
      for (const lang of locales) {
        expect(trendMeta.alternates?.languages?.[lang]).toBe('https://www.visutry.com/' + lang + '/blog/' + trendsSlug)
      }
    }
  })

  it('renders actual localized card descriptions while preserving EN-only Ray-Ban source', async () => {
    for (const locale of otherLocales) {
      const posts = await getAllBlogPosts(locale)
      for (const entry of entries) {
        const card = posts.find(p => p.slug === entry.slug)!
        expect(card.title).toBe(entry.get(locale)!.title)
        expect(card.description).toBe(entry.get(locale)!.description)
        expect(card.coverAlt).toBe(entry.get(locale)!.imageAlt)
      }
      const trend = posts.find(p => p.slug === trendsSlug)!
      expect(trend.title).toBe(getNative2026Trends(locale)?.title)
      expect(trend.description).toBe(getNative2026Trends(locale)?.description)
      expect(blogPostPath(locale, 'rayban-glasses-virtual-tryon-guide')).toBe('/en/blog/rayban-glasses-virtual-tryon-guide')
    }
    const posts = await getAllBlogPosts()
    expect(posts).toHaveLength(14)
    expect(posts.reduce((sum,p) => sum + getBlogArticleLocales(p.slug).length, 0)).toBe(118)
  })
})
