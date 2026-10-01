import fs from 'node:fs'
import net from 'node:net'
import path from 'node:path'
import { spawn, spawnSync, type ChildProcess } from 'node:child_process'
import { setTimeout as delay } from 'node:timers/promises'
import dotenv from 'dotenv'
import { chromium, request, type Browser, type Page } from 'playwright'
import { PrismaClient } from '@prisma/client'
import { assertDatabaseEnvironment } from '../src/lib/app-environment'
import { createRuntimePostgresAdapter } from '../src/lib/postgres-runtime'
import {
  assertLocalDashboardSimulationEnvironment,
  LOCAL_DASHBOARD_SIMULATION_CONTEXTS,
  LOCAL_DASHBOARD_SIMULATION_FRAME_SKUS,
  LOCAL_DASHBOARD_SIMULATION_MARKER,
  LOCAL_DASHBOARD_SIMULATION_MERCHANT,
  LOCAL_DASHBOARD_SIMULATION_PRESETS,
  type LocalDashboardSimulationPreset,
} from './lib/local-merchant-dashboard-simulation-contract'

const ROOT = process.cwd()
const ARTIFACT_ROOT = path.join(ROOT, '.local', 'merchant-dashboard-capture')
const HOME_PATH = '/en/merchant'
const ANALYTICS_PATH = '/en/merchant/analytics'
const FIXTURE = {
  slug: LOCAL_DASHBOARD_SIMULATION_MERCHANT.slug,
  name: LOCAL_DASHBOARD_SIMULATION_MERCHANT.name,
  marker: LOCAL_DASHBOARD_SIMULATION_MARKER,
}

type Viewport = { width: number; height: number }
type Scene = {
  id: string
  route: string
  state: string
  viewport: Viewport
  captures: Array<'viewport' | 'full-page'>
  steps: string[]
}

const DESKTOP: Viewport = { width: 1440, height: 900 }
const MOBILE: Viewport = { width: 390, height: 844 }
const SCENES: Scene[] = [
  { id: 'home-desktop', route: HOME_PATH, state: 'home-default', viewport: DESKTOP, captures: ['viewport', 'full-page'], steps: ['open-home', 'inspect-operating-summary'] },
  { id: 'home-mobile', route: HOME_PATH, state: 'home-default', viewport: MOBILE, captures: ['viewport', 'full-page'], steps: ['open-home', 'inspect-operating-summary'] },
  { id: 'home-mobile-navigation', route: HOME_PATH, state: 'mobile-navigation-open', viewport: MOBILE, captures: ['viewport'], steps: ['open-home', 'open-navigation', 'verify-navigation-links'] },
  { id: 'analytics-30d-desktop', route: ANALYTICS_PATH, state: '30-day-reference', viewport: DESKTOP, captures: ['viewport', 'full-page'], steps: ['open-analytics', 'set-range-30d', 'inspect-decision-path-and-frames'] },
  { id: 'analytics-30d-mobile', route: ANALYTICS_PATH, state: '30-day-reference', viewport: MOBILE, captures: ['viewport', 'full-page'], steps: ['open-analytics', 'set-range-30d', 'inspect-decision-path-and-frames'] },
  { id: 'analytics-7d-low-volume-desktop', route: ANALYTICS_PATH, state: '7-day-low-volume', viewport: DESKTOP, captures: ['viewport', 'full-page'], steps: ['open-analytics', 'set-range-7d', 'verify-low-volume-guard'] },
  { id: 'analytics-7d-low-volume-mobile', route: ANALYTICS_PATH, state: '7-day-low-volume', viewport: MOBILE, captures: ['viewport', 'full-page'], steps: ['open-analytics', 'set-range-7d', 'verify-low-volume-guard'] },
]

function localDatabaseIdentity(databaseUrl: string): string {
  const url = new URL(databaseUrl)
  return `local:127.0.0.1:${url.port}/visutry_local`
}

