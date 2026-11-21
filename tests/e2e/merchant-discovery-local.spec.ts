import { expect, test, type APIResponse, type Page } from '@playwright/test'
import { prisma } from '@/lib/prisma'
import type { ExperienceSearchReadiness } from '@/modules/store/domain/experience-search-visibility'

const isolated = process.env.APP_ENV === 'local'
  && process.env.NODE_ENV === 'test'
  && process.env.ENABLE_MOCKS === 'true'
  && process.env.TEST_MODE === 'true'
  && process.env.VISUTRY_DATABASE_IDENTITY === 'local:127.0.0.1:5439/visutry_local_container_e2e'
  && process.env.PLAYWRIGHT_BASE_URL === 'http://127.0.0.1:3003'

async function body<T>(response: APIResponse): Promise<T> {
  const value = await response.json() as { success: boolean; data: T; error?: string }
  expect(response.status(), JSON.stringify(value)).toBe(200)
  expect(value.success, JSON.stringify(value)).toBe(true)
  return value.data
}

async function assertResponsiveSearchPanel(page: Page, screenshot: string) {
  const panel = page.getByRole('region', { name: 'Search visibility' })
  await expect(panel).toBeVisible()
  await expect(panel).toContainText('Public · eligible for search')
  await expect(panel).toContainText('English public page')
  await expect(panel).toContainText('Search engines decide whether and when to include it in results.')
  await panel.scrollIntoViewIfNeeded()
  await expect(panel).toBeInViewport()
  const box = await panel.boundingBox()
  expect(box).not.toBeNull()
  expect(box!.x).toBeGreaterThanOrEqual(0)
  expect(box!.x + box!.width).toBeLessThanOrEqual(page.viewportSize()!.width + 1)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true)
  await page.screenshot({ path: test.info().outputPath(screenshot) })
}

