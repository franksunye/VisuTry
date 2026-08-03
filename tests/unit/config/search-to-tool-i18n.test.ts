import { locales } from '@/i18n'
import { getSearchToToolLandingCopy } from '@/config/search-to-tool-locales'
import { getSearchToToolPhaseACopy, type SearchToToolPhaseARouteId } from '@/config/search-to-tool-phase-a-locales'
import { getSearchToToolShellCopy } from '@/config/search-to-tool-shell-locales'
import { getGlassesGuideHubCopy } from '@/config/glasses-guide-hub-locales'
import { getAlternateLanguages } from '@/lib/seo'

const phaseARoutes: SearchToToolPhaseARouteId[] = [
  'find-glasses-for-my-face',
  'try-glasses-on-photo',
  'ai-glasses-advisor',
  'what-glasses-suit-my-face',
  'virtual-glasses-try-on',
  'compare-glasses-frames',
]

describe('Search→Tool Phase A i18n', () => {
  test('what-is-my-face-shape has complete copy for all supported locales', () => {
    const en = getSearchToToolLandingCopy('en', 'what-is-my-face-shape')

    for (const locale of locales) {
      const copy = getSearchToToolLandingCopy(locale, 'what-is-my-face-shape')
      expect(copy.metaTitle).toBeTruthy()
      expect(copy.metaDescription).toBeTruthy()
      expect(copy.title).toBeTruthy()
      expect(copy.steps).toHaveLength(3)
      expect(copy.principles).toHaveLength(3)
      expect(copy.faq).toHaveLength(3)
      expect(copy.howTo.steps).toHaveLength(3)
      expect(copy.ctaLabels.detector).toBeTruthy()

      if (locale !== 'en') {
        expect(copy.title).not.toBe(en.title)
        expect(copy.faq[0].question).not.toBe(en.faq[0].question)
      }
    }
  })

  test.each(phaseARoutes)('%s has complete localized copy for all supported locales', (routeId) => {
    const en = getSearchToToolPhaseACopy('en', routeId)

    for (const locale of locales) {
      const copy = getSearchToToolPhaseACopy(locale, routeId)
      expect(copy.metaTitle).toBeTruthy()
      expect(copy.metaDescription).toBeTruthy()
      expect(copy.eyebrow).toBeTruthy()
      expect(copy.title).toBeTruthy()
      expect(copy.intro).toBeTruthy()
      expect(copy.steps).toHaveLength(3)
      expect(copy.principles).toHaveLength(3)
      expect(copy.faq).toHaveLength(3)
      expect(copy.faqTitle).toBeTruthy()
      expect(copy.faqEyebrow).toBeTruthy()
      expect(copy.ctaLabels.detector).toBeTruthy()
      expect(copy.ctaLabels.tryOn).toBeTruthy()
      expect(copy.ctaLabels.compare).toBeTruthy()
      expect(copy.ctaLabels.advisor).toBeTruthy()

      if (copy.kind === 'selection') {
        expect(copy.howTo?.steps).toHaveLength(3)
      } else {
        expect(copy.software?.featureList).toHaveLength(4)
      }

      if (locale !== 'en') {
        expect(copy.title).not.toBe(en.title)
        expect(copy.faq[0].question).not.toBe(en.faq[0].question)
      }
    }
  })

  test('shared shell defaults are localized for every non-English locale', () => {
    const en = getSearchToToolShellCopy('en')
    for (const locale of locales) {
      const copy = getSearchToToolShellCopy(locale)
      expect(copy.commonQuestions).toBeTruthy()
      expect(copy.nextStep).toBeTruthy()
      expect(copy.detector).toBeTruthy()
      expect(copy.tryOn).toBeTruthy()
      expect(copy.compare).toBeTruthy()
      expect(copy.advisor).toBeTruthy()
      if (locale !== 'en') expect(copy.commonQuestions).not.toBe(en.commonQuestions)
    }
  })

  test('glasses guide hub is localized while Phase B remains explicitly deferred', () => {
    const en = getGlassesGuideHubCopy('en')
    expect(en.englishGuidesNote).toBe('')

    for (const locale of locales.filter((locale) => locale !== 'en')) {
      const copy = getGlassesGuideHubCopy(locale)
      expect(copy.title).not.toBe(en.title)
      expect(copy.englishGuidesNote).toBeTruthy()
      expect(copy.groups.faceFrame.title).toBeTruthy()
      expect(copy.groups.genderStyle.title).toBeTruthy()
      expect(copy.groups.decisionQuestion.title).toBeTruthy()
    }
  })

  test('hreflang helper emits all locales plus x-default', () => {
    const alternates = getAlternateLanguages('/what-is-my-face-shape')
    expect(Object.keys(alternates)).toHaveLength(locales.length + 1)
    for (const locale of locales) {
      expect(alternates[locale]).toContain(`/${locale}/what-is-my-face-shape`)
    }
    expect(alternates['x-default']).toContain('/en/what-is-my-face-shape')
  })
})