function localEnvironment(port: number): NodeJS.ProcessEnv {
  const env: NodeJS.ProcessEnv = { ...process.env }
  const envFile = path.join(ROOT, '.env.local')
  if (fs.existsSync(envFile)) {
    for (const [key, value] of Object.entries(dotenv.parse(fs.readFileSync(envFile)))) {
      if (env[key] === undefined) env[key] = value
    }
  }

  if (env.VERCEL || env.VERCEL_ENV) throw new Error('Refusing capture inside a Vercel, Preview, or Production environment.')
  if (env.APP_ENV && env.APP_ENV.trim().toLowerCase() !== 'local') throw new Error('Refusing capture unless APP_ENV is Local.')
  if (env.NODE_ENV === 'production') throw new Error('Refusing capture in production Node mode.')
  if (env.ENABLE_MOCKS && !['true', '1'].includes(env.ENABLE_MOCKS.trim().toLowerCase())) throw new Error('Refusing capture because Local mock auth is disabled.')
  if (env.TEST_MODE && !['true', '1'].includes(env.TEST_MODE.trim().toLowerCase())) throw new Error('Refusing capture because TEST_MODE is disabled.')

  const databaseUrl = env.DATABASE_URL || 'postgresql://visutry_local@127.0.0.1:5433/visutry_local'
  const origin = `http://127.0.0.1:${port}`
  env.APP_ENV = 'local'
  env.ENABLE_MOCKS = 'true'
  env.TEST_MODE = 'true'
  env.NEXTAUTH_URL = origin
  env.NEXTAUTH_SECRET = env.NEXTAUTH_SECRET || 'local-only-development-secret'
  env.NEXT_PUBLIC_SITE_URL = origin
  env.DATABASE_URL = databaseUrl
  env.DATABASE_URL_UNPOOLED = env.DATABASE_URL_UNPOOLED || databaseUrl
  env.VISUTRY_DATABASE_IDENTITY = env.VISUTRY_DATABASE_IDENTITY || localDatabaseIdentity(databaseUrl)
  env.STRIPE_MERCHANT_BILLING_MODE = env.STRIPE_MERCHANT_BILLING_MODE || 'test'
  env.PORT = String(port)
  env.HOSTNAME = '127.0.0.1'
  assertLocalDashboardSimulationEnvironment(env)
  return env
}

async function allocatePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = net.createServer()
    server.once('error', reject)
    server.listen(0, '127.0.0.1', () => {
      const address = server.address()
      if (!address || typeof address === 'string') {
        server.close()
        reject(new Error('Could not allocate a loopback port for the Local dashboard capture.'))
        return
      }
      server.close((error) => error ? reject(error) : resolve(address.port))
    })
  })
}

