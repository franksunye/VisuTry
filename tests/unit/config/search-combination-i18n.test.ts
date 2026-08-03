import { locales } from '@/i18n'
import { COMBINATION_SEARCH_PAGES } from '@/config/search-combination-pages'
import {
  getCombinationGuideShellCopy,
  getLocalizedCombinationSearchPage,
  getLocalizedCombinationSearchPages,
} from '@/config/search-combination-locales'

describe('Search→Tool Phase B combination guide i18n', () => {
  test('all 30 guides resolve for all 9 locales with localized copy', () => {
    expect(COMBINATION_SEARCH_PAGES).toHaveLength(30)

    for (const locale of locales) {
      const localized = getLocalizedCombinationSearchPages(locale)
      expect(localized).toHaveLength(30)

      for (const source of COMBINATION_SEARCH_PAGES) {
        const page = getLocalizedCombinationSearchPage(locale, source.slug)
        expect(page).toBeDefined()
        expect(page?.slug).toBe(source.slug)
        expect(page?.queryCluster).toBe(source.queryCluster)
        expect(page?.title).toBeTruthy()
        expect(page?.metaDescription).toBeTruthy()
        expect(page?.eyebrow).toBeTruthy()
        expect(page?.intro).toBeTruthy()
        expect(page?.primaryAnswer).toBeTruthy()
        expect(page?.whyItWorks).toBeTruthy()
        expect(page?.watchFor).toBeTruthy()
        expect(page?.decisionTip).toBeTruthy()
        expect(page?.faq).toHaveLength(3)

        if (locale !== 'en') {
          expect(page?.title).not.toBe(source.title)
          expect(page?.primaryAnswer).not.toBe(source.primaryAnswer)
          expect(page?.faq[0].question).not.toBe(source.faq[0].question)
        }
      }
    }
  })

  test('localized guide shell has no English fallback for supported non-English locales', () => {
    const en = getCombinationGuideShellCopy('en')
    for (const locale of locales.filter((item) => item !== 'en')) {
      const shell = getCombinationGuideShellCopy(locale)
      expect(shell.stepShortlist).toBeTruthy()
      expect(shell.faqTitle).toBeTruthy()
      expect(shell.quickAnswer).toBeTruthy()
      expect(shell.viewAllGuides).toBeTruthy()
      expect(shell.stepShortlist).not.toBe(en.stepShortlist)
      expect(shell.faqTitle).not.toBe(en.faqTitle)
    }
  })

  test('all localized guide lists retain the three original query groups', () => {
    for (const locale of locales) {
      const pages = getLocalizedCombinationSearchPages(locale)
      expect(pages.filter((page) => page.type === 'face-frame')).toHaveLength(16)
      expect(pages.filter((page) => page.type === 'gender-style')).toHaveLength(8)
      expect(pages.filter((page) => page.type === 'decision-question')).toHaveLength(6)
    }
  })
})
