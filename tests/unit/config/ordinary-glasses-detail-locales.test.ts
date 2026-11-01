import {
  getOrdinaryGlassesDetailCopy,
  getOrdinaryGlassesHeadingShape,
  getEnglishOrdinaryGlassesStyleNote,
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

  const expectedEnglishHeadings: Record<FaceShapeContentSlug, string> = {
    oval: 'Oval',
    round: 'Round',
    square: 'Square',
    heart: 'Heart-Shaped',
    diamond: 'Diamond-Shaped',
    oblong: 'Oblong',
    triangle: 'Triangle-Shaped',
  }
  const expectedEnglishPresets: Record<FaceShapeContentSlug, readonly string[]> = {
    oval: ['rectangle-classic', 'browline-classic', 'aviator-classic', 'square-classic'],
    round: ['rectangle-classic', 'square-classic', 'geometric-classic', 'wayfarer-classic'],
    square: ['round-classic', 'oval-classic', 'rimless-light', 'aviator-classic'],
    heart: ['rimless-light', 'round-classic', 'cat-eye-classic', 'bottom-weighted-classic'],
    diamond: ['oval-classic', 'rimless-light', 'cat-eye-classic', 'browline-classic'],
    oblong: ['rectangle-classic', 'oversized-classic', 'browline-classic', 'oversized-square-classic'],
    triangle: ['browline-classic', 'cat-eye-classic', 'aviator-classic', 'geometric-classic'],
  }

  it.each(FACE_SHAPE_SLUGS)('renders natural English headings and four distinct preset notes for %s', (shape) => {
    const copy = getOrdinaryGlassesDetailCopy('en')
    const heading = getOrdinaryGlassesHeadingShape('en', shape, shape)
    const title = interpolateOrdinaryGlassesCopy(copy.title, heading)
    const notes = expectedEnglishPresets[shape].map((id) => getEnglishOrdinaryGlassesStyleNote(shape, id))

    expect(heading).toBe(expectedEnglishHeadings[shape])
    expect(title).toBe(`Best Glasses for ${heading} Faces`)
    expect(interpolateOrdinaryGlassesCopy(copy.metaTitle, heading)).toContain(heading)
    expect(interpolateOrdinaryGlassesCopy(copy.characteristicsTitle, heading))
      .toBe(`Shopping Priorities for ${heading} Faces`)
    expect(notes).toHaveLength(4)
    expect(notes.every((note) => typeof note === 'string' && note.length > 55)).toBe(true)
    expect(new Set(notes).size).toBe(4)
    expect(notes.every((note) => !note?.includes('Recommended frame styles'))).toBe(true)
  })

  it('preserves non-English grammar and does not invent unrelated preset advice', () => {
    expect(getOrdinaryGlassesHeadingShape('ru', 'round', 'круглого')).toBe('круглого')
    expect(getOrdinaryGlassesHeadingShape('de', 'round', 'rundes')).toBe('rundes')
    expect(getOrdinaryGlassesHeadingShape('fr', 'round', 'rond')).toBe('rond')
    expect(getEnglishOrdinaryGlassesStyleNote('round', 'round-classic')).toBeUndefined()
  })
})
