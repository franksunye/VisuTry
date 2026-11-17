import { test, expect } from '@playwright/test'
import { getNativeChoiceGuide } from '../../src/config/native-choice-between-frames'
import { getNativeFaceFrameGuide } from '../../src/config/native-face-shape-frame-guide'
import { getNativePrescriptionShoppingGuide } from '../../src/config/native-prescription-shopping-guide'
import { getNativeBlogHubText } from '../../src/config/native-blog-hub'
import type { Locale } from '../../src/i18n'

const nativeLocales = ['id', 'ar', 'ru', 'de', 'ja', 'es', 'pt', 'fr'] as const
const guides = [
  { slug: 'find-perfect-glasses-online-guide', copy: getNativeChoiceGuide, sections: 5 },
  { slug: 'how-to-choose-glasses-for-your-face', copy: getNativeFaceFrameGuide, sections: 3 },
  { slug: 'prescription-glasses-online-shopping-guide-2025', copy: getNativePrescriptionShoppingGuide, sections: 4 },
] as const
const root = 'https://www.visutry.com'

// Every new native article gets at least one real 430x932 browser check.
for (const guide of guides) {
  for (const locale of nativeLocales) {
    test('native buyer guide /' + locale + '/blog/' + guide.slug + ' at 430px', async ({ page }) => {
      const copy = guide.copy(locale as Locale)!
      await page.setViewportSize({ width: 430, height: 932 })
      const path = '/' + locale + '/blog/' + guide.slug
      const response = await page.goto(path, { waitUntil: 'domcontentloaded' })
      expect(response?.status()).toBe(200)
      const article = page.locator('article[lang="' + locale + '"]')
      await expect(article).toHaveCount(1)
      await expect(article).toHaveAttribute('dir', locale === 'ar' ? 'rtl' : 'ltr')
      await expect(article.getByRole('heading', { level: 1, name: copy.title })).toBeVisible()
      for (const section of copy.sections) {
        await expect(article.getByRole('heading', { level: 2, name: section.heading })).toHaveCount(1)
        await expect(article).toContainText(section.paragraphs[0].slice(0, 35))
      }
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', root + path)
      for (const lang of ['en', ...nativeLocales]) {
        await expect(page.locator('link[rel="alternate"][hreflang="' + lang + '"]')).toHaveAttribute(
          'href', root + '/' + lang + '/blog/' + guide.slug,
        )
      }
      await expect(article.getByRole('link', { name: copy.tryOnLabel })).toHaveAttribute('href', '/' + locale + '/try-on/glasses')
      const jsonld = await page.locator('script[type="application/ld+json"]').allTextContents()
      expect(jsonld.some(raw => {
        const schema = JSON.parse(raw)
        return schema['@type'] === 'Article' && schema.headline === copy.title && schema.inLanguage === locale
      })).toBe(true)
      if (['es','ja','ar'].includes(locale)) {
        await page.evaluate(() => window.scrollTo(0, 0))
        await page.screenshot({ path: 'test-results/seo-buyer-' + guide.slug + '-' + locale + '-430.png' })
      }
    })
  }
}

for (const guide of guides) {
  for (const locale of ['ja', 'es', 'ar'] as const) {
    test('native ' + locale + ' ' + guide.slug + ' on desktop', async ({ page }) => {
      const copy = guide.copy(locale)!
      await page.setViewportSize({ width: 1440, height: 900 })
      const response = await page.goto('/' + locale + '/blog/' + guide.slug, { waitUntil: 'domcontentloaded' })
      expect(response?.status()).toBe(200)
      await expect(page.getByRole('heading', { level: 1, name: copy.title })).toBeVisible()
      await expect(page.locator('article[lang="' + locale + '"]')).toHaveCount(1)
    })
  }
}

for (const locale of nativeLocales) {
  test('native blog hub ' + locale + ' links to useful localized journeys', async ({ page }) => {
    const text = getNativeBlogHubText(locale)
    await page.setViewportSize({ width: 430, height: 932 })
    const response = await page.goto('/' + locale + '/blog', { waitUntil: 'domcontentloaded' })
    expect(response?.status()).toBe(200)
    await expect(page.getByRole('heading', { level: 1, name: text.title })).toBeVisible()
    await expect(page.getByRole('link', { name: text.exact, exact: true })).toHaveAttribute(
      'href', '/' + locale + '/blog/prescription-glasses-virtual-tryon-guide',
    )
    await expect(page.getByRole('link', { name: text.choice, exact: true })).toHaveAttribute(
      'href', '/' + locale + '/blog/find-perfect-glasses-online-guide',
    )
    await expect(page.getByRole('link', { name: text.detector, exact: true })).toHaveAttribute(
      'href', '/' + locale + '/face-shape-detector',
    )
    const choice = getNativeChoiceGuide(locale)!
    await expect(page.getByRole('heading', { name: choice.title })).toHaveCount(1)
    await expect(page.getByText(text.onlyEnglish, { exact: true }).first()).toBeVisible()
  })
}
