import { test, expect } from '@playwright/test'

const slug = 'prescription-glasses-virtual-tryon-guide'
const cases = [
  { locale: 'en', heading: 'How to Try On Prescription Glasses From a Photo', action: 'Try a frame on your photo' },
  { locale: 'id', heading: 'Cara mencoba kacamata berlensa resep dari foto', action: 'Coba bingkai pada foto saya' },
  { locale: 'ar', heading: 'كيف تجرّب النظارات الطبية افتراضيًا باستخدام صورة', action: 'تجربة الإطار على صورتي' },
  { locale: 'ru', heading: 'Как примерить очки с диоптриями по фотографии', action: 'Примерить оправу на своём фото' },
  { locale: 'de', heading: 'Brille mit Sehstärke anhand eines Fotos virtuell anprobieren', action: 'Fassung auf meinem Foto ausprobieren' },
  { locale: 'ja', heading: '写真から度付きメガネをバーチャル試着する方法', action: '自分の写真でフレームを試す' },
  { locale: 'es', heading: 'Cómo probarte gafas graduadas con una foto', action: 'Probar una montura en mi foto' },
  { locale: 'pt', heading: 'Como experimentar óculos graduados a partir de uma fotografia', action: 'Experimentar a armação na minha fotografia' },
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
      for (const locale of ['en', 'id', 'ar', 'ru', 'de', 'ja', 'es', 'pt', 'fr']) {
        await expect(page.locator('link[rel="alternate"][hreflang="' + locale + '"]')).toHaveAttribute(
          'href', 'https://www.visutry.com/' + locale + '/blog/' + slug,
        )
      }
      const schemas = await page.locator('script[type="application/ld+json"]').allTextContents()
      const schema = schemas.map(text => JSON.parse(text)).find(value => value['@type'] === 'Article')
      expect(schema).toMatchObject({ inLanguage: item.locale, headline: item.heading })
      const body = await article.innerText()
      expect(body.length).toBeGreaterThan(item.locale === 'ja' ? 650 : 1200)
      if (viewport.label === 'mobile-430') {
        // A full-height element screenshot scrolls the article under the fixed nav
        // and misrepresents the initial viewport. Capture the real landing state.
        await page.evaluate(() => window.scrollTo(0, 0))
        const title = article.getByRole('heading', { level: 1, name: item.heading })
        const titleBounds = await title.boundingBox()
        expect(titleBounds?.y).toBeGreaterThan(42)
        if (item.locale === 'ar') await expect(article).toHaveAttribute('dir', 'rtl')
        await page.screenshot({ path: 'test-results/seo-blog-' + item.locale + '-430-top.png' })
      }
    })
  }
}

test('JA legacy non-translated article still prefers its English canonical', async ({ page }) => {
  const untranslated = 'acetate-vs-plastic-eyeglass-frames-guide'
  const response = await page.goto('/ja/blog/' + untranslated, { waitUntil: 'domcontentloaded' })
  expect(response?.status()).toBe(200)
  await expect(page.locator('article[lang="en"]')).toHaveCount(1)
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href', 'https://www.visutry.com/en/blog/' + untranslated,
  )
  await expect(page.locator('link[rel="alternate"][hreflang="ja"]')).toHaveCount(0)
})
