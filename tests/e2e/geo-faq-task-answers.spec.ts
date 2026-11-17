import { expect, test } from '@playwright/test'

const newQuestions = [
  "Can I use a retailer's glasses screenshot for virtual try-on?",
  'Do I need a face-shape report before trying on a specific frame?',
  'Do frame markings like 52-18-145 or an AI preview prove that glasses will fit?',
] as const

for (const viewport of [
  { label: 'desktop', width: 1440, height: 900 },
  { label: 'mobile-430', width: 430, height: 932 },
] as const) {
  test(`EN FAQ decision answers are public and schema-consistent on ${viewport.label}`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height })
    const response = await page.goto('/en/faq', { waitUntil: 'domcontentloaded' })
    expect(response?.status()).toBe(200)

    const section = page.locator('#eyewear-shopping-decisions')
    await expect(section.getByRole('heading', { name: 'Before trying glasses from a product image' })).toBeVisible()
    for (const question of newQuestions) {
      await expect(section.getByRole('heading', { name: question })).toBeVisible()
    }
    await expect(section.getByRole('link', { name: 'Try a frame from a photo' }))
      .toHaveAttribute('href', '/en/try-on/glasses')
    await expect(section.getByRole('link', { name: 'Explore the free Face Shape Detector' }))
      .toHaveAttribute('href', '/en/face-shape-detector')
    await expect(section.getByRole('link', { name: 'Compare two frame size markings' }))
      .toHaveAttribute('href', '/en/glasses-guide/how-wide-should-glasses-be-for-my-face')

    const qa = await page.locator('script[type="application/ld+json"]').evaluateAll((nodes) =>
      nodes.map((node) => {
        try { return JSON.parse(node.textContent || '{}') } catch { return null }
      }).find((item) => item?.['@type'] === 'FAQPage'),
    )
    expect(qa).toBeTruthy()
    for (const question of newQuestions) {
      expect(qa.mainEntity.some((item: { name: string; acceptedAnswer: { text: string } }) =>
        item.name === question && item.acceptedAnswer.text.length > 80,
      )).toBe(true)
    }
    // Contents are regular server-rendered text, not a client-only panel.
    const ssrResponse = await page.request.get('/en/faq')
    const html = await ssrResponse.text()
    for (const question of newQuestions) expect(html).toContain(question.replaceAll("'", '&#x27;'))
    await section.screenshot({ path: `test-results/geo-faq-${viewport.label}.png` })
  })
}

test('JA FAQ remains unchanged: no English-only task answer block', async ({ page }) => {
  const response = await page.goto('/ja/faq', { waitUntil: 'domcontentloaded' })
  expect(response?.status()).toBe(200)
  await expect(page.locator('#eyewear-shopping-decisions')).toHaveCount(0)
})