test.describe('Merchant discovery with real local reads', () => {
  test('reports saved search eligibility and serves the independent Canary without shopper sessions', async ({ page, request, context }) => {
    test.skip(!isolated, 'Requires the disposable local PGlite database and port 3003')
    test.setTimeout(300_000)
    const baseUrl = process.env.PLAYWRIGHT_BASE_URL!

    // This fixture is intentionally TEST for analytics but LIVE for discovery.
    // Never seed the production Canary or change the separate Demo Optical.
    expect(await prisma.merchant.findUnique({ where: { slug: 'visutry-demo' } })).toBeNull()
    const merchant = await prisma.merchant.create({ data: {
      slug: 'visutry-demo', name: 'VisuTry Discovery Canary', status: 'ACTIVE',
      classification: 'TEST', classificationSource: 'LOCAL_DISCOVERY_E2E',
      classificationReason: 'Disposable local discovery/browser contract fixture.',
      pilotType: 'LIVE', referenceData: false, websiteUrl: null,
      tryOnEnabled: false, compareEnabled: false, planCode: 'FREE', commercialStatus: 'FREE',
      pricingVersion: 'commercial-v1', entitlementVersion: 'commercial-v1',
      memberships: { create: { userId: 'mock-user-1', role: 'OWNER' } },
    } })
    expect(merchant.classification).toBe('TEST')
    expect(merchant.websiteUrl).toBeNull()
    const shapes = ['round', 'rectangle', 'oval', 'browline', 'aviator', 'cat-eye']
    const frames: Array<{ id: string }> = []
    for (const [index, shape] of shapes.entries()) {
      frames.push(await prisma.merchantFrame.create({ data: {
        merchantId: merchant.id, sku: `LOCAL-CANARY-${index + 1}`,
        name: `Local ${shape} demo frame`, brand: 'VisuTry', shape,
        imageUrl: `${baseUrl}/assets/glasses-presets/${shape}-classic.jpg`,
        // Reproduce the old stored destinations. Rendering must not carry
        // these links into the now-independent canonical Demo Optical tenant.
        productUrl: `https://www.visutry.com/en/demo/frames/${shape}`,
        source: 'SEED', status: 'ACTIVE', enrichmentStatus: 'APPROVED',
      } }))
    }
    async function selectFrames(experienceId: string, count: number) {
      await prisma.experienceFrame.createMany({ data: frames.slice(0, count).map((frame, index) => ({
        experienceId, merchantId: merchant.id, merchantFrameId: frame.id, sortOrder: index,
      })) })
    }
    const store = await prisma.experience.create({ data: {
      merchantId: merchant.id, type: 'STORE', slug: 'store', name: 'Local Canary Store',
      status: 'ACTIVE', headline: 'Explore the Canary frame collection',
      description: 'Six demonstration frames for a local search discovery check.',
      presentationMode: 'PRODUCT_FIRST',
    } })
    await selectFrames(store.id, 6)
    async function createCampaign(slug: string, status: 'ACTIVE' | 'DRAFT', referenceData = false, count = 4) {
      const experience = await prisma.experience.create({ data: {
        merchantId: merchant.id, type: 'CAMPAIGN', slug, name: `Local ${slug}`,
        status, referenceData, headline: `Saved headline for ${slug}`,
        description: 'Saved fixture description.', presentationMode: 'PRODUCT_FIRST',
        campaignObjective: 'TRAFFIC', campaignGate: 'NONE',
      } })
      await selectFrames(experience.id, count)
      return experience
    }
    const campaign = await createCampaign('everyday-fit', 'ACTIVE')
    const reference = await createCampaign('reference-check', 'ACTIVE', true)
    const draft = await createCampaign('private-check', 'DRAFT')
    const thin = await createCampaign('three-frame-check', 'ACTIVE', false, 3)
    const otherTenantFrame = await prisma.merchantFrame.findFirstOrThrow({
      where: { merchantId: { not: merchant.id }, status: 'ACTIVE' }, select: { id: true },
    })

    const csrf = await (await request.get('/api/auth/csrf')).json() as { csrfToken: string }
    const login = await request.post('/api/auth/callback/mock-credentials', {
      form: { email: 'test@example.com', qaIdentity: 'existing', type: 'free',
        csrfToken: csrf.csrfToken, callbackUrl: '/en/merchant', json: 'true' },
    })
    expect(login.ok()).toBe(true)
    await context.addCookies((await request.storageState()).cookies)
    const storeApi = `/api/merchant/${merchant.id}/store`
    const campaignApi = (id: string) => `/api/merchant/${merchant.id}/campaigns/${id}`

    // The runner warms an existing public Store before this test. A real,
    // authorized same-value save invalidates its bounded admission cache after
    // local fixture insertion; no test-only production cache endpoint is needed.
    await body(await request.patch(storeApi, { data: { storeId: store.id, headline: store.headline } }))

    const storeModel = await body<{ store: { searchVisibility: ExperienceSearchReadiness } }>(await request.get(storeApi))
    expect(storeModel.store.searchVisibility).toEqual({
      visibility: 'PUBLIC_INDEX', reasons: [], indexableLocale: 'en', activeFrameCount: 6, minimumFrameCount: 4,
    })
    const campaignModel = await body<{ searchVisibility: ExperienceSearchReadiness }>(await request.get(campaignApi(campaign.id)))
    expect(campaignModel.searchVisibility).toEqual({
      visibility: 'PUBLIC_INDEX', reasons: [], indexableLocale: 'en', activeFrameCount: 4, minimumFrameCount: 4,
    })
    for (const [experience, visibility, reason] of [
      [reference, 'PUBLIC_NOINDEX', 'REFERENCE'],
      [draft, 'PRIVATE', 'DRAFT'],
      [thin, 'PUBLIC_NOINDEX', 'INSUFFICIENT_FRAMES'],
    ] as const) {
      const model = await body<{ searchVisibility: ExperienceSearchReadiness }>(await request.get(campaignApi(experience.id)))
      expect(model.searchVisibility).toMatchObject({ visibility, reasons: [reason] })
    }

    for (const viewport of [{ width: 1440, height: 1000 }, { width: 430, height: 932 }]) {
      await page.setViewportSize(viewport)
      const size = viewport.width === 430 ? 'mobile' : 'desktop'
      await page.goto(`/en/merchant/store?merchantId=${merchant.id}`, { waitUntil: 'networkidle' })
      await assertResponsiveSearchPanel(page, `store-search-${size}.png`)
      await page.goto(`/en/merchant/campaigns/${campaign.id}?merchantId=${merchant.id}`, { waitUntil: 'networkidle' })
      await assertResponsiveSearchPanel(page, `campaign-search-${size}.png`)
    }

    const shopperRequests: string[] = []
    context.on('request', (event) => {
      if (new URL(event.url()).pathname.startsWith('/api/store/sessions')) shopperRequests.push(event.url())
    })
    expect(await prisma.merchantSession.count({ where: { merchantId: merchant.id } })).toBe(0)
    const campaignPath = '/en/c/visutry-demo/everyday-fit'
    const publicResponse = await page.goto(campaignPath, { waitUntil: 'networkidle' })
    expect(publicResponse?.status()).toBe(200)
    await expect(page.locator('main[data-store-discovery]')).toHaveAttribute('data-presentation-mode', 'PRODUCT_FIRST')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Everyday Fit: round or rectangular?')
    await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /Compare round and rectangular frames.*Demo frames are not for sale/)
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'index, follow')
    await expect(page.getByText('These VisuTry-owned demo frames are not offered for sale.', { exact: false })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Can I buy the frames in this collection?' })).toBeVisible()
    await expect(page.locator('main[data-store-discovery] a[href*="/demo/frames/"]')).toHaveCount(0)
    await expect(page.locator('main[data-store-discovery] a[href*="visutry-demo-optical"]')).toHaveCount(0)
    const structured = JSON.parse(await page.locator('main[data-store-discovery] script[type="application/ld+json"]').textContent() || '{}')
    const collection = structured['@graph'].find((node: { '@type': string }) => node['@type'] === 'CollectionPage')
    expect(collection.name).toBe('Everyday Fit: Round vs. Rectangular Demo Frames')
    expect(collection.description).toContain('Demo frames are not for sale.')
    expect(collection.mainEntity.itemListElement).toHaveLength(4)
    expect(JSON.stringify(structured)).not.toMatch(/"offers"|"review"|"aggregateRating"|\/demo\/frames\/|visutry-demo-optical/)
    expect(structured['@graph'].find((node: { '@type': string }) => node['@type'] === 'Organization')).not.toHaveProperty('url')
    await page.screenshot({ path: test.info().outputPath('canary-campaign-mobile.png') })
    await page.locator('section[aria-labelledby="frame-outline-comparison"]').screenshot({ path: test.info().outputPath('canary-comparison-mobile.png') })

    const framePath = `/en/discover/frames/${frames[0]!.id}`
    const frameName = 'Local round demo frame'
    const productLink = page.locator('main[data-store-discovery] article')
      .filter({ has: page.getByRole('heading', { name: frameName, exact: true }) })
      .getByRole('link', { name: 'View product' })
    const productDestination = new URL((await productLink.getAttribute('href'))!, baseUrl)
    // A Local/Preview click must remain on the configured deployment. Never
    // send this disposable frame ID to the production website during E2E.
    expect(productDestination.origin).toBe(baseUrl)
    expect(productDestination.pathname).toBe(framePath)
    const [detail] = await Promise.all([page.waitForEvent('popup'), productLink.click()])
    await detail.waitForLoadState('networkidle')
    await detail.setViewportSize({ width: 430, height: 932 })
    const detailMain = detail.locator(`main[data-merchant-discovery-frame="${frames[0]!.id}"]`)
    await expect(detailMain).toBeVisible()
    await expect(detailMain.getByRole('heading', { level: 1 })).toHaveText(frameName)
    await expect(detail.locator('link[rel="canonical"]')).toHaveAttribute('href', `${baseUrl}${framePath}`)
    await expect(detailMain).toContainText('This demonstration frame is not offered for sale')
    const detailImage = detailMain.getByRole('img', { name: `${frameName} from ${merchant.name}` })
    await expect(detailImage).toHaveAttribute('src', `${baseUrl}/assets/glasses-presets/round-classic.jpg`)
    await expect.poll(() => detailImage.evaluate((image) => (image as HTMLImageElement).naturalWidth)).toBeGreaterThan(0)
    const detailStructured = JSON.parse(await detailMain.locator('script[type="application/ld+json"]').textContent() || '{}')
    expect(detailStructured).toMatchObject({
      '@type': 'Product', name: frameName, url: `${baseUrl}${framePath}`,
      image: [`${baseUrl}/assets/glasses-presets/round-classic.jpg`],
    })
    expect(JSON.stringify(detailStructured)).not.toMatch(/"offers"|"review"|"aggregateRating"|\/demo\/frames\/|visutry-demo-optical/)
    const storeReturn = detailMain.getByRole('link', { name: 'Explore the VisuTry Demo collection' })
    const campaignReturn = detailMain.getByRole('link', { name: 'Compare in Everyday Fit' })
    expect(new URL((await storeReturn.getAttribute('href'))!, baseUrl).pathname).toBe('/en/store/visutry-demo')
    expect(new URL((await campaignReturn.getAttribute('href'))!, baseUrl).pathname).toBe(campaignPath)
    expect(await detail.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true)
    await detail.screenshot({ path: test.info().outputPath('canary-frame-detail-mobile.png'), fullPage: true })
    await campaignReturn.click()
    await expect(detail.getByRole('heading', { level: 1 })).toHaveText('Everyday Fit: round or rectangular?')
    await detail.close()

    const sitemapResponse = await request.get('/sitemaps/dynamic.xml')
    expect(sitemapResponse.status()).toBe(200)
    const sitemapXml = await sitemapResponse.text()
    const framePaths = [...sitemapXml.matchAll(/<loc>([^<]+)<\/loc>/g)]
      .map((match) => new URL(match[1]!).pathname)
      .filter((path) => /^\/[^/]+\/discover\/frames\//.test(path))
    expect(framePaths.sort()).toEqual(frames.map((frame) => `/en/discover/frames/${frame.id}`).sort())
    for (const path of [
      '/en/discover/frames/unknown-discovery-frame',
      `/en/discover/frames/${otherTenantFrame.id}`,
      `/ja/discover/frames/${frames[0]!.id}`,
    ]) {
      const response = await request.get(path)
      expect(response.status(), path).toBe(404)
      expect(await response.text()).not.toContain('data-merchant-discovery-frame=')
    }
    const comparisonLink = page.getByRole('link', { name: 'See Local round demo frame in the collection' })
    await comparisonLink.click()
    await expect(page.locator(`#frame-${frames[0]!.id}`)).toBeInViewport()

    // These slugs are first read in their final fixture states, so assertions
    // cannot accidentally validate stale cached PUBLIC_INDEX content.
    await page.goto('/en/c/visutry-demo/reference-check', { waitUntil: 'domcontentloaded' })
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, follow')
    await expect(page.getByRole('heading', { name: 'Compare two frame outlines' })).toHaveCount(0)
    const privateResponse = await request.get('/en/c/visutry-demo/private-check')
    expect(privateResponse.status()).toBe(404)
    expect(await privateResponse.text()).not.toContain('data-store-discovery="true"')

    // Discover is force-dynamic and must consult current saved eligibility,
    // not the editorial allowlist alone. Database changes remain local-only.
    await page.goto('/en/discover', { waitUntil: 'domcontentloaded' })
    const entry = page.getByRole('link', { name: /Frame comparison example Everyday Fit: round or rectangular/ })
    await expect(entry).toBeVisible()
    await expect(entry).toHaveAttribute('href', /\/en\/c\/visutry-demo\/everyday-fit\?.*campaign=discover-canary-learning/)
    await prisma.experience.update({ where: { id: campaign.id }, data: { referenceData: true } })
    await page.goto('/en/discover?check=reference', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { name: 'Everyday Fit: round or rectangular?' })).toHaveCount(0)
    await prisma.experience.update({ where: { id: campaign.id }, data: { referenceData: false, status: 'DRAFT' } })
    await page.goto('/en/discover?check=draft', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { name: 'Everyday Fit: round or rectangular?' })).toHaveCount(0)
    await prisma.experience.update({ where: { id: campaign.id }, data: { status: 'ACTIVE' } })
    await page.goto('/ja/discover', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { name: 'Everyday Fit: round or rectangular?' })).toHaveCount(0)

    // Respect the existing cached-public-content contract: after controlled
    // local fixture changes, use a real owner save to invalidate the merchant
    // and admission tags before checking an already-viewed detail URL again.
    await prisma.merchant.update({ where: { id: merchant.id }, data: { referenceData: true } })
    await body(await request.patch(storeApi, { data: { storeId: store.id, headline: store.headline } }))
    expect((await request.get(framePath)).status()).toBe(404)
    await prisma.merchant.update({ where: { id: merchant.id }, data: { referenceData: false } })
    await prisma.experience.updateMany({ where: { id: { in: [store.id, campaign.id] } }, data: { status: 'DRAFT' } })
    await body(await request.patch(storeApi, { data: { storeId: store.id, headline: store.headline } }))
    expect((await request.get(framePath)).status()).toBe(404)
    await prisma.experience.updateMany({ where: { id: { in: [store.id, campaign.id] } }, data: { status: 'ACTIVE' } })
    await body(await request.patch(storeApi, { data: { storeId: store.id, headline: store.headline } }))

    expect(shopperRequests).toEqual([])
    expect(await prisma.merchantSession.count({ where: { merchantId: merchant.id } })).toBe(0)
    expect(await prisma.merchantAiRenderReservation.count({ where: { merchantId: merchant.id } })).toBe(0)
    expect(await prisma.tryOnTask.count({ where: { merchantId: merchant.id } })).toBe(0)
    console.log(JSON.stringify({ result: 'PASS', merchantDiscovery: true, apiMocks: false,
      storeActiveProducts: 6, campaignActiveProducts: 4, desktopAndMobile: true,
      referenceAndDraftGates: true, firstPartyFrameDetail: true, sitemapFrameCount: framePaths.length,
      localClassification: 'TEST', shopperSessions: 0, providerCalls: 0 }))
  })
})
