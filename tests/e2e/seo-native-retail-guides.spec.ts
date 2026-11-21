import { expect, test } from '@playwright/test'
import { getNativeAcetateGuide } from '../../src/config/native-acetate-frame-guide'
import { getNativeBrowlineGuide } from '../../src/config/native-browline-clubmaster-guide'
import { getNativeFinleyVintageGuide } from '../../src/config/native-finley-vintage-guide'
import { getNativeTomFordFrameGuide } from '../../src/config/native-tom-ford-frame-guide'

const locales = ['id', 'ar', 'ru', 'de', 'ja', 'es', 'pt', 'fr'] as const
const allLocales = ['en', ...locales]
const entries = [
  { slug: 'acetate-vs-plastic-eyeglass-frames-guide', get: getNativeAcetateGuide },
  { slug: 'browline-clubmaster-glasses-complete-guide', get: getNativeBrowlineGuide },
  { slug: 'oliver-peoples-finley-vintage-review', get: getNativeFinleyVintageGuide },
  { slug: 'tom-ford-luxury-eyewear-guide-2025', get: getNativeTomFordFrameGuide },
] as const

// Real Next.js rendered HTML, no production services or personal photo data.
for (const entry of entries) {
  for (const locale of locales) {
    test('native retail article ' + entry.slug + ' in ' + locale + ' on 430px mobile', async ({ page }) => {
      await page.setViewportSize({ width: 430, height: 932 })
      const urlPath = '/' + locale + '/blog/' + entry.slug
      const response = await page.goto(urlPath, { waitUntil: 'domcontentloaded' })
      expect(response?.status()).toBe(200)
      const article = page.locator('article[lang="' + locale + '"]')
      const copy = entry.get(locale)!
      await expect(article).toHaveCount(1)
      await expect(article).toHaveAttribute('dir', locale === 'ar' ? 'rtl' : 'ltr')
      await expect(article.getByRole('heading', { name: copy.title, level: 1 })).toBeVisible()
      for (const section of copy.sections) {
        await expect(article.getByRole('heading', { name: section.heading, level: 2 })).toHaveCount(1)
        for (const p of section.paragraphs) await expect(article).toContainText(p.slice(0, 20))
      }
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
        'href', 'https://www.visutry.com' + urlPath,
      )
      for (const alternate of allLocales) {
        await expect(page.locator('link[rel="alternate"][hreflang="' + alternate + '"]')).toHaveAttribute(
          'href', 'https://www.visutry.com/' + alternate + '/blog/' + entry.slug,
        )
      }
      const ld = await page.locator('script[type="application/ld+json"]').allTextContents()
      expect(ld.map(text => JSON.parse(text)).some(
        v => v['@type'] === 'Article' && v.headline === copy.title && v.inLanguage === locale,
      )).toBe(true)
      const sourceArea = article.locator('[data-native-sources="true"]')
      await expect(sourceArea).toHaveCount(1)
      for (const source of copy.sources || []) {
        await expect(sourceArea.getByRole('link', { name: source.label, exact: true })).toHaveAttribute('href', source.url)
      }
      await expect(article.getByRole('link', { name: copy.tryOnLabel, exact: true }))
        .toHaveAttribute('href', '/' + locale + '/try-on/glasses')
      const image = article.locator('img').first()
      await expect.poll(async () => image.evaluate(img => (img as HTMLImageElement).naturalWidth)).toBeGreaterThan(0)
      if (['ar', 'ja', 'es'].includes(locale)) {
        await page.evaluate(() => window.scrollTo(0, 0))
        await page.screenshot({ path: 'test-results/seo-retail-' + entry.slug + '-' + locale + '-430.png' })
      }
    })
  }
  for (const locale of ['es', 'ja'] as const) {
    test('native retail desktop ' + entry.slug + ' in ' + locale, async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 })
      const response = await page.goto('/' + locale + '/blog/' + entry.slug, { waitUntil: 'domcontentloaded' })
      expect(response?.status()).toBe(200)
      await expect(page.getByRole('heading', { name: entry.get(locale)!.title, level: 1 })).toBeVisible()
      await expect(page.locator('article[lang="' + locale + '"]')).toHaveCount(1)
    })
  }
}

for (const locale of ['es', 'ja', 'ar'] as const) {
  test('blog cards now direct ' + locale + ' shoppers to real translated retail guides', async ({ page }) => {
    const response = await page.goto('/' + locale + '/blog', { waitUntil: 'domcontentloaded' })
    expect(response?.status()).toBe(200)
    for (const entry of entries) {
      const title = entry.get(locale)!.title
      await expect(page.getByRole('heading', { name: title, level: 2 })).toHaveCount(1)
      await expect(page.getByRole('link', { name: title, exact: true })).toHaveAttribute(
        'href', '/' + locale + '/blog/' + entry.slug,
      )
    }
  })
}