async function verifyFixture(env: NodeJS.ProcessEnv) {
  const expectedDatabaseIdentity = assertLocalDashboardSimulationEnvironment(env)
  const prisma = new PrismaClient({ adapter: createRuntimePostgresAdapter(env) })
  try {
    const database = await assertDatabaseEnvironment({ client: prisma, expectedEnvironment: 'local', expectedDatabaseIdentity })
    const merchant = await prisma.merchant.findUnique({
      where: { slug: FIXTURE.slug },
      select: { id: true, name: true, classification: true, classificationSource: true, pilotType: true, referenceData: true },
    })
    if (!merchant || merchant.name !== FIXTURE.name || merchant.classification !== 'TEST'
      || merchant.classificationSource !== FIXTURE.marker || merchant.pilotType !== 'REFERENCE' || !merchant.referenceData) {
      throw new Error('Refusing capture: the marked non-commercial Local dashboard fixture is missing or its identity/provenance differs.')
    }

    const [experiences, frames, sessions, events, intents] = await Promise.all([
      prisma.experience.findMany({ where: { merchantId: merchant.id }, select: { slug: true, type: true, referenceData: true, referenceMetadata: true } }),
      prisma.merchantFrame.findMany({ where: { merchantId: merchant.id }, select: { sku: true, source: true, sourceNotes: true } }),
      prisma.merchantSession.count({ where: { merchantId: merchant.id, referenceData: true, campaign: FIXTURE.marker, acquisitionSurface: FIXTURE.marker, photoAssetId: null } }),
      prisma.merchantEvent.count({ where: { merchantId: merchant.id, referenceData: true } }),
      prisma.merchantIntent.count({ where: { merchantId: merchant.id, idempotencyKey: { startsWith: `${FIXTURE.marker}:` }, email: null, name: null, note: null } }),
    ])
    const presetValues = experiences.map((experience) => {
      const metadata = experience.referenceMetadata
      return typeof metadata === 'object' && metadata !== null && !Array.isArray(metadata)
        ? String((metadata as Record<string, unknown>).preset ?? '')
        : ''
    })
    const preset = presetValues[0]
    if (!LOCAL_DASHBOARD_SIMULATION_PRESETS.some((candidate) => candidate === preset)
      || presetValues.some((candidate) => candidate !== preset)) {
      throw new Error('Refusing capture: marked Experiences must all declare the same known simulation preset.')
    }
    const selectedPreset = preset as LocalDashboardSimulationPreset
    const expectedExperiences = LOCAL_DASHBOARD_SIMULATION_CONTEXTS.map(({ slug, type }) => `${slug}:${type}`).sort()
    const actualExperiences = experiences.map(({ slug, type }) => `${slug}:${type}`).sort()
    const markedExperiences = experiences.filter((experience) => {
      const metadata = experience.referenceMetadata
      return experience.referenceData && typeof metadata === 'object' && metadata !== null && !Array.isArray(metadata)
        && metadata.fixture === FIXTURE.marker
    }).length
    const now = new Date()
    const [current30DaySessions, previous30DaySessions, last7DaySessions, recentActivitySessions, recentActivityEvents,
      eventGroups, intentGroups, sourceGroups] = await Promise.all([
      prisma.merchantSession.count({ where: { merchantId: merchant.id, referenceData: true, campaign: FIXTURE.marker, acquisitionSurface: FIXTURE.marker, createdAt: { gte: new Date(now.getTime() - 30 * 86_400_000), lt: now } } }),
      prisma.merchantSession.count({ where: { merchantId: merchant.id, referenceData: true, campaign: FIXTURE.marker, acquisitionSurface: FIXTURE.marker, createdAt: { gte: new Date(now.getTime() - 60 * 86_400_000), lt: new Date(now.getTime() - 30 * 86_400_000) } } }),
      prisma.merchantSession.count({ where: { merchantId: merchant.id, referenceData: true, campaign: FIXTURE.marker, acquisitionSurface: FIXTURE.marker, createdAt: { gte: new Date(now.getTime() - 7 * 86_400_000), lt: now } } }),
      prisma.merchantSession.count({ where: { merchantId: merchant.id, referenceData: true, campaign: FIXTURE.marker, acquisitionSurface: FIXTURE.marker, createdAt: { gte: new Date(now.getTime() - 15 * 60_000), lt: now } } }),
      prisma.merchantEvent.count({ where: { merchantId: merchant.id, referenceData: true, createdAt: { gte: new Date(now.getTime() - 15 * 60_000), lt: now }, metadata: { path: ['fixture'], equals: FIXTURE.marker } } }),
      prisma.merchantEvent.groupBy({ by: ['type'], where: { merchantId: merchant.id, referenceData: true }, _count: { _all: true } }),
      prisma.merchantIntent.groupBy({ by: ['type'], where: { merchantId: merchant.id, idempotencyKey: { startsWith: `${FIXTURE.marker}:` } }, _count: { _all: true } }),
      prisma.merchantSession.groupBy({ by: ['source', 'medium'], where: { merchantId: merchant.id, referenceData: true, campaign: FIXTURE.marker }, _count: { _all: true } }),
    ])
    const expectedFrameSkus = LOCAL_DASHBOARD_SIMULATION_FRAME_SKUS[selectedPreset]
    const periodMovement = current30DaySessions === 0
      ? null
      : Math.abs(current30DaySessions - previous30DaySessions) / current30DaySessions
    const requiredEventTypes = ['merchant_page_viewed', 'merchant_recommendation_completed', 'merchant_frame_selected', 'merchant_tryon_started', 'merchant_tryon_completed', 'merchant_compare_started']
    const requiredIntentTypes = ['FAVORITE', 'PRODUCT_CLICK', 'INQUIRY']
    const requiredSources = ['direct', 'google', 'instagram', 'partner-referral']
    const presetShapeIsValid = selectedPreset === 'showcase'
      ? current30DaySessions >= 220 && current30DaySessions <= 360
        && previous30DaySessions >= 220 && previous30DaySessions <= 360
        && periodMovement !== null && periodMovement >= 0.05 && periodMovement <= 0.2
        && recentActivitySessions >= 1 && recentActivityEvents >= 1
        && requiredEventTypes.every((type) => eventGroups.some((group) => group.type === type && group._count._all > 0))
        && requiredIntentTypes.every((type) => intentGroups.some((group) => group.type === type && group._count._all > 0))
        && requiredSources.every((source) => sourceGroups.some((group) => group.source === source && group._count._all > 0))
      : selectedPreset === 'low-volume'
        ? sessions > 0 && events > 0 && intents > 0
        : sessions === 0 && events === 0 && intents === 0
    if (JSON.stringify(actualExperiences) !== JSON.stringify(expectedExperiences) || markedExperiences !== experiences.length
      || frames.length !== expectedFrameSkus.length || frames.some((frame) => !expectedFrameSkus.includes(frame.sku ?? '') || frame.source !== 'SEED' || frame.sourceNotes !== FIXTURE.marker)
      || !presetShapeIsValid) {
      throw new Error('Refusing capture: Local dashboard fixture shape, marker, or privacy contract failed read-only verification.')
    }

    return {
      merchantId: merchant.id,
      slug: FIXTURE.slug,
      name: merchant.name,
      marker: FIXTURE.marker,
      preset: selectedPreset,
      classification: merchant.classification,
      pilotType: merchant.pilotType,
      referenceData: merchant.referenceData,
      database: { environment: database.environment, identity: database.databaseIdentity },
      counts: { experiences: experiences.length, frames: frames.length, sessions, events, intents },
      periods: { current30DaySessions, previous30DaySessions, last7DaySessions },
      recentActivity: { sessionsWithin15Minutes: recentActivitySessions, eventsWithin15Minutes: recentActivityEvents },
      eventTypes: eventGroups.map((group) => ({ type: group.type, count: group._count._all })),
      intentTypes: intentGroups.map((group) => ({ type: group.type, count: group._count._all })),
      acquisitionSources: sourceGroups.map((group) => ({ source: group.source, medium: group.medium, sessions: group._count._all })),
      resetOrSeededByCaptureCommand: false,
    }
  } finally {
    await prisma.$disconnect()
  }
}

