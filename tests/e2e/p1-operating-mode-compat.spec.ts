import { expect, test } from '@playwright/test'
import { mkdirSync } from 'node:fs'
import { assertDatabaseEnvironment } from '@/lib/app-environment'
import { prisma } from '@/lib/prisma'

const expectedLocalRun = process.env.NODE_ENV === 'test'
  && process.env.APP_ENV === 'local'
  && process.env.ENABLE_MOCKS === 'true'
  && process.env.TEST_MODE === 'true'
  && process.env.P1_OPERATING_MODE_COMPAT_LOCAL_E2E === '1'
  && /^http:\/\/127\.0\.0\.1:3001$/.test(process.env.PLAYWRIGHT_BASE_URL || '')

const activeMerchantSlug = 'local-p1-operating-mode-compat-active'
const activationMerchantSlug = 'local-p1-operating-mode-compat-activation'

async function assertLocalTestDatabase() {
  if (!expectedLocalRun) throw new Error('Operating-mode compatibility E2E requires the guarded Local test command.')

  const databaseUrl = process.env.DATABASE_URL
  const identity = process.env.VISUTRY_DATABASE_IDENTITY
  if (!databaseUrl || !identity) throw new Error('Local database URL/identity is missing.')

  const parsedUrl = new URL(databaseUrl)
  if (parsedUrl.hostname !== '127.0.0.1' || parsedUrl.pathname !== '/visutry_local') {
    throw new Error('Refusing the Local compatibility fixture outside loopback visutry_local PostgreSQL.')
  }
  const expectedIdentity = `local:127.0.0.1:${parsedUrl.port}/visutry_local`
  if (identity !== expectedIdentity) throw new Error('Local database identity does not match the loopback connection.')

  await assertDatabaseEnvironment({
    client: prisma,
    expectedEnvironment: 'local',
    expectedDatabaseIdentity: expectedIdentity,
  })
}

async function ensureMerchant(slug: string, name: string) {
  const merchant = await prisma.merchant.upsert({
    where: { slug },
    create: {
      slug,
      name,
      classification: 'TEST',
      classificationSource: 'LOCAL_QA_SEED',
      classificationReason: 'Local-only P1 operating-mode compatibility fixture.',
    },
    update: {
      name,
      classification: 'TEST',
      classificationSource: 'LOCAL_QA_SEED',
      classificationReason: 'Local-only P1 operating-mode compatibility fixture.',
    },
    select: { id: true },
  })
  await prisma.merchantMembership.upsert({
    where: { userId_merchantId: { userId: 'mock-user-1', merchantId: merchant.id } },
    create: { userId: 'mock-user-1', merchantId: merchant.id, role: 'OWNER' },
    update: { role: 'OWNER' },
  })
  return merchant.id
}

async function seedLocalModeFixtures() {
  await assertLocalTestDatabase()

  const owner = await prisma.user.findUnique({ where: { id: 'mock-user-1' }, select: { id: true } })
  if (!owner) throw new Error('Run the guarded Local QA seed before this browser test.')

  const activeMerchantId = await ensureMerchant(activeMerchantSlug, 'Local Operating Compatibility Store')
  const activationMerchantId = await ensureMerchant(activationMerchantSlug, 'Local Activation Compatibility Merchant')

  const frame = await prisma.merchantFrame.upsert({
    where: { merchantId_sku: { merchantId: activeMerchantId, sku: 'LOCAL-OPERATING-COMPAT-001' } },
    create: {
      merchantId: activeMerchantId,
      sku: 'LOCAL-OPERATING-COMPAT-001',
      name: 'Local Operating Compatibility Frame',
      brand: 'Local QA',
      imageUrl: 'http://127.0.0.1:3001/assets/glasses-presets/large-round-classic.jpg',
      shape: 'ROUND',
      source: 'MANUAL',
      status: 'ACTIVE',
      enrichmentStatus: 'APPROVED',
    },
    update: {
      name: 'Local Operating Compatibility Frame',
      imageUrl: 'http://127.0.0.1:3001/assets/glasses-presets/large-round-classic.jpg',
      shape: 'ROUND',
      status: 'ACTIVE',
      enrichmentStatus: 'APPROVED',
    },
    select: { id: true },
  })

  const store = await prisma.experience.upsert({
    where: { merchantId_slug: { merchantId: activeMerchantId, slug: 'local-operating-compat-store' } },
    create: {
      merchantId: activeMerchantId,
      type: 'STORE',
      slug: 'local-operating-compat-store',
      name: 'Local Operating Compatibility Store',
      status: 'ACTIVE',
    },
    update: { name: 'Local Operating Compatibility Store', status: 'ACTIVE' },
    select: { id: true },
  })
  await prisma.experienceFrame.upsert({
    where: { experienceId_merchantFrameId: { experienceId: store.id, merchantFrameId: frame.id } },
    create: { experienceId: store.id, merchantId: activeMerchantId, merchantFrameId: frame.id, active: true, sortOrder: 0 },
    update: { active: true, sortOrder: 0 },
  })
  const campaign = await prisma.experience.upsert({
    where: { merchantId_slug: { merchantId: activeMerchantId, slug: 'local-operating-compat-campaign' } },
    create: {
      merchantId: activeMerchantId,
      type: 'CAMPAIGN',
      slug: 'local-operating-compat-campaign',
      name: 'Local Active Compatibility Campaign',
      headline: 'A Local TEST campaign',
      primaryCtaUrl: 'https://example.test/frames/local-operating-compat-001',
      status: 'ACTIVE',
    },
    update: {
      name: 'Local Active Compatibility Campaign',
      headline: 'A Local TEST campaign',
      primaryCtaUrl: 'https://example.test/frames/local-operating-compat-001',
      status: 'ACTIVE',
    },
    select: { id: true },
  })
  await prisma.experienceFrame.upsert({
    where: { experienceId_merchantFrameId: { experienceId: campaign.id, merchantFrameId: frame.id } },
    create: { experienceId: campaign.id, merchantId: activeMerchantId, merchantFrameId: frame.id, active: true, sortOrder: 0 },
    update: { active: true, sortOrder: 0 },
  })

  const qualifyingEvents = await prisma.merchantActivationEvent.findMany({
    where: {
      merchantId: activeMerchantId,
      eventType: { in: ['merchant_store_previewed', 'merchant_store_published'] },
    },
    select: { eventType: true },
  })
  expect(qualifyingEvents).toEqual([])

  return { activeMerchantId, activationMerchantId }
}

