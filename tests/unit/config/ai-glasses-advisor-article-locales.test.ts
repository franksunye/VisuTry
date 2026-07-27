import { getAiGlassesAdvisorArticleCopy } from '@/config/ai-glasses-advisor-article-locales'
import { locales } from '@/i18n'

describe('AI glasses advisor article locale copy', () => {
  it.each(locales)('provides complete article copy for %s', (locale) => {
    const copy = getAiGlassesAdvisorArticleCopy(locale)

    expect(copy.metaTitle).toBeTruthy()
    expect(copy.metaDescription).toBeTruthy()
    expect(copy.title).toBeTruthy()
    expect(copy.intro).toBeTruthy()
    expect(copy.overview).toHaveLength(2)
    expect(copy.decisionSteps).toHaveLength(4)
    expect(copy.checklist).toHaveLength(3)
    expect(copy.pathDetector).toBeTruthy()
    expect(copy.pathAdvisor).toBeTruthy()
    expect(copy.pathGuide).toBeTruthy()
    expect(copy.pathTryOn).toBeTruthy()
  })

  it.each(locales.filter((locale) => locale !== 'en'))(
    'does not fall back to English acquisition copy for %s',
    (locale) => {
      const english = getAiGlassesAdvisorArticleCopy('en')
      const localized = getAiGlassesAdvisorArticleCopy(locale)

      expect(localized.metaTitle).not.toBe(english.metaTitle)
      expect(localized.title).not.toBe(english.title)
      expect(localized.heroTitle).not.toBe(english.heroTitle)
      expect(localized.finalBody).not.toBe(english.finalBody)
    },
  )

  it('falls back to English for an unsupported locale', () => {
    expect(getAiGlassesAdvisorArticleCopy('unsupported')).toEqual(
      getAiGlassesAdvisorArticleCopy('en'),
    )
  })
})