function waitForServer(child: ChildProcess, origin: string): Promise<void> {
  return new Promise((resolve, reject) => {
    let settled = false
    child.once('error', (error) => { if (!settled) { settled = true; reject(error) } })
    child.once('exit', (code) => { if (!settled) { settled = true; reject(new Error(`Local Next server exited before readiness (code ${code ?? 'unknown'}).`)) } })
    const startedAt = Date.now()
    const poll = async () => {
      while (!settled && Date.now() - startedAt < 180_000) {
        try {
          const response = await fetch(`${origin}/api/auth/csrf`, { signal: AbortSignal.timeout(4_000) })
          if (response.ok) { settled = true; resolve(); return }
        } catch {
          // First-request compilation is expected; stay within the bounded startup window.
        }
        await delay(500)
      }
      if (!settled) { settled = true; reject(new Error('Local Next server did not become ready within 180 seconds.')) }
    }
    void poll()
  })
}

function slug(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9-]+/g, '-')
}

async function captureScene(page: Page, origin: string, merchantId: string, outputDir: string, scene: Scene, preset: LocalDashboardSimulationPreset) {
  const query = new URLSearchParams({ merchantId })
  if (scene.id.startsWith('analytics-')) query.set('range', scene.state === '7-day-low-volume' ? '7' : '30')
  const response = await page.goto(`${origin}${scene.route}?${query}`, { waitUntil: 'domcontentloaded', timeout: 60_000 })
  if (!response || response.status() >= 500) throw new Error(`${scene.id} route failed with HTTP ${response?.status() ?? 'no response'}.`)
  await page.getByRole('heading', { level: 1 }).first().waitFor({ state: 'visible', timeout: 30_000 })
  if (scene.id.startsWith('analytics-')) {
    if (preset === 'empty') {
      await page.getByRole('heading', { name: 'No shopper activity yet' }).waitFor({ state: 'visible', timeout: 15_000 })
    } else {
      await page.locator('[data-testid="merchant-decision-trend-chart"] svg.recharts-surface').waitFor({ state: 'visible', timeout: 30_000 })
      await page.locator('[data-testid="merchant-analytics-recent-activity"] [aria-label="Live data status: Live"]').waitFor({ state: 'visible', timeout: 15_000 })
    }
  }
  if (scene.route === HOME_PATH) {
    await page.locator('[aria-label="Live data status: Live"]').waitFor({ state: 'visible', timeout: 15_000 })
  }
  await page.evaluate(() => document.fonts.ready)
  await page.evaluate(async () => {
    const images = [...document.images]
    images.forEach((image) => { image.loading = 'eager' })
    await Promise.all(images.map((image) => image.decode().catch(() => undefined)))
  })
  await delay(350)

  let mobileNavigation: null | { expanded: boolean; linksVisible: boolean } = null
  if (scene.id === 'home-mobile-navigation') {
    await page.getByRole('button', { name: 'Open navigation' }).click()
    const nav = page.locator('#merchant-mobile-navigation')
    const closeButton = page.locator('header').getByRole('button', { name: 'Close navigation', exact: true })
    mobileNavigation = {
      expanded: await closeButton.getAttribute('aria-expanded').then((value) => value === 'true'),
      linksVisible: await nav.getByRole('link', { name: 'Analytics' }).isVisible() && await nav.getByRole('link', { name: 'Home' }).isVisible(),
    }
    if (!mobileNavigation.expanded || !mobileNavigation.linksVisible) throw new Error('Local mobile navigation failed its open/visibility check.')
  }

  const dimensions = await page.evaluate(() => ({
    viewport: { width: innerWidth, height: innerHeight },
    documentWidth: document.documentElement.scrollWidth,
    pageHeight: document.documentElement.scrollHeight,
    horizontalOverflow: document.documentElement.scrollWidth > innerWidth,
    chartCount: document.querySelectorAll('[data-slot="chart"] svg.recharts-surface').length,
    decisionTrendCurveCount: document.querySelectorAll('[data-testid="merchant-decision-trend-chart"] .recharts-line-curve').length,
    smoothDecisionTrendCurveCount: [...document.querySelectorAll<SVGPathElement>('[data-testid="merchant-decision-trend-chart"] .recharts-line-curve')].filter((path) => path.getAttribute('d')?.includes('C')).length,
    brokenImages: [...document.images].filter((image) => image.complete && image.naturalWidth === 0).map((image) => image.currentSrc || image.src),
    permanentLineDots: document.querySelectorAll('.recharts-line-dot').length,
    topFrames: [...document.querySelectorAll<HTMLElement>('[data-testid="analytics-top-frames"] ol > li')].map((item) => item.innerText.replace(/\s+/g, ' ').trim()),
    decisionPath: document.querySelector<HTMLOListElement>('ol[aria-label="VisuTry shopper decision path"]')?.innerText.replace(/\s+/g, ' ').trim() ?? null,
    decisionPathStageCount: document.querySelectorAll('ol[aria-label="VisuTry shopper decision path"] > li').length,
    intentSignals: document.querySelector<HTMLElement>('section[aria-labelledby="intent-signals-heading"]')?.innerText.replace(/\s+/g, ' ').trim() ?? null,
    recentActivityHeading: document.querySelector('[data-testid="merchant-analytics-recent-activity"] #merchant-live-pulse-title')?.textContent?.trim() ?? null,
    recentActivityStatus: document.querySelector('[data-testid="merchant-analytics-recent-activity"] [aria-label^="Live data status:"]')?.getAttribute('aria-label') ?? null,
    recentActivityItemCount: document.querySelectorAll('[data-testid="merchant-analytics-recent-activity"] ol[aria-label="Anonymous recent shopper actions"] > li').length,
    recentActivityEmptyState: document.querySelector<HTMLElement>('[data-testid="merchant-analytics-recent-activity"]')?.innerText.includes('No recent activity') ?? false,
    analyticsEmptyState: document.body.innerText.includes('No shopper activity yet'),
  }))

  const screenshots = []
  for (const mode of scene.captures) {
    const fileName = `${slug(scene.id)}-${mode === 'full-page' ? 'full' : 'viewport'}.png`
    await page.screenshot({ path: path.join(outputDir, fileName), fullPage: mode === 'full-page' })
    screenshots.push({ mode, fileName })
  }
  return {
    id: scene.id,
    route: `${scene.route}?${query.toString()}`,
    state: scene.id.startsWith('analytics-')
      ? scene.id.includes('7d') ? `${preset}-7-day` : `${preset}-30-day`
      : `${preset}-home`,
    viewport: scene.viewport,
    httpStatus: response.status(),
    captures: screenshots,
    dimensions,
    mobileNavigation,
  }
}

