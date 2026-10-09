import { expect, test, type APIRequestContext } from '@playwright/test'
import { createHash } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'

test.use({ viewport: { width: 1024, height: 768 } })
test.setTimeout(180_000)

const isLocalDemoFixtureRun = process.env.APP_ENV === 'local' &&
  process.env.VISUTRY_LOCAL_DEMO_RUNTIME === '1' &&
  process.env.VISUTRY_LOCAL_DEMO_PROVIDER_MODE === 'blocked' &&
  process.env.VISUTRY_LOCAL_DEMO_EXECUTION_MODE === 'PREPARED_DEMO' &&
  process.env.VISUTRY_LOCAL_DEMO_PREPARED_E2E === '1' &&
  /^http:\/\/(127\.0\.0\.1|localhost):(3001|3002)$/.test(process.env.PLAYWRIGHT_BASE_URL || '')

const APPROVED_RESULT_HASHES = {
  rowan: '504fced34e90922ffe162c4abe746178777b4241afc5f262d28e93dba703b28c',
  lane: '1c6f03785756d230fb1806572e03e9acf9eda32f150acb84ee783ee8bfac7b71',
} as const

type RecommendationFrame = {
  name: string
  sku: string | null
  score: number
  reason: string
  imageUrl: string | null
}

async function expectDecisionResultShortlist(
  page: import('@playwright/test').Page,
  frames: RecommendationFrame[],
) {
  const shortlist = page.getByRole('region', { name: 'Your curated shortlist' })
  const images = shortlist.locator('img[alt$="product thumbnail"]')
  await expect(images).toHaveCount(frames.length)
  const renderedNames = await images.evaluateAll((elements) =>
    elements.map((element) => element.getAttribute('alt')?.replace(/ product thumbnail$/, '')),
  )
  expect(renderedNames).toEqual(frames.map((frame) => frame.name))

  for (let index = 0; index < frames.length; index += 1) {
    const frame = frames[index]
    const image = images.nth(index)
    const renderedUrl = await image.getAttribute('src')
    expect(renderedUrl && new URL(renderedUrl, page.url()).toString()).toBe(new URL(frame.imageUrl!, page.url()).toString())
    await expect.poll(() => image.evaluate((element: HTMLImageElement) => element.naturalWidth)).toBeGreaterThan(0)

    const card = shortlist.getByText(frame.name, { exact: true }).locator('xpath=ancestor::article[contains(@class, "rounded-2xl")][1]')
    await expect(card).toContainText(frame.reason)
    if (frame.sku) await expect(card).not.toContainText(frame.sku)
    await expect(card).not.toContainText(String(Math.round(frame.score)))
  }
}

async function expectApprovedPreparedImage(
  page: import('@playwright/test').Page,
  image: import('@playwright/test').Locator,
  identity: keyof typeof APPROVED_RESULT_HASHES,
) {
  await expect(image).toBeVisible()
  await expect.poll(() => image.evaluate((element: HTMLImageElement) => element.naturalWidth)).toBe(1122)
  await expect.poll(() => image.evaluate((element: HTMLImageElement) => element.naturalHeight)).toBe(1402)
  const imageUrl = await image.getAttribute('src')
  expect(imageUrl).toBeTruthy()
  const response = await page.request.get(new URL(imageUrl!, page.url()).toString())
  expect(response.ok()).toBe(true)
  const actualHash = createHash('sha256').update(await response.body()).digest('hex')
  expect(actualHash).toBe(APPROVED_RESULT_HASHES[identity])
}

async function expectNoHorizontalOverflow(page: import('@playwright/test').Page) {
  const viewportWidth = page.viewportSize()?.width
  if (!viewportWidth) throw new Error('A fixed viewport is required for responsive overflow verification.')
  await expect.poll(() => page.locator('html').evaluate((element) => element.scrollWidth)).toBeLessThanOrEqual(viewportWidth)
}