async function signInExistingLocalMerchant(page: import('@playwright/test').Page, request: import('@playwright/test').APIRequestContext, context: import('@playwright/test').BrowserContext) {
  const csrfResponse = await request.get('/api/auth/csrf')
  expect(csrfResponse.ok()).toBeTruthy()
  const { csrfToken } = await csrfResponse.json() as { csrfToken: string }
  const callbackResponse = await request.post('/api/auth/callback/mock-credentials', {
    form: {
      email: 'test@example.com',
      qaIdentity: 'existing',
      type: 'premium',
      csrfToken,
      callbackUrl: '/en/merchant',
      json: 'true',
    },
  })
  expect(callbackResponse.ok()).toBeTruthy()
  await context.addCookies((await request.storageState()).cookies)
  await page.setViewportSize({ width: 1440, height: 900 })
}

test.describe('P1 existing Store Operating Mode compatibility (Local only)', () => {
  test('routes ACTIVE-Store legacy fixture into Operating and keeps DRAFT/no-Store in Activation', async ({ page, request, context }) => {
    test.skip(!expectedLocalRun, 'Run the isolated Local operating-mode compatibility E2E command.')

    const browserErrors: string[] = []
    const serverErrors: number[] = []
    page.on('pageerror', (error) => browserErrors.push(error.message))
    page.on('console', (message) => {
      if (message.type() === 'error') browserErrors.push(message.text())
    })
    page.on('response', (response) => {
      if (response.status() >= 500) serverErrors.push(response.status())
    })

    const { activeMerchantId, activationMerchantId } = await seedLocalModeFixtures()
    await signInExistingLocalMerchant(page, request, context)

    mkdirSync('/tmp/visutry-p1-operating-mode-compat', { recursive: true })
    await page.goto(`/en/merchant?merchantId=${encodeURIComponent(activeMerchantId)}`, { waitUntil: 'networkidle' })
    await expect(page.getByRole('heading', { name: 'Workspace overview' })).toBeVisible()
    await expect(page.getByText('Bring your eyewear catalog to life.', { exact: true })).toHaveCount(0)
    await page.screenshot({ path: '/tmp/visutry-p1-operating-mode-compat/active-store-home-desktop.png' })

    await page.goto(`/en/merchant/catalog?merchantId=${encodeURIComponent(activeMerchantId)}`, { waitUntil: 'networkidle' })
    await expect(page).toHaveURL(new RegExp(`/en/merchant/catalog\\?merchantId=${activeMerchantId}`))
    await expect(page.getByRole('heading', { name: 'Catalog', exact: true })).toBeVisible()

    await page.goto(`/en/merchant/store?merchantId=${encodeURIComponent(activeMerchantId)}`, { waitUntil: 'networkidle' })
    await expect(page).toHaveURL(new RegExp(`/en/merchant/store\\?merchantId=${activeMerchantId}`))
    await expect(page.getByRole('heading', { name: 'Store', exact: true })).toBeVisible()

    await page.goto(`/en/merchant/campaigns?merchantId=${encodeURIComponent(activeMerchantId)}`, { waitUntil: 'networkidle' })
    await expect(page).toHaveURL(new RegExp(`/en/merchant/campaigns\\?merchantId=${activeMerchantId}`))
    await expect(page.getByRole('heading', { name: 'Campaigns', exact: true })).toBeVisible()

    await page.goto(`/en/merchant?merchantId=${encodeURIComponent(activationMerchantId)}`, { waitUntil: 'networkidle' })
    await expect(page.getByRole('heading', { name: 'Bring your eyewear catalog to life.' })).toBeVisible()
    await page.goto(`/en/merchant/catalog?merchantId=${encodeURIComponent(activationMerchantId)}`, { waitUntil: 'networkidle' })
    await expect(page).toHaveURL(new RegExp(`/en/merchant\\?merchantId=${activationMerchantId}`))
    await expect(page.getByRole('heading', { name: 'Bring your eyewear catalog to life.' })).toBeVisible()

    const qualifyingEventsAfterNavigation = await prisma.merchantActivationEvent.findMany({
      where: {
        merchantId: activeMerchantId,
        eventType: { in: ['merchant_store_previewed', 'merchant_store_published'] },
      },
      select: { eventType: true },
    })
    expect(qualifyingEventsAfterNavigation).toEqual([])

    expect(browserErrors).toEqual([])
    expect(serverErrors).toEqual([])
    console.log(JSON.stringify({
      p1OperatingModeCompatibility: {
        activeMerchantId,
        activationMerchantId,
        activeStoreMode: 'OPERATING',
        qualifyingActivationEvents: 0,
        operatingDeepLinks: ['catalog', 'store', 'campaigns'],
        activationDeepLink: 'redirected-to-root',
        browserErrors,
        serverErrors,
      },
    }))
  })
})
