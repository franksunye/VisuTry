import {
  getOrdinaryGlassesDetailCopy,
  interpolateOrdinaryGlassesCopy,
} from '@/config/ordinary-glasses-detail-locales'
import { locales } from '@/i18n'

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
})
