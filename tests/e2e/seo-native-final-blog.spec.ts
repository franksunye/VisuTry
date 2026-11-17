import { expect, test } from '@playwright/test'
import { getNativeTryOnToolComparison } from '../../src/config/native-tryon-tools-comparison'
import { getNativeCelebrityPhotoFrameGuide } from '../../src/config/native-celebrity-frame-photo-guide'
import { getNativeEyewearReturnsStudy } from '../../src/config/native-eyewear-returns-study'
import { getNative2026Trends, OFFICIAL_2026_TREND_SOURCES } from '../../src/config/native-eyewear-trends-2026'
import { STYLE_PRESETS_2026 } from '../../src/config/native-2026-style-presets'
import { getAllBlogPosts } from '../../src/lib/blog'

const locales = ['id', 'ar', 'ru', 'de', 'ja', 'es', 'pt', 'fr'] as const
const all = ['en', ...locales]
const cases = [
  { slug: 'best-ai-virtual-glasses-tryon-tools-2025', copy: getNativeTryOnToolComparison, sectionCount: 4 },
  { slug: 'celebrity-glasses-style-guide-2025', copy: getNativeCelebrityPhotoFrameGuide, sectionCount: 3 },
  { slug: 'virtual-try-on-reduce-eyewear-returns', copy: getNativeEyewearReturnsStudy, sectionCount: 4 },
] as const

for (const item of cases) {
  for (const locale of locales) {
    test('full native ' + item.slug + ' in ' + locale + ' at 430px', async ({ page }) => {
      const copy = item.copy(locale)!
      const path = '/' + locale + '/blog/' + item.slug
      await page.setViewportSize({ width: 430, height: 932 })
      const response = await page.goto(path, { waitUntil: 'domcontentloaded' })
      expect(response?.status()).toBe(200)
      const article = page.locator('article[lang="' + locale + '"]')
      await expect(article).toHaveCount(1)
      await expect(article).toHaveAttribute('dir', locale === 'ar' ? 'rtl' : 'ltr')
      await expect(article.getByRole('heading', { level: 1, name: copy.title })).toBeVisible()
      for (const section of copy.sections) {
        await expect(article.getByRole('heading', { level: 2, name: section.heading })).toHaveCount(1)
        await expect(article).toContainText(section.paragraphs[0].slice(0, 18))
      }
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://www.visutry.com' + path)
      for (const lang of all) {
        await expect(page.locator('link[rel="alternate"][hreflang="' + lang + '"]')).toHaveAttribute(
          'href', 'https://www.visutry.com/' + lang + '/blog/' + item.slug,
        )
      }
      const structured = await page.locator('script[type="application/ld+json"]').allTextContents()
      expect(structured.map(x => JSON.parse(x)).some(x =>
        x['@type'] === 'Article' && x.headline === copy.title && x.inLanguage === locale
      )).toBe(true)
      if (item.slug === 'best-ai-virtual-glasses-tryon-tools-2025') {
        const table = article.locator('[data-native-comparison="true"]')
        await expect(table).toHaveCount(1)
        await expect(table.locator('tbody tr')).toHaveCount(3)
        await expect(article.getByRole('heading', { level: 3 })).toHaveCount(3)
      }
      if (item.slug === 'celebrity-glasses-style-guide-2025') {
        await expect(article).toContainText('Wispy 01')
        await expect(article.locator('[data-native-sources="true"] a')).toHaveCount(1)
      }
      if (item.slug === 'virtual-try-on-reduce-eyewear-returns') {
        await expect(article).toContainText('100')
        await expect(article).toContainText(/3\s*[%％]/)
        await expect(article.getByRole('link', { name: copy.merchantCta!.label, exact: true }))
          .toHaveAttribute('href', '/en/business/pilot')
      }
      if (['es', 'ja', 'ar'].includes(locale)) {
        await page.evaluate(() => window.scrollTo(0, 0))
        await page.screenshot({ path: 'test-results/seo-final-' + item.slug + '-' + locale + '-430.png' })
      }
    })
  }
}

