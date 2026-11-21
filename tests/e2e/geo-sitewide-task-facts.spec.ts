import { test, expect } from '@playwright/test'

const cases = [
  { page: '/en', task: 'home', heading: 'Choose a tool for your real eyewear decision' },
  { page: '/en/face-analysis', task: 'advisor', heading: 'What personalized Glasses Advisor adds' },
  { page: '/en/try-on/glasses', task: 'try-on', heading: 'What to bring when you already know a frame' },
  { page: '/en/try-on/glasses/compare', task: 'compare', heading: 'What the four-frame comparison really compares' },
  { page: '/en/glasses-guide', task: 'guide', heading: 'Turn general frame advice into a practical size check' },
  { page: '/en/blog', task: 'blog', heading: 'Read the guide that matches your next buying decision' },
  { page: '/en/store', task: 'merchant', heading: 'What a VisuTry Store merchant can actually do' },
  { page: '/en/try-glasses-on-photo', task: 'photo', heading: 'Understand the two images needed for Try-On' },
] as const

for (const viewport of [{ label: 'desktop', width: 1440, height: 900 }, { label: 'mobile-430', width: 430, height: 932 }] as const) {
  for (const item of cases) {
    test(`task-specific GEO content ${item.task} on ${viewport.label}`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height })
      const response = await page.goto(item.page, { waitUntil: 'domcontentloaded' })
      expect(response?.status()).toBe(200)
      const block = page.locator(`[data-geo-task="${item.task}"]`)
      await expect(block).toHaveCount(1)
      await expect(block.getByRole('heading', { name: item.heading })).toBeVisible()
      await expect(block.getByRole('link')).toHaveAttribute('href', /\/en\//)
      await expect(block).toContainText('What this does not guarantee:')
      if (viewport.label === 'mobile-430' && ['home', 'advisor', 'try-on', 'compare', 'merchant'].includes(item.task)) {
        await block.scrollIntoViewIfNeeded()
        await block.screenshot({ path: `test-results/geo-sitewide-${item.task}-430.png` })
      }
    })
  }
}

test('non-English search route remains free of English task block', async ({ page }) => {
  await page.goto('/ja/try-glasses-on-photo', { waitUntil: 'domcontentloaded' })
  await expect(page.locator('[data-geo-task]')).toHaveCount(0)
})

test('curated brand page openly discloses independence from brand catalog', async ({ page }) => {
  const response = await page.goto('/en/brand/gentle-monster', { waitUntil: 'domcontentloaded' })
  expect(response?.status()).toBe(200)
  await expect(page.getByRole('heading', { name: 'What this Gentle Monster guide represents' })).toBeVisible()
  await expect(page.getByText(/not authenticated Gentle Monster SKUs/i)).toBeVisible()
})
