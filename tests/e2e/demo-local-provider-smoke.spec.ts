import { expect, test } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'

test.use({ viewport: { width: 1024, height: 768 } })
test.setTimeout(300_000)

const baseUrlOk = /^http:\/\/(127\.0\.0\.1|localhost):3001$/.test(process.env.PLAYWRIGHT_BASE_URL || '')
const providerRun = process.env.APP_ENV === 'local'
  && process.env.VISUTRY_LOCAL_DEMO_RUNTIME === '1'
  && process.env.VISUTRY_LOCAL_DEMO_PROVIDER_MODE === 'grsai'
  && process.env.VISUTRY_LOCAL_DEMO_PROVIDER_SMOKE === '1'
  && process.env.VISUTRY_LOCAL_DEMO_PROVIDER_SMOKE_AUTHORIZED === '1'
  && baseUrlOk
const restartRun = process.env.APP_ENV === 'local'
  && process.env.VISUTRY_LOCAL_DEMO_RUNTIME === '1'
  && process.env.VISUTRY_LOCAL_DEMO_PROVIDER_MODE === 'blocked'
  && process.env.VISUTRY_LOCAL_DEMO_PROVIDER_SMOKE === '1'
  && baseUrlOk

function evidenceDir(): string {
  const root = path.resolve('.local/demo-evidence')
  const configured = process.env.VISUTRY_LOCAL_DEMO_EVIDENCE_DIR
  if (!configured) throw new Error('VISUTRY_LOCAL_DEMO_EVIDENCE_DIR is required')
  const resolved = path.resolve(configured)
  if (!resolved.startsWith(`${root}${path.sep}`)) {
    throw new Error('Provider-smoke evidence must stay under .local/demo-evidence/')
  }
  fs.mkdirSync(resolved, { recursive: true })
  return resolved
}

function stateFile(): string {
  const configured = process.env.VISUTRY_LOCAL_DEMO_PROVIDER_SMOKE_STATE_FILE
  if (!configured) throw new Error('VISUTRY_LOCAL_DEMO_PROVIDER_SMOKE_STATE_FILE is required')
  const resolved = path.resolve(configured)
  const root = path.resolve('.local/demo-evidence')
  if (!resolved.startsWith(`${root}${path.sep}`)) {
    throw new Error('Provider-smoke state must stay under .local/demo-evidence/')
  }
  return resolved
}

async function capture(page: import('@playwright/test').Page, id: string) {
  const dir = evidenceDir()
  await page.screenshot({ path: path.join(dir, `${id}-clean.png`), fullPage: false })
  await page.screenshot({ path: path.join(dir, `${id}-full.png`), fullPage: true })
}

