import {
  getOrdinaryGlassesDetailCopy,
  getOrdinaryGlassesTemplateShape,
  interpolateOrdinaryGlassesCopy,
} from '@/config/ordinary-glasses-detail-locales'
import { locales } from '@/i18n'
import { FACE_SHAPE_SLUGS, type FaceShapeContentSlug } from '@/config/face-shape-content'

describe('ordinary glasses face-shape detail locale copy', () => {
  it.each(locales)('provides complete, interpolated copy for %s', (locale) => {
    const copy = getOrdinaryGlassesDetailCopy(locale)
    const renderedTitle = interpolateOrdinaryGlassesCopy(copy.title, 'TEST_SHAPE')

    expect(copy.metaTitle).toContain('{shape}')
    expect(copy.metaDescription).toContain('{shape}')
    expect(renderedTitle).toContain('TEST_SHAPE')
    expect(renderedTitle).not.toContain('{shape}')
    expect(copy.badge).toBeTruthy()
    expect(copy.tryFirstTitle).toBeTruthy()
    expect(copy.recommendedTitle).toContain('{shape}')
    expect(copy.workflowTitle).toContain('{shape}')
    expect(copy.faqTitle).toContain('{shape}')
    expect(copy.otherTitle).toBeTruthy()
  })

  it.each(locales.filter((locale) => locale !== 'en'))(
    'does not fall back to English core copy for %s',
    (locale) => {
      const english = getOrdinaryGlassesDetailCopy('en')
      const localized = getOrdinaryGlassesDetailCopy(locale)

      expect(localized.metaTitle).not.toBe(english.metaTitle)
      expect(localized.title).not.toBe(english.title)
      expect(localized.faqAi).not.toBe(english.faqAi)
    },
  )

  it('falls back to English for unsupported locales', () => {
    expect(getOrdinaryGlassesDetailCopy('unsupported')).toEqual(
      getOrdinaryGlassesDetailCopy('en'),
    )
  })
  const expectedTemplateForms: Record<'ru' | 'de', Record<FaceShapeContentSlug, string>> = {
    ru: {
      oval: 'овального',
      round: 'круглого',
      square: 'квадратного',
      heart: 'сердцевидного',
      diamond: 'ромбовидного',
      oblong: 'удлинённого',
      triangle: 'треугольного',
    },
    de: {
      oval: 'ovales',
      round: 'rundes',
      square: 'eckiges',
      heart: 'herzförmiges',
      diamond: 'diamantförmiges',
      oblong: 'längliches',
      triangle: 'dreieckiges',
    },
  }

  describe.each(['ru', 'de'] as const)('%s face-shape grammar', (locale) => {
    it.each(FACE_SHAPE_SLUGS)('renders all shape-dependent copy for %s', (shape) => {
      const copy = getOrdinaryGlassesDetailCopy(locale)
      const inflected = getOrdinaryGlassesTemplateShape(locale, shape, 'UNINFLECTED')
      const requiredPhrase = locale === 'ru'
        ? `${inflected} лица`
        : `${inflected} Gesicht`
      const fields = [
        'metaTitle', 'metaDescription', 'title', 'description', 'characteristicsTitle',
        'recommendedTitle', 'workflowTitle', 'faqTitle', 'faqBest', 'faqAvoid',
      ] as const

      expect(inflected).toBe(expectedTemplateForms[locale][shape])
      expect(interpolateOrdinaryGlassesCopy(copy.metaTitle, inflected)).toContain(
        locale === 'ru' ? `для ${inflected} лица` : `für ein ${inflected} Gesicht`,
      )
      for (const field of fields) {
        const rendered = interpolateOrdinaryGlassesCopy(copy[field], inflected)
        expect(rendered).toContain(requiredPhrase)
        expect(rendered).not.toContain('{shape}')
        expect(rendered).not.toContain('UNINFLECTED')
      }
    })
  })

  it('keeps nominative/default forms for other locales and navigation labels', () => {
    expect(getOrdinaryGlassesTemplateShape('en', 'round', 'Round')).toBe('round')
    expect(getOrdinaryGlassesTemplateShape('fr', 'oval', 'Ovale')).toBe('ovale')
    expect(getOrdinaryGlassesTemplateShape('ja', 'round', '丸型')).toBe('丸型')
    expect(getOrdinaryGlassesTemplateShape('unknown', 'round', 'Round')).toBe('round')
  })
})