async function captureChartKeyboard(page: Page, origin: string, merchantId: string, outputDir: string) {
  await page.setViewportSize(DESKTOP)
  const query = new URLSearchParams({ merchantId, range: '30' })
  const response = await page.goto(`${origin}${ANALYTICS_PATH}?${query}`, { waitUntil: 'domcontentloaded', timeout: 60_000 })
  if (!response || response.status() >= 500) throw new Error('The Analytics chart accessibility route failed.')
  await page.locator('[data-testid="merchant-analytics-recent-activity"] [aria-label="Live data status: Live"]').waitFor({ state: 'visible', timeout: 15_000 })
  const chart = page.locator('[data-testid="merchant-decision-trend-chart"] svg.recharts-surface')
  await chart.waitFor({ state: 'visible', timeout: 30_000 })
  const focus = await chart.evaluate((svg) => ({ role: svg.getAttribute('role'), tabIndex: svg.getAttribute('tabindex'), ariaLabel: svg.getAttribute('aria-label') }))
  await chart.focus()
  await page.keyboard.press('ArrowRight')
  await delay(200)
  const tooltip = page.locator('[data-slot="chart"] [role="status"][aria-live="polite"]').first()
  const visible = await tooltip.isVisible().catch(() => false)
  const tooltipText = visible ? await tooltip.innerText() : null
  if (focus.role !== 'application' || focus.tabIndex !== '0' || !visible || !tooltipText) {
    throw new Error('Keyboard focus did not expose the chart data tooltip via the accessible chart layer.')
  }
  const fileName = 'analytics-chart-keyboard-tooltip.png'
  await page.screenshot({ path: path.join(outputDir, fileName) })
  return { focus, keyboardTooltipVisible: visible, tooltipText, reducedMotion: await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches), fileName }
}

