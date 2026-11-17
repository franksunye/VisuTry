import { getAllBlogPosts, getBlogArticleLocales } from '@/lib/blog'
import { getPrescriptionTryOnArticleCopy } from '@/config/prescription-tryon-article-locales'
import { generateMetadata } from '@/app/[locale]/(public)/blog/prescription-glasses-virtual-tryon-guide/page'

const slug = 'prescription-glasses-virtual-tryon-guide'
const path = '/blog/' + slug
const base = 'https://www.visutry.com'

describe('P1 Spanish / French photo try-on article localization', () => {
  it('publishes full native copies, not just translated SEO metadata', () => {
    const en = getPrescriptionTryOnArticleCopy('en')
    const es = getPrescriptionTryOnArticleCopy('es')
    const fr = getPrescriptionTryOnArticleCopy('fr')
    expect(getBlogArticleLocales(slug)).toEqual(['en', 'es', 'fr'])
    for (const copy of [en, es, fr]) {
      expect(copy.title).toBeTruthy()
      expect(copy.startP1.length).toBeGreaterThan(150)
      expect(copy.startP2.length).toBeGreaterThan(150)
      expect(copy.fitP.length).toBeGreaterThan(180)
      expect(copy.creditNote.toLowerCase()).toMatch(/credit|crédito|crédit/)
    }
    expect(es.startHeading).toContain('dos fotos')
    expect(fr.startHeading).toContain('deux photos')
    expect(es.title).not.toEqual(en.title)
    expect(fr.title).not.toEqual(en.title)
  })

  it.each(['en', 'es', 'fr'] as const)('%s has native metadata, self-canonical, reciprocal hreflang', (locale) => {
    const meta = generateMetadata({ params: { locale } })
    expect(meta.title).toBe(getPrescriptionTryOnArticleCopy(locale).title)
    expect(meta.description).toBe(getPrescriptionTryOnArticleCopy(locale).description)
    expect(meta.alternates?.canonical).toBe(base + '/' + locale + path)
    for (const l of ['en', 'es', 'fr'] as const) {
      expect(meta.alternates?.languages?.[l]).toBe(base + '/' + l + path)
    }
    expect(meta.alternates?.languages?.['x-default']).toBe(base + '/en' + path)
  })

  it('does not create a false Japanese translation or self-canonical', () => {
    const meta = generateMetadata({ params: { locale: 'ja' } })
    expect(meta.title).toBe(getPrescriptionTryOnArticleCopy('en').title)
    expect(meta.alternates?.canonical).toBe(base + '/en' + path)
    expect(meta.alternates?.languages?.ja).toBeUndefined()
    expect(getPrescriptionTryOnArticleCopy('ja').language).toBe('en')
  })

  it('renders native titles/descriptions in the already existing localized blog index', async () => {
    const [esPosts, frPosts, jaPosts] = await Promise.all([
      getAllBlogPosts('es'), getAllBlogPosts('fr'), getAllBlogPosts('ja'),
    ])
    const extract = (posts: typeof esPosts) => posts.find(post => post.slug === slug)
    expect(extract(esPosts)?.title).toBe(getPrescriptionTryOnArticleCopy('es').title)
    expect(extract(frPosts)?.description).toBe(getPrescriptionTryOnArticleCopy('fr').description)
    expect(extract(jaPosts)?.title).toBe(getPrescriptionTryOnArticleCopy('en').title)
  })
})