async function localNetworkGuard(page: import('@playwright/test').Page) {
  const unexpectedOrigins: string[] = []
  const errors: string[] = []
  const allowed = new Set([
    process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:3001',
    'http://127.0.0.1:4100',
  ])
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

async function signInMock(request: APIRequestContext, input: { email: string; qaIdentity: string; type: string; callbackUrl: string }) {
  const csrf = await request.get('/api/auth/csrf').then((response) => response.json()) as { csrfToken: string }
  const response = await request.post('/api/auth/callback/mock-credentials', {
    form: { ...input, csrfToken: csrf.csrfToken, json: 'true' },
  })
  expect(response.ok()).toBeTruthy()
}

async function readDemoStoreAdminIdentity(request: APIRequestContext) {
  await signInMock(request, { email: 'admin@local.test', qaIdentity: 'admin', type: 'admin', callbackUrl: '/admin/store' })
  const merchantsResponse = await request.get('/api/admin/store/merchants')
  expect(merchantsResponse.status()).toBe(200)
  const merchantsPayload = await merchantsResponse.json() as { data: { merchants: Array<{ id: string; slug: string }> } }
  const merchant = merchantsPayload.data.merchants.find((item) => item.slug === 'visutry-demo-optical')
  expect(merchant).toBeTruthy()
  const experiencesResponse = await request.get(`/api/admin/store/merchants/${merchant!.id}/experiences?type=STORE`)
  expect(experiencesResponse.status()).toBe(200)
  const experiencesPayload = await experiencesResponse.json() as { data: { experiences: Array<{ id: string; type: string }> } }
  const store = experiencesPayload.data.experiences.find((item) => item.type === 'STORE')
  expect(store).toBeTruthy()
  const detailResponse = await request.get(`/api/admin/store/merchants/${merchant!.id}/experiences/${store!.id}`)
  expect(detailResponse.status()).toBe(200)
  const detailPayload = await detailResponse.json() as { data: { experience: { deliveryPolicy: unknown } } }
  return { merchantId: merchant!.id, experienceId: store!.id, deliveryPolicy: detailPayload.data.experience.deliveryPolicy }
}

async function setDemoStoreDeliveryPolicy(request: APIRequestContext, merchantId: string, experienceId: string, deliveryPolicy: unknown) {
  const response = await request.put(`/api/admin/store/merchants/${merchantId}/experiences/${experienceId}`, {
    data: { deliveryPolicy },
  })
  expect(response.status()).toBe(200)
}

async function prepareCampaignPublicPath(request: APIRequestContext) {
  await signInMock(request, { email: 'admin@local.test', qaIdentity: 'admin', type: 'admin', callbackUrl: '/admin/store' })
  const merchantsResponse = await request.get('/api/admin/store/merchants')
  expect(merchantsResponse.status()).toBe(200)
  const merchantsPayload = await merchantsResponse.json() as { data: { merchants: Array<{ id: string; slug: string }> } }
  const merchant = merchantsPayload.data.merchants.find((item) => item.slug === 'visutry-demo-optical')
  expect(merchant).toBeTruthy()

  await signInMock(request, { email: 'test@example.com', qaIdentity: 'existing', type: 'free', callbackUrl: '/en/merchant' })
  const catalogResponse = await request.get(`/api/merchant/${merchant!.id}/catalog?readiness=READY&limit=100`)
  expect(catalogResponse.status()).toBe(200)
  const catalogPayload = await catalogResponse.json() as { data: { items: Array<{ id: string; sku: string | null }> } }
  const rowan = catalogPayload.data.items.find((item) => item.sku === 'VT-DEMO-001')
  const lane = catalogPayload.data.items.find((item) => item.sku === 'VT-DEMO-002')
  expect(rowan).toBeTruthy()
  expect(lane).toBeTruthy()

  const name = 'Prepared Demo Decision Campaign'
  const listResponse = await request.get(`/api/merchant/${merchant!.id}/campaigns?limit=100`)
  expect(listResponse.status()).toBe(200)
  const listPayload = await listResponse.json() as { data: { items: Array<{ id: string; name: string; status: string }> } }
  let campaign = listPayload.data.items.find((item) => item.name === name && item.status !== 'ARCHIVED')
  if (!campaign) {
    const createResponse = await request.post(`/api/merchant/${merchant!.id}/campaigns`, {
      data: { name, headline: 'A considered frame edit for everyday wear' },
    })
    expect(createResponse.status()).toBe(201)
    const createdPayload = await createResponse.json() as { data: { id: string; name: string; status: string } }
    campaign = createdPayload.data
  }

  const productsResponse = await request.put(`/api/merchant/${merchant!.id}/campaigns/${campaign.id}/products`, {
    data: { frameIds: catalogPayload.data.items.map((item) => item.id) },
  })
  expect(productsResponse.status()).toBe(200)
  if (campaign.status !== 'ACTIVE') {
    const publishResponse = await request.post(`/api/merchant/${merchant!.id}/campaigns/${campaign.id}/publish`, { data: { approved: true } })
    expect(publishResponse.status()).toBe(200)
  }
  const detailResponse = await request.get(`/api/merchant/${merchant!.id}/campaigns/${campaign.id}`)
  expect(detailResponse.status()).toBe(200)
  const detailPayload = await detailResponse.json() as { data: { status: string; publicPath: string } }
  expect(detailPayload.data.status).toBe('ACTIVE')
  return detailPayload.data.publicPath
}

test('completes Store → Demo Shopper → Rowan/Lane prepared results → Compare → Decision Result → mobile and Kiosk without providers', async ({ page, browser, request }) => {
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
  await expect(page.getByText('Prepared demo result', { exact: true })).toHaveCount(2)
  await expect(page.getByText('QA fixture · not a Try-On image')).toHaveCount(0)
  for (const image of await resultImages.all()) {
    const alt = await image.getAttribute('alt')
    await expectApprovedPreparedImage(page, image, alt?.includes('VT Rowan') ? 'rowan' : 'lane')
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
  await expect(page.getByRole('heading', { level: 1, name: /shortlist/i })).toBeVisible()
  await page.setViewportSize({ width: 1440, height: 900 })
  await expect(page.getByRole('heading', { name: 'Completed looks' })).toBeVisible()
  const comparedFrames = page.getByRole('region', { name: 'Frames you compared' })
  await expect(comparedFrames.getByText('VT Rowan', { exact: true })).toBeVisible()
  await expect(comparedFrames.getByText('VT Lane', { exact: true })).toBeVisible()
  const comparedImages = comparedFrames.locator('img[alt$="product thumbnail"]')
  await expect(comparedImages).toHaveCount(2)
  for (const image of await comparedImages.all()) {
    await expect(image).toBeVisible()
    await expect.poll(() => image.evaluate((element: HTMLImageElement) => element.naturalWidth)).toBeGreaterThan(0)
  }
  await expectDecisionResultShortlist(page, recommendationPayload.data.frames)
  await expect(page.getByText('Prepared demonstration result', { exact: true })).toHaveCount(2)
  await expect(page.getByText('QA fixture · not a Try-On image')).toHaveCount(0)
  await expect(page.getByAltText('Scan to open this Decision Result on another device')).toBeVisible()
  const decisionImages = page.locator('img[src*="/api/store/results/"]')
  await expect(decisionImages).toHaveCount(2)
  for (const image of await decisionImages.all()) {
    const alt = await image.getAttribute('alt')
    await expectApprovedPreparedImage(page, image, alt?.includes('VT Rowan') ? 'rowan' : 'lane')
  }

  const mobilePage = await browser.newPage({ viewport: { width: 390, height: 844 } })
  const mobileNetwork = await localNetworkGuard(mobilePage)
  await mobilePage.goto(resultHref!, { waitUntil: 'networkidle' })
  await expect(mobilePage.getByRole('heading', { level: 1, name: /shortlist/i })).toBeVisible()
  await expectDecisionResultShortlist(mobilePage, recommendationPayload.data.frames)
  await expect(mobilePage.getByRole('button', { name: 'Copy link' })).toBeVisible()
  await expect(mobilePage.getByRole('button', { name: 'Share' })).toBeVisible()
  await expect(mobilePage.getByAltText('Scan to open this Decision Result on another device')).toBeHidden()
  await expectNoHorizontalOverflow(mobilePage)
  const mobileImages = mobilePage.locator('img[src*="/api/store/results/"]')
  await expect(mobileImages).toHaveCount(2)
  for (const image of await mobileImages.all()) {
    const alt = await image.getAttribute('alt')
    await expectApprovedPreparedImage(mobilePage, image, alt?.includes('VT Rowan') ? 'rowan' : 'lane')
  }
  const screenshotDirectory = path.resolve('.local/demo-evidence/phase-2b3d-shortlist')
  fs.mkdirSync(screenshotDirectory, { recursive: true })
  await mobilePage.screenshot({ path: path.join(screenshotDirectory, 'decision-result-mobile.png'), fullPage: true })
  await mobilePage.close()
  await page.screenshot({ path: path.join(screenshotDirectory, 'decision-result-desktop.png'), fullPage: true })

  const kioskIdentity = await readDemoStoreAdminIdentity(request)
  await setDemoStoreDeliveryPolicy(request, kioskIdentity.merchantId, kioskIdentity.experienceId, { kioskEnabled: true, kioskIdleTimeoutSeconds: 900 })
  try {
    const kioskPage = await browser.newPage({ viewport: { width: 1024, height: 768 } })
    const kioskNetwork = await localNetworkGuard(kioskPage)
    const kioskUrl = new URL(resultHref!, process.env.PLAYWRIGHT_BASE_URL)
    kioskUrl.searchParams.set('deliveryProfile', 'kiosk')
    await kioskPage.goto(kioskUrl.toString(), { waitUntil: 'networkidle' })
    await expect(kioskPage.getByRole('heading', { level: 1, name: /shortlist/i })).toBeVisible()
    await expect(kioskPage.getByRole('button', { name: 'New shopper' })).toBeVisible()
    await expect(kioskPage.getByText('Continue on your phone')).toBeVisible()
    await expectNoHorizontalOverflow(kioskPage)
    const kioskImages = kioskPage.locator('img[src*="/api/store/results/"]')
    await expect(kioskImages).toHaveCount(2)
    for (const image of await kioskImages.all()) {
      const alt = await image.getAttribute('alt')
      await expectApprovedPreparedImage(kioskPage, image, alt?.includes('VT Rowan') ? 'rowan' : 'lane')
    }
    await kioskPage.screenshot({ path: path.join(screenshotDirectory, 'decision-result-kiosk.png'), fullPage: true })
    expect(kioskNetwork.unexpectedOrigins).toEqual([])
    expect(kioskNetwork.errors).toEqual([])
    await kioskPage.close()
  } finally {
    await setDemoStoreDeliveryPolicy(request, kioskIdentity.merchantId, kioskIdentity.experienceId, kioskIdentity.deliveryPolicy ?? null)
  }

  const tokenFile = process.env.VISUTRY_LOCAL_DEMO_RESULT_TOKEN_FILE
  if (!tokenFile || !resultHref) throw new Error('Local restart verification token destination is not configured.')
  fs.writeFileSync(tokenFile, resultHref.split('/').at(-1)!, { mode: 0o600, flag: 'wx' })
  expect(network.unexpectedOrigins).toEqual([])
  expect(network.errors).toEqual([])
  expect(mobileNetwork.unexpectedOrigins).toEqual([])
  expect(mobileNetwork.errors).toEqual([])
  expect(providerRequests).toEqual([])
})

test('completes a representative Campaign comparison with prepared full-size results', async ({ page, request }) => {
  test.skip(!isLocalDemoFixtureRun, 'Run only against the guarded Local Demo PREPARED_DEMO execution mode.')
  test.setTimeout(180_000)
  const network = await localNetworkGuard(page)
  const providerRequests: string[] = []
  page.on('request', (request) => {
    if (/grsaiapi\.com|generativelanguage\.googleapis\.com/i.test(request.url())) providerRequests.push(request.url())
  })

  const publicPath = await prepareCampaignPublicPath(request)
  await page.goto(publicPath, { waitUntil: 'load' })
  await expect(page.getByRole('button', { name: 'Try on your photo' })).toBeVisible()
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
  const additional = page.getByRole('heading', { name: /More frames from (this )?(Store|Campaign)/ }).locator('xpath=ancestor::section[1]')
  await expect(additional.getByRole('button', { name: 'Select VT Rowan' })).toBeVisible()
  await additional.getByRole('button', { name: 'Select VT Rowan' }).click()
  await page.getByRole('button', { name: 'Select VT Lane' }).click()
  await expect(page.getByText('Selected 2 of 2', { exact: true }).first()).toBeVisible()

  const selection = page.locator('[data-selection-cta="mobile"]')
  await selection.scrollIntoViewIfNeeded()
  await selection.click()
  await expect(selection).toContainText('Continue to Try-On')
  await selection.click()
  const startTryOn = page.getByTestId('store-tryon-start')
  await expect(startTryOn).toBeVisible()
  const preparedSubmissionPromise = page.waitForRequest((pendingRequest) =>
    pendingRequest.url().includes('/api/store/sessions/try-on') && pendingRequest.method() === 'POST',
  )
  await startTryOn.click()
  const preparedSubmission = JSON.parse(await (await preparedSubmissionPromise).postData() ?? '{}')
  expect(preparedSubmission.decisionResultToken).toEqual(recommendationPayload.data.decisionResult.token)

  const resultImages = page.locator('[data-testid^="store-tryon-result-"]')
  await expect(resultImages).toHaveCount(2, { timeout: 60_000 })
  await expect(page.getByText('Prepared demo result', { exact: true })).toHaveCount(2)
  for (const image of await resultImages.all()) {
    const alt = await image.getAttribute('alt')
    await expectApprovedPreparedImage(page, image, alt?.includes('VT Rowan') ? 'rowan' : 'lane')
  }
  await page.getByTestId('store-tryon-open-compare').click()
  await expect(page.getByRole('heading', { name: 'Side-by-side compare' })).toBeVisible()
  const resultLink = page.getByTestId('store-decision-result-continuation')
  const resultHref = await resultLink.getAttribute('href')
  expect(resultHref).toMatch(/^\/en\/result\/[A-Za-z0-9_-]{40,}$/)
  await resultLink.click()
  await expect(page).toHaveURL(/\/en\/result\/[A-Za-z0-9_-]{40,}$/)
  await page.setViewportSize({ width: 1440, height: 900 })
  await expect(page.getByRole('heading', { level: 1, name: 'Your campaign shortlist' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Completed looks' })).toBeVisible()
  await expect(page.getByText('Prepared demonstration result', { exact: true })).toHaveCount(2)
  const comparedFrames = page.getByRole('region', { name: 'Frames you compared' })
  await expect(comparedFrames.getByText('VT Rowan', { exact: true })).toBeVisible()
  await expect(comparedFrames.getByText('VT Lane', { exact: true })).toBeVisible()
  await expectDecisionResultShortlist(page, recommendationPayload.data.frames)
  const resultDirectory = path.resolve('.local/demo-evidence/phase-2b3d-shortlist')
  fs.mkdirSync(resultDirectory, { recursive: true })
  await page.screenshot({ path: path.join(resultDirectory, 'campaign-decision-result-desktop.png'), fullPage: true })

  await page.setViewportSize({ width: 390, height: 844 })
  await expectDecisionResultShortlist(page, recommendationPayload.data.frames)
  await expectNoHorizontalOverflow(page)
  await expect(page.getByRole('button', { name: 'Copy link' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Share' })).toBeVisible()
  await expect(page.getByAltText('Scan to open this Decision Result on another device')).toBeHidden()
  await page.screenshot({ path: path.join(resultDirectory, 'campaign-decision-result-mobile.png'), fullPage: true })
  expect(network.unexpectedOrigins).toEqual([])
  expect(network.errors).toEqual([])
  expect(providerRequests).toEqual([])
})

test('serves the same Decision Result media after the Local app has restarted', async ({ page }) => {
  const token = process.env.VISUTRY_LOCAL_DEMO_RESTART_RESULT_TOKEN
  test.skip(!isLocalDemoFixtureRun || !token, 'Run as the restart phase of the Local Demo journey runner.')
  const network = await localNetworkGuard(page)
  await page.goto(`/en/result/${encodeURIComponent(token!)}`, { waitUntil: 'networkidle' })
  await expect(page.getByRole('heading', { level: 1, name: /shortlist/i })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Completed looks' })).toBeVisible()
  const images = page.locator('img[src*="/api/store/results/"]')
  await expect(images).toHaveCount(2)
  for (const image of await images.all()) {
    await expect(image).toBeVisible()
    const alt = await image.getAttribute('alt')
    await expectApprovedPreparedImage(page, image, alt?.includes('VT Rowan') ? 'rowan' : 'lane')
  }
  expect(network.unexpectedOrigins).toEqual([])
  expect(network.errors).toEqual([])
})
