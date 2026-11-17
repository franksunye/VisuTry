import { test, expect } from '@playwright/test'

const slug = 'prescription-glasses-virtual-tryon-guide'
const cases = [
  { locale: 'en', heading: 'How to Try On Prescription Glasses From a Photo', action: 'Try a frame on your photo' },
  { locale: 'es', heading: 'Cómo probarte gafas graduadas con una foto', action: 'Probar una montura en mi foto' },
  { locale: 'fr', heading: 'Essayer des lunettes de vue à partir d’une photo', action: 'Essayer une monture sur ma photo' },
] as const

for (const viewport of [{ label: 'desktop', width: 1440, height: 900 }, { label: 'mobile-430', width: 430, height: 932 }] as const) {
  for (const item of cases) {
    test('native photo try-on article ' + item.locale + ' on ' + viewport.label, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height })
      const route = '/' + item.locale + '/blog/' + slug
      const response = await page.goto(route, { waitUntil: 'domcontentloaded' })
      expect(response?.status()).toBe(200)

      const article = page.locator('article[lang="' + item.locale + '"]')
      await expect(article).toHaveCount(1)
      await expect(article.getByRole('heading', { level: 1, name: item.heading })).toBeVisible()
      await expect(article.getByRole('link', { name: item.action })).toHaveAttribute('href', '/' + item.locale + '/try-on/glasses')
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://www.visutry.com' + route)
      for (const locale of ['en', 'es', 'fr']) {
        await expect(page.locator('link[rel="alternate"][hreflang="' + locale + '"]')).toHaveAttribute(
          'href', 'https://www.visutry.com/' + locale + '/blog/' + slug,
        )
      }
      const schemas = await page.locator('script[type="application/ld+json"]').allTextContents()
      const schema = schemas.map(text => JSON.parse(text)).find(value => value['@type'] === 'Article')
      expect(schema).toMatchObject({ inLanguage: item.locale, headline: item.heading })
      const body = await article.innerText()
      expect(body.length).toBeGreaterThan(1600)
      if (viewport.label === 'mobile-430') {
        await article.screenshot({ path: 'test-results/seo-blog-' + item.locale + '-430.png' })
      }
    })
  }
}

test('JA legacy article shell retains English canonical rather than a false translation', async ({ page }) => {
  const response = await page.goto('/ja/blog/' + slug, { waitUntil: 'domcontentloaded' })
  expect(response?.status()).toBe(200)
  await expect(page.locator('article[lang="en"]')).toHaveCount(1)
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href', 'https://www.visutry.com/en/blog/' + slug,
  )
  await expect(page.locator('link[rel="alternate"][hreflang="ja"]')).toHaveCount(0)
})