async function main() {
  const runId = new Date().toISOString().replace(/[:.]/g, '-')
  const outputDir = path.join(ARTIFACT_ROOT, runId)
  fs.mkdirSync(outputDir, { recursive: true })
  let child: ChildProcess | undefined
  let browser: Browser | undefined
  const errors = { page: [] as string[], console: [] as string[], http5xx: [] as Array<{ status: number; url: string }>, blockedRemote: [] as string[] }

  try {
    const port = await allocatePort()
    const env = localEnvironment(port)
    const fixture = await verifyFixture(env)
    const origin = `http://127.0.0.1:${port}`
    const activeScenes = fixture.preset === 'empty'
      ? SCENES.filter((scene) => !scene.id.includes('7d-low-volume'))
      : SCENES
    const preflight = spawnSync('npm', ['run', 'merchant:local:preflight'], { cwd: ROOT, env, encoding: 'utf8', timeout: 60_000, maxBuffer: 4 * 1024 * 1024 })
    if (preflight.status !== 0) throw new Error(`Local Merchant preflight failed:\n${preflight.stdout}\n${preflight.stderr}`)

    const nextCli = path.join(ROOT, 'node_modules', 'next', 'dist', 'bin', 'next')
    child = spawn(process.execPath, [nextCli, 'dev', '--hostname', '127.0.0.1', '--port', String(port)], { cwd: ROOT, env, stdio: 'ignore' })
    await waitForServer(child, origin)

    browser = await chromium.launch({ channel: 'chrome', headless: true })
    const context = await browser.newContext({ viewport: DESKTOP, deviceScaleFactor: 1, reducedMotion: 'reduce' })
    await context.route('**/*', async (route) => {
      const url = route.request().url()
      if (url.startsWith(`${origin}/`) || url.startsWith('data:') || url.startsWith('blob:') || url.startsWith('about:')) return route.continue()
      errors.blockedRemote.push(url)
      return route.abort('blockedbyclient')
    })
    const auth = await request.newContext()
    const csrf = await auth.get(`${origin}/api/auth/csrf`)
    if (!csrf.ok()) throw new Error(`Local mock-auth CSRF returned HTTP ${csrf.status()}.`)
    const { csrfToken } = await csrf.json() as { csrfToken: string }
    const callback = await auth.post(`${origin}/api/auth/callback/mock-credentials`, { form: {
      email: 'test@example.com', qaIdentity: 'existing', type: 'free', csrfToken, callbackUrl: `${origin}/en/merchant`, json: 'true',
    } })
    if (!callback.ok()) throw new Error(`Local mock-auth callback returned HTTP ${callback.status()}.`)
    await context.addCookies((await auth.storageState()).cookies)
    await auth.dispose()

    const page = await context.newPage()
    page.on('pageerror', (error) => errors.page.push(error.message))
    page.on('console', (message) => { if (message.type() === 'error') errors.console.push(message.text()) })
    page.on('response', (response) => { if (response.status() >= 500) errors.http5xx.push({ status: response.status(), url: response.url() }) })

    const captures = []
    for (const scene of activeScenes) {
      await page.setViewportSize(scene.viewport)
      captures.push(await captureScene(page, origin, fixture.merchantId, outputDir, scene, fixture.preset))
    }

    await page.setViewportSize(DESKTOP)
    await page.goto(`${origin}${HOME_PATH}?merchantId=${fixture.merchantId}`, { waitUntil: 'domcontentloaded' })
    const recentHeading = page.getByRole('heading', { name: 'Recent shopper activity' })
    await page.locator('[aria-label="Live data status: Live"]').waitFor({ state: 'visible', timeout: 15_000 })
    await recentHeading.scrollIntoViewIfNeeded()
    const recentActivity = {
      visible: await recentHeading.isVisible(),
      text: await page.locator('section[aria-labelledby="merchant-live-pulse-title"]').innerText(),
      itemCount: await page.locator('section[aria-labelledby="merchant-live-pulse-title"] [aria-label="Anonymous recent shopper actions"] > li').count(),
      screenshot: 'home-anonymous-recent-activity.png',
    }
    await page.screenshot({ path: path.join(outputDir, recentActivity.screenshot) })
    const chartKeyboard = fixture.preset === 'empty'
      ? null
      : await captureChartKeyboard(page, origin, fixture.merchantId, outputDir)

    const git = spawnSync('git', ['rev-parse', 'HEAD'], { cwd: ROOT, encoding: 'utf8' })
    const workingTree = spawnSync('git', ['status', '--porcelain'], { cwd: ROOT, encoding: 'utf8' })
    const evidence = {
      schemaVersion: 1,
      runId,
      generatedAt: new Date().toISOString(),
      git: { sha: git.stdout.trim(), workingTreeDirty: Boolean(workingTree.stdout.trim()) },
      environment: { mode: 'LOCAL', origin, auth: 'mock credentials', stripe: 'TEST', providerCalls: false, previewOrProductionAccess: false },
      fixture,
      captureMode: 'screenshots',
      futureVideoSceneContract: activeScenes.map(({ id, route, state, viewport, steps }) => ({ id, route, state, viewport, steps, durationMs: null })),
      scenes: captures,
      anonymousRecentActivity: recentActivity,
      chartKeyboard,
      errors: {
        page: errors.page,
        console: errors.console,
        http5xx: errors.http5xx,
        blockedRemoteRequests: errors.blockedRemote,
        horizontalOverflow: captures.filter((capture) => capture.dimensions.horizontalOverflow).length,
        brokenImages: captures.reduce((total, capture) => total + capture.dimensions.brokenImages.length, 0),
      },
    }
    fs.writeFileSync(path.join(outputDir, 'evidence.json'), `${JSON.stringify(evidence, null, 2)}\n`)
    const analyticsQaFailure = captures.filter((capture) => capture.id.startsWith('analytics-')).some((capture) => fixture.preset === 'empty'
      ? !capture.dimensions.analyticsEmptyState
      : capture.dimensions.decisionTrendCurveCount < 3 || capture.dimensions.smoothDecisionTrendCurveCount < 3
        || capture.dimensions.decisionPathStageCount !== 5 || !capture.dimensions.recentActivityHeading)
    if (errors.page.length || errors.console.length || errors.http5xx.length || errors.blockedRemote.length
      || captures.some((capture) => capture.dimensions.horizontalOverflow || capture.dimensions.brokenImages.length)
      || analyticsQaFailure
      || !recentActivity.visible
      || (fixture.preset === 'showcase' && recentActivity.itemCount === 0)
      || (chartKeyboard !== null && !chartKeyboard.keyboardTooltipVisible)) {
      throw new Error(`Local dashboard capture QA failed; inspect ${path.join(outputDir, 'evidence.json')}.`)
    }

    const screenshotFiles = captures.flatMap((capture) => capture.captures.map((item) => item.fileName))
      .concat(recentActivity.screenshot, ...(chartKeyboard ? [chartKeyboard.fileName] : []))
    console.log(JSON.stringify({
      outputDir: path.relative(ROOT, outputDir),
      evidence: path.relative(ROOT, path.join(outputDir, 'evidence.json')),
      screenshots: screenshotFiles,
      sceneCount: captures.length,
      fixture: fixture.slug,
      gitSha: evidence.git.sha,
      errorCounts: evidence.errors,
      localPreflight: 'PASS',
    }, null, 2))
    await context.close()
  } finally {
    if (browser) await browser.close().catch(() => {})
    if (child && child.exitCode === null) {
      child.kill('SIGTERM')
      await Promise.race([new Promise<void>((resolve) => child?.once('exit', () => resolve())), delay(5_000)])
      if (child.exitCode === null) child.kill('SIGKILL')
    }
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack || error.message : String(error))
  process.exitCode = 1
})
