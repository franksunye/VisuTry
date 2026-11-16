import { expect, test } from '@playwright/test'

const englishPage = '/en/glasses-guide/how-wide-should-glasses-be-for-my-face'
const sectionSelector = '[aria-labelledby="frame-marking-compare"]'

for (const view of [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'mobile-430', width: 430, height: 932 },
] as const) {
  test(`client-only frame-size comparison is usable on ${view.name}`, async ({ page }) => {
    await page.setViewportSize({ width: view.width, height: view.height })

    const response = await page.goto(englishPage, { waitUntil: 'domcontentloaded' })
    expect(response?.status()).toBe(200)

    const section = page.locator(sectionSelector)
    await expect(section.getByRole('heading', { name: 'Compare the markings on two frames' })).toBeVisible()
    const previous = section.getByRole('textbox', { name: 'Your current pair' })
    const candidate = section.getByRole('textbox', { name: 'Frame you are considering' })
    const action = section.getByRole('button', { name: 'Compare markings' })
    // Avoid checking the SSR shell before its client event handlers are attached.
    await expect(action).toBeEnabled()

    // Only observe requests initiated after the page has loaded; a comparison
    // must not call any AI, media or Vercel analytics API.
    const writes: string[] = []
    page.on('request', (request) => {
      const pathname = new URL(request.url()).pathname
      if (request.method() !== 'GET' && pathname.startsWith('/api/')) {
        writes.push(`${request.method()} ${pathname}`)
      }
    })

    await previous.fill('52 □ 18 – 145')
    await candidate.fill('54-17-140')
    await action.click()

    await expect(section.getByText('+2 mm', { exact: true })).toBeVisible()
    await expect(section.getByText('−1 mm', { exact: true })).toBeVisible()
    await expect(section.getByText('−5 mm', { exact: true })).toBeVisible()
    await expect(section.getByText(/not an overall width or a fit score/i)).toBeVisible()
    expect(writes).toEqual([])

    // Pin the section below the sticky navbar before capturing actual viewport
    // pixels; taking an element screenshot after scrolling to its last result
    // can otherwise misleadingly overlay the sticky header on the heading.
    await section.evaluate((element) => {
      const top = element.getBoundingClientRect().top + window.scrollY
      window.scrollTo(0, Math.max(0, top - 96))
    })
    if (view.name === 'mobile-430') {
      await page.screenshot({ path: 'test-results/frame-size-mobile-430-top.png' })
      await section.getByText('−5 mm', { exact: true }).scrollIntoViewIfNeeded()
      await page.screenshot({ path: 'test-results/frame-size-mobile-430-result.png' })
    } else {
      await section.screenshot({ path: 'test-results/frame-size-desktop.png' })
    }

    // Changing a source marking invalidates the old calculation.
    await candidate.fill('not a frame mark')
    await expect(section.getByText('+2 mm', { exact: true })).toHaveCount(0)
    await action.click()
    await expect(section.getByRole('alert')).toContainText('Enter two valid markings')
    expect(writes).toEqual([])
  })
}

test('other locale continues to show its existing guide without English comparator', async ({ page }) => {
  const response = await page.goto('/ja/glasses-guide/how-wide-should-glasses-be-for-my-face')
  expect(response?.status()).toBe(200)
  await expect(page.locator(sectionSelector)).toHaveCount(0)
})
