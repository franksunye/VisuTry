import { expect, test } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'

test.use({ viewport: { width: 1024, height: 768 } })
test.setTimeout(180_000)

const isLocalDemoFixtureRun = process.env.APP_ENV === 'local' &&
  process.env.VISUTRY_LOCAL_DEMO_RUNTIME === '1' &&
  process.env.VISUTRY_LOCAL_DEMO_PROVIDER_MODE === 'blocked' &&
  process.env.VISUTRY_LOCAL_DEMO_EXECUTION_MODE === 'PREPARED_DEMO' &&
  process.env.VISUTRY_LOCAL_DEMO_PREPARED_E2E === '1' &&
  /^http:\/\/(127\.0\.0\.1|localhost):3001$/.test(process.env.PLAYWRIGHT_BASE_URL || '')

async function localNetworkGuard(page: import('@playwright/test').Page) {
  const unexpectedOrigins: string[] = []
  const errors: string[] = []
  const allowed = new Set(['http://127.0.0.1:3001', 'http://127.0.0.1:4100'])
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error' && !message.text().includes('INFO: Created TensorFlow Lite XNNPACK delegate for CPU.')) {
      errors.push(message.text())
    }
  })
  page.on('response', (response) => {
    if (response.status() >= 500) errors.push(`${response.status()} ${response.url()}`)
  })
  await page.context().route('**/*', async (route) => {
    const url = new URL(route.request().url())
    if (url.protocol === 'data:' || url.protocol === 'blob:') return route.continue()
    if (!allowed.has(url.origin)) {
      unexpectedOrigins.push(url.origin)
      return route.abort('blockedbyclient')
    }
    return route.continue()
  })
  return { unexpectedOrigins, errors }
}

