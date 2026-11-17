import { getAllBlogPosts, getBlogArticleLocales } from '@/lib/blog'
import { locales } from '@/i18n'
import { getPrescriptionTryOnArticleCopy } from '@/config/prescription-tryon-article-locales'
import { generateMetadata } from '@/app/[locale]/(public)/blog/prescription-glasses-virtual-tryon-guide/page'

const slug = 'prescription-glasses-virtual-tryon-guide'
const path = '/blog/' + slug
const base = 'https://www.visutry.com'

describe('P1 all nine languages photo try-on article localization', () => {
  it('publishes full native copies, not just translated SEO metadata', () => {
    const en = getPrescriptionTryOnArticleCopy('en')
    const es = getPrescriptionTryOnArticleCopy('es')
    const fr = getPrescriptionTryOnArticleCopy('fr')
    expect(getBlogArticleLocales(slug)).toEqual(locales)
    for (const copy of locales.map(locale => getPrescriptionTryOnArticleCopy(locale))) {
      expect(copy.title).toBeTruthy()
      expect(copy.startP1.length).toBeGreaterThan(150)
      expect(copy.startP2.length).toBeGreaterThan(150)
      expect(copy.fitP.length).toBeGreaterThan(180)
      expect(copy.creditNote.length).toBeGreaterThan(40)
    }
    expect(es.startHeading).toContain('dos fotos')
    expect(fr.startHeading).toContain('deux photos')
    expect(es.title).not.toEqual(en.title)
    expect(fr.title).not.toEqual(en.title)
  })

  it.each(locales)('%s has native metadata, self-canonical, reciprocal hreflang', (locale) => {
    const meta = generateMetadata({ params: { locale } })
    expect(meta.title).toBe(getPrescriptionTryOnArticleCopy(locale).title)
    expect(meta.description).toBe(getPrescriptionTryOnArticleCopy(locale).description)
    expect(meta.alternates?.canonical).toBe(base + '/' + locale + path)
    for (const l of locales) {
      expect(meta.alternates?.languages?.[l]).toBe(base + '/' + l + path)
    }
    expect(meta.alternates?.languages?.['x-default']).toBe(base + '/en' + path)
  })

  it('publishes Japanese and Arabic native metadata with the correct language', () => {
    const ja = generateMetadata({ params: { locale: 'ja' } })
    const ar = generateMetadata({ params: { locale: 'ar' } })
    expect(ja.title).toBe(getPrescriptionTryOnArticleCopy('ja').title)
    expect(ja.alternates?.canonical).toBe(base + '/ja' + path)
    expect(ar.title).toBe(getPrescriptionTryOnArticleCopy('ar').title)
    expect(ar.alternates?.canonical).toBe(base + '/ar' + path)
  })

  it('renders native titles/descriptions in the already existing localized blog index', async () => {
    const [esPosts, frPosts, jaPosts] = await Promise.all([
      getAllBlogPosts('es'), getAllBlogPosts('fr'), getAllBlogPosts('ja'),
    ])
    const extract = (posts: typeof esPosts) => posts.find(post => post.slug === slug)
    expect(extract(esPosts)?.title).toBe(getPrescriptionTryOnArticleCopy('es').title)
    expect(extract(frPosts)?.description).toBe(getPrescriptionTryOnArticleCopy('fr').description)
    expect(extract(jaPosts)?.title).toBe(getPrescriptionTryOnArticleCopy('ja').title)
  })
})
