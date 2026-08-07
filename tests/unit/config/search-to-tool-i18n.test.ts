import { locales } from '@/i18n'
import { getSearchToToolLandingCopy } from '@/config/search-to-tool-locales'
import { getSearchToToolRouteCopy, type SearchToToolPhaseARouteId } from '@/config/search-to-tool-route-copy'
import { getSearchToToolShellCopy } from '@/config/search-to-tool-shell-locales'
import { getGlassesGuideHubCopy } from '@/config/glasses-guide-hub-locales'
import { getAlternateLanguages } from '@/lib/seo'
import { normalizeSearchToToolUrl } from '@/lib/search-to-tool-seo'

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
    const en = getSearchToToolRouteCopy('en', routeId)

    for (const locale of locales) {
      const copy = getSearchToToolRouteCopy(locale, routeId)
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
        // Product/brand names such as "AI Glasses Advisor" may intentionally
        // remain identical across locales; localized explanatory content must not.
        expect(copy.faq[0].question).not.toBe(en.faq[0].question)
      }
    }
  })

  test('overlapping query clusters keep distinct route-level intent in every locale', () => {
    for (const locale of locales) {
      const find = getSearchToToolRouteCopy(locale, 'find-glasses-for-my-face')
      const suits = getSearchToToolRouteCopy(locale, 'what-glasses-suit-my-face')
      const photoTryOn = getSearchToToolRouteCopy(locale, 'try-glasses-on-photo')
      const virtualTryOn = getSearchToToolRouteCopy(locale, 'virtual-glasses-try-on')

      expect(suits.steps).not.toEqual(find.steps)
      expect(suits.faq).not.toEqual(find.faq)
      expect(suits.howTo).not.toEqual(find.howTo)
      expect(virtualTryOn.steps).not.toEqual(photoTryOn.steps)
      expect(virtualTryOn.faq).not.toEqual(photoTryOn.faq)
      expect(virtualTryOn.software).not.toEqual(photoTryOn.software)
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

  test('glasses guide hub is localized for users while Phase B indexing remains deferred', () => {
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

  test('hreflang helper emits all locales plus x-default for indexed Phase A landings', () => {
    const alternates = getAlternateLanguages('/what-is-my-face-shape')
    expect(Object.keys(alternates)).toHaveLength(locales.length + 1)
    for (const locale of locales) {
      expect(alternates[locale]).toContain(`/${locale}/what-is-my-face-shape`)
    }
    expect(alternates['x-default']).toContain('/en/what-is-my-face-shape')
  })

  test('normalizes duplicate slash in absolute canonical and hreflang URLs', () => {
    expect(normalizeSearchToToolUrl('https://example.com//ja/what-is-my-face-shape'))
      .toBe('https://example.com/ja/what-is-my-face-shape')
    expect(normalizeSearchToToolUrl('https://example.com/ja/what-is-my-face-shape'))
      .toBe('https://example.com/ja/what-is-my-face-shape')
  })
})