test('completes Store → Demo Shopper → Rowan/Lane prepared results → Compare → Decision Result → mobile without providers', async ({ page, browser }) => {
  test.skip(!isLocalDemoFixtureRun, 'Run only against the guarded Local Demo PREPARED_DEMO execution mode.')
  const network = await localNetworkGuard(page)
  const providerRequests: string[] = []
  page.on('request', (request) => {
    if (/grsaiapi\.com|generativelanguage\.googleapis\.com/i.test(request.url())) providerRequests.push(request.url())
  })

  await page.goto('/en/store/visutry-demo-optical', { waitUntil: 'load' })
  await expect(page.getByRole('heading', { name: 'Shop the VisuTry Demo Optical eyewear collection' })).toBeVisible()
  await page.getByRole('button', { name: 'Try on your photo' }).click()
  const workspace = page.getByRole('dialog', { name: 'Try-on workspace' })
  await expect(workspace).toBeVisible()
  await workspace.getByRole('button', { name: 'I understand — continue' }).click()
  const recommendationResponsePromise = page.waitForResponse((response) =>
    response.url().includes('/api/store/sessions/recommend') && response.request().method() === 'POST',
  )
  await workspace.getByLabel('Your photo').setInputFiles(path.resolve('docs/assets/local-demo/visutry-demo-shopper-v1.png'))

  await expect(page.getByRole('heading', { name: 'Recommended for you' })).toBeVisible({ timeout: 60_000 })
  const recommendationPayload = await (await recommendationResponsePromise).json()
  expect(recommendationPayload.data.decisionResult?.token).toEqual(expect.any(String))
  await expect(page.getByTestId('store-fit-profile')).toContainText('Fit profile detected')
  await page.getByRole('button', { name: 'Explore all frames' }).click()
  const additional = page.getByRole('heading', { name: 'More frames from this Store' }).locator('xpath=ancestor::section[1]')
  await expect(additional.getByRole('button', { name: 'Select VT Rowan' })).toBeVisible()
  await additional.getByRole('button', { name: 'Select VT Rowan' }).click()
  await page.getByRole('button', { name: 'Select VT Lane' }).click()
  await expect(page.getByText('Selected 2 of 2', { exact: true }).first()).toBeVisible()

  // At the required 1024px viewport the Store workspace is below its 1280px
  // desktop breakpoint, so use its visible compact/mobile continuation CTA.
  const selection = page.locator('[data-selection-cta="mobile"]')
  await selection.scrollIntoViewIfNeeded()
  await selection.click()
  await expect(selection).toContainText('Continue to Try-On')
  await selection.click()
  const startTryOn = page.getByTestId('store-tryon-start')
  await expect(startTryOn).toBeVisible()
  const preparedSubmissionPromise = page.waitForRequest((request) =>
    request.url().includes('/api/store/sessions/try-on') && request.method() === 'POST',
  )
  await startTryOn.click()
  const preparedSubmission = JSON.parse(await (await preparedSubmissionPromise).postData() ?? '{}')
  expect(preparedSubmission.decisionResultToken).toBe(recommendationPayload.data.decisionResult.token)

  const resultImages = page.locator('[data-testid^="store-tryon-result-"]')
  await expect(resultImages).toHaveCount(2, { timeout: 60_000 })
  await expect(page.getByText('QA fixture · not a Try-On image')).toHaveCount(2)
  for (const image of await resultImages.all()) {
    await expect.poll(() => image.evaluate((element: HTMLImageElement) => element.naturalWidth)).toBeGreaterThan(0)
  }

  await page.getByTestId('store-tryon-open-compare').click()
  await expect(page.getByRole('heading', { name: 'Side-by-side compare' })).toBeVisible()
  const resultLink = page.getByTestId('store-decision-result-continuation')
  await expect(resultLink).toBeVisible()
  await expect(resultLink).toHaveText('View your result')
  const resultHref = await resultLink.getAttribute('href')
  expect(resultHref).toMatch(/^\/en\/result\/[A-Za-z0-9_-]{40,}$/)

  await resultLink.click()
  await expect(page).toHaveURL(/\/en\/result\/[A-Za-z0-9_-]{40,}$/)
  await expect(page.getByRole('heading', { level: 1, name: /result/i })).toBeVisible()
  await expect(page.getByText('Prepared demo results')).toBeVisible()
  await expect(page.getByText('QA fixture · not a Try-On image')).toHaveCount(2)
  await expect(page.getByAltText('Scan to open this Decision Result on another device')).toBeVisible()
  const decisionImages = page.locator('img[src*="/api/store/results/"]')
  await expect(decisionImages).toHaveCount(2)
  for (const image of await decisionImages.all()) {
    await expect.poll(() => image.evaluate((element: HTMLImageElement) => element.naturalWidth)).toBeGreaterThan(0)
  }

  const mobilePage = await browser.newPage({ viewport: { width: 390, height: 844 } })
  const mobileNetwork = await localNetworkGuard(mobilePage)
  await mobilePage.goto(resultHref!, { waitUntil: 'networkidle' })
  await expect(mobilePage.getByRole('heading', { level: 1, name: /result/i })).toBeVisible()
  await expect(mobilePage.getByText('Continue on your phone')).toBeVisible()
  await expect(mobilePage.locator('img[src*="/api/store/results/"]')).toHaveCount(2)
  for (const image of await mobilePage.locator('img[src*="/api/store/results/"]').all()) {
    await expect.poll(() => image.evaluate((element: HTMLImageElement) => element.naturalWidth)).toBeGreaterThan(0)
  }
  await mobilePage.close()

  const tokenFile = process.env.VISUTRY_LOCAL_DEMO_RESULT_TOKEN_FILE
  if (!tokenFile || !resultHref) throw new Error('Local restart verification token destination is not configured.')
  fs.writeFileSync(tokenFile, resultHref.split('/').at(-1)!, { mode: 0o600, flag: 'wx' })
  expect(network.unexpectedOrigins).toEqual([])
  expect(network.errors).toEqual([])
  expect(mobileNetwork.unexpectedOrigins).toEqual([])
  expect(mobileNetwork.errors).toEqual([])
  expect(providerRequests).toEqual([])
})

test('serves the same Decision Result media after the Local app has restarted', async ({ page }) => {
  const token = process.env.VISUTRY_LOCAL_DEMO_RESTART_RESULT_TOKEN
  test.skip(!isLocalDemoFixtureRun || !token, 'Run as the restart phase of the Local Demo journey runner.')
  const network = await localNetworkGuard(page)
  await page.goto(`/en/result/${encodeURIComponent(token!)}`, { waitUntil: 'networkidle' })
  await expect(page.getByRole('heading', { level: 1, name: /result/i })).toBeVisible()
  const image = page.locator('img[src*="/api/store/results/"]').first()
  await expect(image).toBeVisible()
  await expect.poll(() => image.evaluate((element: HTMLImageElement) => element.naturalWidth)).toBeGreaterThan(0)
  expect(network.unexpectedOrigins).toEqual([])
  expect(network.errors).toEqual([])
})