async function localBrowserGuard(page: import('@playwright/test').Page) {
  const unexpectedOrigins: string[] = []
  const errors: string[] = []
  const notFound: string[] = []
  const allowed = new Set(['http://127.0.0.1:3001', 'http://127.0.0.1:4100'])

  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error' && !message.text().includes('INFO: Created TensorFlow Lite XNNPACK delegate for CPU.')) {
      errors.push(message.text())
    }
  })
  page.on('response', (response) => {
    if (response.status() >= 500) errors.push(`${response.status()} ${response.url()}`)
    if (response.status() === 404) notFound.push(response.url())
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
  return { unexpectedOrigins, errors, notFound }
}

async function expectImageReady(locator: import('@playwright/test').Locator) {
  await expect(locator).toBeVisible({ timeout: 150_000 })
  await expect.poll(
    () => locator.evaluate((element: HTMLImageElement) => element.naturalWidth),
    { timeout: 150_000, intervals: [500, 1000, 2000] },
  ).toBeGreaterThan(0)
}

test('real provider smoke: Rowan then Lane → Compare → Decision Result', async ({ page }) => {
  test.skip(!providerRun, 'Run only through the guarded Local Demo provider-smoke command.')
  const network = await localBrowserGuard(page)
  let tryOnSubmitCount = 0
  page.on('request', (request) => {
    if (request.method() === 'POST' && new URL(request.url()).pathname === '/api/store/sessions/try-on') {
      tryOnSubmitCount += 1
    }
  })

  await page.goto('/en/store/visutry-demo-optical', { waitUntil: 'load' })
  await expect(page.getByRole('heading', { name: 'Shop the VisuTry Demo Optical eyewear collection' })).toBeVisible()
  await page.getByRole('button', { name: 'Try on your photo' }).click()
  const workspace = page.getByRole('dialog', { name: 'Try-on workspace' })
  await expect(workspace).toBeVisible()

  const sessionResponsePromise = page.waitForResponse((response) =>
    response.request().method() === 'POST' && new URL(response.url()).pathname === '/api/store/sessions',
  )
  await workspace.getByRole('button', { name: 'I understand — continue' }).click()
  const sessionResponse = await sessionResponsePromise
  expect(sessionResponse.ok()).toBe(true)
  const sessionPayload = await sessionResponse.json() as { data?: { merchantSessionId?: string } }
  const merchantSessionId = sessionPayload.data?.merchantSessionId
  if (!merchantSessionId) throw new Error('Local Demo did not return a MerchantSession id')

  await workspace.getByLabel('Your photo').setInputFiles(path.resolve('docs/assets/local-demo/visutry-demo-shopper-v1.png'))
  await expect(page.getByRole('heading', { name: 'Recommended for you' })).toBeVisible({ timeout: 60_000 })
  await expect(page.getByTestId('store-fit-profile')).toContainText('Fit profile detected')
  await page.getByTestId('store-fit-profile').scrollIntoViewIfNeeded()
  await capture(page, 'S01-face-intelligence')

  await page.getByRole('heading', { name: 'Recommended for you' }).scrollIntoViewIfNeeded()
  await page.getByRole('button', { name: 'Explore all frames' }).click()
  const additional = page.getByRole('heading', { name: 'More frames from this Store' }).locator('xpath=ancestor::section[1]')
  await expect(additional.getByRole('button', { name: 'Select VT Rowan' })).toBeVisible()
  await capture(page, 'S02-recommendation')

  // Provider call 1/2: Rowan only. Lane is deliberately not selected until Rowan succeeds.
  await additional.getByRole('button', { name: 'Select VT Rowan' }).click()
  await expect(page.getByText('Selected 1 of 2', { exact: true }).first()).toBeVisible()
  let selection = page.locator('[data-selection-cta="mobile"]')
  await selection.scrollIntoViewIfNeeded()
  await selection.click()
  await expect(selection).toContainText('Continue to Try-On')
  await selection.click()

  let startTryOn = page.getByTestId('store-tryon-start')
  await expect(startTryOn).toBeVisible()
  const rowanStartedAt = Date.now()
  await startTryOn.click()
  await expect.poll(() => tryOnSubmitCount, { timeout: 20_000 }).toBe(1)

  let results = page.locator('[data-testid^="store-tryon-result-"]')
  await expect(results).toHaveCount(1, { timeout: 150_000 })
  await expectImageReady(results.first())
  const rowanCompletedMs = Date.now() - rowanStartedAt
  await results.first().scrollIntoViewIfNeeded()
  await capture(page, 'S03-tryon-rowan')

  // Provider call 2/2 is reachable only after Rowan produced a real rendered result.
  const laneButton = page.getByRole('button', { name: 'Select VT Lane' })
  await laneButton.scrollIntoViewIfNeeded()
  await laneButton.click()
  await expect(page.getByText('Selected 2 of 2', { exact: true }).first()).toBeVisible()
  selection = page.locator('[data-selection-cta="mobile"]')
  await selection.scrollIntoViewIfNeeded()
  await selection.click()
  await expect(selection).toContainText('Continue to Try-On')
  await selection.click()

  startTryOn = page.getByTestId('store-tryon-start')
  await expect(startTryOn).toBeVisible()
  const laneStartedAt = Date.now()
  await startTryOn.click()
  await expect.poll(() => tryOnSubmitCount, { timeout: 20_000 }).toBe(2)

  results = page.locator('[data-testid^="store-tryon-result-"]')
  await expect(results).toHaveCount(2, { timeout: 150_000 })
  for (const image of await results.all()) await expectImageReady(image)
  const laneCompletedMs = Date.now() - laneStartedAt

  await page.getByTestId('store-tryon-open-compare').click()
  const compareHeading = page.getByRole('heading', { name: 'Side-by-side compare' })
  await expect(compareHeading).toBeVisible()
  await compareHeading.scrollIntoViewIfNeeded()
  await capture(page, 'S04-compare')

  const resultLink = page.getByTestId('store-decision-result-continuation')
  await expect(resultLink).toBeVisible()
  const resultHref = await resultLink.getAttribute('href')
  expect(resultHref).toMatch(/^\/en\/result\/[A-Za-z0-9_-]{40,}$/)
  await resultLink.click()
  await expect(page).toHaveURL(/\/en\/result\/[A-Za-z0-9_-]{40,}$/)
  await expect(page.getByRole('heading', { level: 1, name: /shortlist/i })).toBeVisible()
  const decisionImages = page.locator('img[src*="/api/store/results/"]')
  await expect(decisionImages).toHaveCount(2)
  for (const image of await decisionImages.all()) await expectImageReady(image)
  await capture(page, 'S05-decision-result')

  await page.setViewportSize({ width: 390, height: 844 })
  await expect(page.getByRole('heading', { level: 1, name: /shortlist/i })).toBeVisible()
  await capture(page, 'S06-mobile-continuation')

  expect(tryOnSubmitCount).toBe(2)
  expect(network.unexpectedOrigins).toEqual([])
  expect(network.errors).toEqual([])
  expect(network.notFound).toEqual([])

  const token = resultHref!.split('/').at(-1)!
  const state = {
    merchantSessionId,
    resultToken: token,
    resultHref,
    tryOnSubmitCount,
    rowanCompletedMs,
    laneCompletedMs,
    browserUnexpectedOrigins: network.unexpectedOrigins,
    browserErrors: network.errors,
    browser404s: network.notFound,
    capturedAt: new Date().toISOString(),
  }
  fs.writeFileSync(stateFile(), JSON.stringify(state, null, 2), { mode: 0o600, flag: 'wx' })
})

test('restart durability: same real Decision Result media remains readable', async ({ page }) => {
  test.skip(!restartRun, 'Run only as the restart phase of provider-smoke.')
  const file = stateFile()
  const state = JSON.parse(fs.readFileSync(file, 'utf8')) as { resultToken?: string }
  if (!state.resultToken) throw new Error('Provider-smoke state does not contain a Decision Result token')

  const network = await localBrowserGuard(page)
  await page.goto(`/en/result/${encodeURIComponent(state.resultToken)}`, { waitUntil: 'networkidle' })
  await expect(page.getByRole('heading', { level: 1, name: /shortlist/i })).toBeVisible()
  const images = page.locator('img[src*="/api/store/results/"]')
  await expect(images).toHaveCount(2)
  for (const image of await images.all()) await expectImageReady(image)
  await capture(page, 'S05-decision-result-after-restart')

  expect(network.unexpectedOrigins).toEqual([])
  expect(network.errors).toEqual([])
  expect(network.notFound).toEqual([])
})