for (const locale of locales) {
  test('2026 full sixteen-frame gallery and six style-intent choices in ' + locale + ' at 430px', async ({ page }) => {
    const copy = getNative2026Trends(locale)!
    const path = '/' + locale + '/blog/eyewear-trends-2026-glasses-sunglasses'
    await page.setViewportSize({ width: 430, height: 932 })
    const response = await page.goto(path, { waitUntil: 'domcontentloaded' })
    expect(response?.status()).toBe(200)
    const article = page.locator('article[lang="' + locale + '"]')
    await expect(article).toHaveCount(1)
    await expect(article).toHaveAttribute('dir', locale === 'ar' ? 'rtl' : 'ltr')
    await expect(article.getByRole('heading', { level: 1, name: copy.title })).toBeVisible()
    await expect(article.locator('[data-native-intents="6"] h3')).toHaveCount(6)
    await expect(article.locator('[data-native-frames="16"] [data-frame-id]')).toHaveCount(16)
    for (const group of copy.groups) {
      await expect(article.getByRole('heading', { level: 2, name: group.title })).toHaveCount(1)
    }
    for (const frame of STYLE_PRESETS_2026) {
      await expect(article.locator('[data-frame-id="' + frame.id + '"]')).toHaveCount(1)
    }
    for (const lang of all) {
      await expect(page.locator('link[rel="alternate"][hreflang="' + lang + '"]')).toHaveAttribute(
        'href', 'https://www.visutry.com/' + lang + '/blog/eyewear-trends-2026-glasses-sunglasses',
      )
    }
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href', 'https://www.visutry.com' + path,
    )
    await expect(article.getByRole('link', { name: copy.labels.styles, exact: true }))
      .toHaveAttribute('href', '/' + locale + '/style-explorer')
    const scripts = await page.locator('script[type="application/ld+json"]').allTextContents()
    expect(scripts.map(raw => JSON.parse(raw)).some(x =>
      x['@type'] === 'Article' && x.headline === copy.title && x.inLanguage === locale,
    )).toBe(true)
    for (const source of OFFICIAL_2026_TREND_SOURCES) {
      await expect(article.locator('a[href="' + source.url + '"]')).toHaveCount(1)
    }
    if (['es', 'ja', 'ar'].includes(locale)) {
      await page.evaluate(() => window.scrollTo(0, 0))
      await page.screenshot({ path: 'test-results/seo-final-trends-' + locale + '-430-top.png' })
      const first = article.locator('[data-frame-id="' + STYLE_PRESETS_2026[0].id + '"]')
      await first.scrollIntoViewIfNeeded()
      const image = first.locator('img')
      await expect.poll(async () => image.evaluate(node => (node as HTMLImageElement).naturalWidth))
        .toBeGreaterThan(0)
      await first.screenshot({ path: 'test-results/seo-final-trends-' + locale + '-first-card.png' })
    }
  })
}

for (const locale of ['ja', 'ar', 'es'] as const) {
  test('blog hub gives genuinely native cards for all last 4 articles in ' + locale, async ({ page }) => {
    const posts = await getAllBlogPosts(locale)
    await page.setViewportSize({ width: 430, height: 932 })
    const response = await page.goto('/' + locale + '/blog', { waitUntil: 'domcontentloaded' })
    expect(response?.status()).toBe(200)
    for (const slug of [
      'best-ai-virtual-glasses-tryon-tools-2025',
      'celebrity-glasses-style-guide-2025',
      'virtual-try-on-reduce-eyewear-returns',
      'eyewear-trends-2026-glasses-sunglasses',
    ]) {
      const card = posts.find(p => p.slug === slug)!
      await expect(page.getByRole('heading', { level: 2, name: card.title })).toHaveCount(1)
      await expect(page.getByRole('link', { name: card.title, exact: true }))
        .toHaveAttribute('href', '/' + locale + '/blog/' + slug)
    }
  })
}
