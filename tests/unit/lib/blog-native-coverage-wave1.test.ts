import { locales } from '@/i18n'
import { getAllBlogPosts, getBlogArticleLocales, blogPostPath } from '@/lib/blog'
import { getNativeChoiceGuide } from '@/config/native-choice-between-frames'
import { getNativeFaceFrameGuide } from '@/config/native-face-shape-frame-guide'
import { getNativePrescriptionShoppingGuide } from '@/config/native-prescription-shopping-guide'
import { getPrescriptionTryOnArticleCopy } from '@/config/prescription-tryon-article-locales'
import { getNativeBlogHubText } from '@/config/native-blog-hub'
import { generateMetadata as choiceMetadata } from '@/app/[locale]/(public)/blog/find-perfect-glasses-online-guide/page'
import { generateMetadata as faceMetadata } from '@/app/[locale]/(public)/blog/how-to-choose-glasses-for-your-face/page'
import { generateMetadata as orderMetadata } from '@/app/[locale]/(public)/blog/prescription-glasses-online-shopping-guide-2025/page'

const otherLocales = locales.filter(locale => locale !== 'en')
const guides = [
  { slug: 'find-perfect-glasses-online-guide', get: getNativeChoiceGuide, metadata: choiceMetadata, sections: 5 },
  { slug: 'how-to-choose-glasses-for-your-face', get: getNativeFaceFrameGuide, metadata: faceMetadata, sections: 3 },
  { slug: 'prescription-glasses-online-shopping-guide-2025', get: getNativePrescriptionShoppingGuide, metadata: orderMetadata, sections: 4 },
] as const

describe('SEO P1 native coverage wave 1: 30 full article-language editions', () => {
  it('keeps English originals and publishes all eight native languages for three buyer guides', async () => {
    for (const guide of guides) {
      expect(guide.get('en')).toBeNull()
      expect(getBlogArticleLocales(guide.slug)).toEqual(locales)
      for (const locale of otherLocales) {
        const copy = guide.get(locale)
        expect(copy).not.toBeNull()
        expect(copy?.title.length).toBeGreaterThan(12)
        expect(copy?.description.length).toBeGreaterThan(20)
        expect(copy?.sections).toHaveLength(guide.sections)
        expect(copy?.sections.every(section =>
          section.heading.length > 6 && section.paragraphs.every(p => p.length > 55)
        )).toBe(true)
        expect(copy?.creditDisclosure.length).toBeGreaterThan(65)
        expect(blogPostPath(locale, guide.slug)).toBe('/' + locale + '/blog/' + guide.slug)
      }
    }
    expect(guides[1].get('ja')?.sections[0].bullets).toHaveLength(4)
    expect(guides[1].get('ar')?.faq).toHaveLength(2)
    expect(guides[2].get('de')?.sections[3].bullets).toHaveLength(3)
  })

  it('uses actual native article metadata and a reciprocal nine-way hreflang cluster', () => {
    for (const guide of guides) {
      for (const locale of otherLocales) {
        const copy = guide.get(locale)!
        const meta = guide.metadata({ params: { locale } })
        const url = 'https://www.visutry.com/' + locale + '/blog/' + guide.slug
        expect(meta.title).toBe(copy.title)
        expect(meta.description).toBe(copy.description)
        expect(meta.alternates?.canonical).toBe(url)
        for (const lang of locales) {
          expect(meta.alternates?.languages?.[lang]).toBe(
            'https://www.visutry.com/' + lang + '/blog/' + guide.slug,
          )
        }
      }
    }
  })

  it('keeps 14 English owner URLs and only five fully native nine-language articles', async () => {
    const posts = await getAllBlogPosts()
    expect(posts).toHaveLength(14)
    expect(posts.filter(post => getBlogArticleLocales(post.slug).length === 9)).toHaveLength(5)
    expect(posts.reduce((n, post) => n + getBlogArticleLocales(post.slug).length, 0)).toBe(54)
    expect(getBlogArticleLocales('rayban-glasses-virtual-tryon-guide')).toEqual(['en'])
    expect(getBlogArticleLocales('acetate-vs-plastic-eyeglass-frames-guide')).toEqual(['en'])
  })

  it('localizes the blog index, marks English-only articles, and reflects native card copy', async () => {
    for (const locale of otherLocales) {
      const hub = getNativeBlogHubText(locale)
      expect(hub.title.length).toBeGreaterThan(4)
      expect(hub.description.length).toBeGreaterThan(12)
      expect(hub.onlyEnglish.length).toBeGreaterThan(3)
      const posts = await getAllBlogPosts(locale)
      for (const guide of guides) {
        const card = posts.find(p => p.slug === guide.slug)!
        expect(card.title).toBe(guide.get(locale)!.title)
        expect(card.description).toBe(guide.get(locale)!.description)
      }
      const photo = posts.find(p => p.slug === 'prescription-glasses-virtual-tryon-guide')!
      expect(photo.title).toBe(getPrescriptionTryOnArticleCopy(locale).title)
    }
  })

  it('treats country-bound prescription rights as US-only, never global user entitlements', () => {
    for (const locale of otherLocales) {
      const copy = getNativePrescriptionShoppingGuide(locale)!
      const legal = copy.sections[0].paragraphs[1]
      expect(legal).toMatch(/FTC/)
      expect(legal.length).toBeGreaterThan(120)
      expect(copy.sections[3].bullets).toHaveLength(3)
    }
  })
})
