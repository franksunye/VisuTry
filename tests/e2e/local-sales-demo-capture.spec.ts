import { expect, test, type Browser, type BrowserContext, type Locator, type Page } from '@playwright/test'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { assertTryOnSubmissionCount } from '../../scripts/lib/local-sales-demo-capture-contract'

test.setTimeout(8 * 60 * 1000)

const baseUrl = process.env.PLAYWRIGHT_BASE_URL || ''
const enabled = process.env.APP_ENV === 'local'
  && process.env.VISUTRY_LOCAL_DEMO_RUNTIME === '1'
  && process.env.VISUTRY_LOCAL_DEMO_PROVIDER_MODE === 'blocked'
  && process.env.VISUTRY_LOCAL_SALES_DEMO_CAPTURE === '1'
  && /^http:\/\/(127\.0\.0\.1|localhost):3001$/.test(baseUrl)

const viewport = { width: 1440, height: 810 }
const shopperAsset = path.resolve('docs/assets/local-demo/visutry-demo-shopper-v1.png')

type SceneResult = {
  id: string
  name: string
  file: string
  purpose: string
  qaStill: string
  qaStillTimeSeconds: number | null
  durationMs: number
  sizeBytes: number
  width: number
  height: number
}

type BrowserAudit = {
  unexpectedOrigins: string[]
  errors: string[]
  notFound: string[]
  serverErrors: string[]
  tryOnSubmissions: number
}

function requiredPath(name: string, root: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`${name} is required.`)
  const resolved = path.resolve(value)
  if (!resolved.startsWith(`${path.resolve(root)}${path.sep}`)) {
    throw new Error(`${name} must remain inside its approved Local artifact namespace.`)
  }
  return resolved
}

async function wait(page: Page, milliseconds: number): Promise<void> {
  await page.waitForTimeout(milliseconds)
}

async function moveNaturally(page: Page, locator: Locator): Promise<void> {
  await locator.scrollIntoViewIfNeeded()
  const box = await locator.boundingBox()
  if (!box) throw new Error('The target control is not visible for a natural pointer move.')
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 14 })
  await wait(page, 220)
}

async function scrollNaturally(page: Page, totalPixels: number): Promise<void> {
  const steps = Math.max(2, Math.ceil(totalPixels / 220))
  const delta = Math.round(totalPixels / steps)
  for (let step = 0; step < steps; step += 1) {
    await page.mouse.wheel(0, delta)
    await wait(page, 260)
  }
}

async function installBrowserGuard(context: BrowserContext, audit: BrowserAudit): Promise<void> {
  const allowedOrigins = new Set([
    'http://127.0.0.1:3001',
    'http://localhost:3001',
    'http://127.0.0.1:4100',
    'http://localhost:4100',
  ])

  await context.route('**/*', async (route) => {
    const request = route.request()
    const url = new URL(request.url())
    if (url.protocol === 'data:' || url.protocol === 'blob:' || !['http:', 'https:'].includes(url.protocol)) {
      await route.continue()
      return
    }
    if (!allowedOrigins.has(url.origin)) {
      audit.unexpectedOrigins.push(url.origin)
      await route.abort('blockedbyclient')
      return
    }
    if (request.method() === 'POST' && url.pathname === '/api/store/sessions/try-on') {
      audit.tryOnSubmissions += 1
      audit.errors.push('Try-On submission was blocked by the sales-demo scene capture boundary.')
      await route.abort('blockedbyclient')
      return
    }
    await route.continue()
  })
}

function observePage(page: Page, audit: BrowserAudit): void {
  page.on('pageerror', () => audit.errors.push('uncaught page error'))
  page.on('console', (message) => {
    if (message.type() === 'error' && !message.text().includes('INFO: Created TensorFlow Lite XNNPACK delegate for CPU.')) {
      audit.errors.push('browser console error')
    }
  })
  page.on('response', (response) => {
    const url = new URL(response.url())
    const description = `${response.status()} ${url.pathname}`
    if (response.status() === 404) audit.notFound.push(description)
    if (response.status() >= 500) audit.serverErrors.push(description)
  })
}

async function assertVisibleImagesLoaded(page: Page): Promise<void> {
  await expect.poll(() => page.locator('img').evaluateAll((elements) => {
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight
    const images = elements.filter((element): element is HTMLImageElement => element instanceof HTMLImageElement)
    const visible = images.filter((image) => {
      const rect = image.getBoundingClientRect()
      const style = window.getComputedStyle(image)
      return style.display !== 'none' && style.visibility !== 'hidden'
        && rect.width > 0 && rect.height > 0
        && rect.bottom > 0 && rect.right > 0 && rect.top < viewportHeight && rect.left < viewportWidth
    })
    return visible.length > 0 && visible.every((image) => image.complete && image.naturalWidth > 0)
  })).toBe(true)
}

async function openStore(page: Page): Promise<void> {
  await page.goto('/en/store/visutry-demo-optical', { waitUntil: 'load' })
  await expect(page.getByRole('heading', { name: 'Shop the VisuTry Demo Optical eyewear collection' })).toBeVisible()
}

async function enterPhotoFlow(page: Page, sessionIds: string[]): Promise<Locator> {
  const entry = page.getByRole('button', { name: 'Try on your photo' })
  await moveNaturally(page, entry)
  await entry.click()
  const workspace = page.getByRole('dialog', { name: 'Try-on workspace' })
  await expect(workspace).toBeVisible()
  await wait(page, 550)

  const sessionResponsePromise = page.waitForResponse((response) =>
    response.request().method() === 'POST' && new URL(response.url()).pathname === '/api/store/sessions',
  )
  await workspace.getByRole('button', { name: 'I understand — continue' }).click()
  const sessionResponse = await sessionResponsePromise
  expect(sessionResponse.ok()).toBe(true)
  const payload = await sessionResponse.json() as { data?: { merchantSessionId?: string } }
  const sessionId = payload.data?.merchantSessionId
  if (!sessionId) throw new Error('The canonical Local Demo Store did not create a shopper session.')
  sessionIds.push(sessionId)

  await workspace.getByLabel('Your photo').setInputFiles(shopperAsset)
  await expect(page.getByRole('heading', { name: 'Recommended for you' })).toBeVisible({ timeout: 60_000 })
  const profile = page.getByTestId('store-fit-profile')
  await expect(profile).toContainText('Fit profile detected')
  return profile
}

async function recordScene(
  browser: Browser,
  outputDir: string,
  temporaryDir: string,
  id: string,
  name: string,
  file: string,
  purpose: string,
  qaStill: string,
  audit: BrowserAudit,
  action: (page: Page) => Promise<void>,
): Promise<SceneResult> {
  const videoDir = path.join(temporaryDir, id)
  fs.mkdirSync(videoDir, { recursive: true })
  const context = await browser.newContext({
    viewport,
    deviceScaleFactor: 1,
    colorScheme: 'light',
    locale: 'en-US',
    recordVideo: { dir: videoDir, size: viewport },
  })
  const page = await context.newPage()
  const video = page.video()
  if (!video) throw new Error(`Playwright video recording did not start for scene ${id}.`)
  observePage(page, audit)
  await installBrowserGuard(context, audit)
  const startedAt = Date.now()
  await action(page)
  const durationMs = Date.now() - startedAt
  await context.close()
  const videoPath = path.join(outputDir, file)
  await video.saveAs(videoPath)
  const stats = fs.statSync(videoPath)
  if (!stats.size) throw new Error(`Scene ${id} produced an empty WebM.`)
  return {
    id,
    name,
    file,
    purpose,
    qaStill,
    qaStillTimeSeconds: null,
    durationMs,
    sizeBytes: stats.size,
    width: viewport.width,
    height: viewport.height,
  }
}

async function extractQaStill(browser: Browser, outputDir: string, scene: SceneResult): Promise<void> {
  const videoPath = path.join(outputDir, scene.file)
  const videoBytes = fs.readFileSync(videoPath)
  const page = await browser.newPage({ viewport, deviceScaleFactor: 1 })
  try {
    await page.setContent('<video id="recording" muted playsinline></video><canvas id="still"></canvas>')
    const video = page.locator('#recording')
    const metadata = await video.evaluate(async (element, base64) => {
      const player = element as HTMLVideoElement
      const binary = atob(base64)
      const bytes = new Uint8Array(binary.length)
      for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index)
      player.src = URL.createObjectURL(new Blob([bytes], { type: 'video/webm' }))
      await new Promise<void>((resolve, reject) => {
        player.onloadedmetadata = () => resolve()
        player.onerror = () => reject(new Error('Chromium could not decode the recorded WebM metadata.'))
      })
      return { width: player.videoWidth, height: player.videoHeight, durationSeconds: player.duration }
    }, videoBytes.toString('base64'))

    if (metadata.width !== viewport.width || metadata.height !== viewport.height) {
      throw new Error(`${scene.file} dimensions are ${metadata.width}x${metadata.height}, expected 1440x810.`)
    }
    if (!Number.isFinite(metadata.durationSeconds) || metadata.durationSeconds <= 0) {
      throw new Error(`${scene.file} has an invalid decoded duration.`)
    }

    const stillTimeSeconds = Math.max(0.05, metadata.durationSeconds - 0.25)
    await video.evaluate(async (element, timeSeconds) => {
      const player = element as HTMLVideoElement
      await new Promise<void>((resolve, reject) => {
        player.onseeked = () => resolve()
        player.onerror = () => reject(new Error('Chromium could not seek the recorded WebM.'))
        player.currentTime = timeSeconds
      })
      const canvas = document.querySelector('#still') as HTMLCanvasElement
      canvas.width = player.videoWidth
      canvas.height = player.videoHeight
      const context = canvas.getContext('2d')
      if (!context) throw new Error('Could not create a canvas context for the decoded QA still.')
      context.drawImage(player, 0, 0, canvas.width, canvas.height)
    }, stillTimeSeconds)
    await page.locator('#still').screenshot({ path: path.join(outputDir, scene.qaStill) })

    scene.qaStillTimeSeconds = Number(stillTimeSeconds.toFixed(2))
    scene.durationMs = Math.round(metadata.durationSeconds * 1000)
    scene.sizeBytes = videoBytes.byteLength
    scene.width = metadata.width
    scene.height = metadata.height
  } finally {
    await page.close()
  }
}

test('captures four short Local sales-demo scenes with Providers blocked', async ({ browser }) => {
  test.skip(!enabled, 'Run only through the guarded demo:local:sales-demo-capture command.')
  if (!fs.existsSync(shopperAsset)) throw new Error('Canonical Demo Shopper image is missing.')

  const outputDir = requiredPath('VISUTRY_LOCAL_SALES_DEMO_OUTPUT_DIR', '.local/sales-demo')
  const privateRoot = path.resolve('.local/sales-demo/.private')
  const stateFile = requiredPath('VISUTRY_LOCAL_SALES_DEMO_STATE_FILE', privateRoot)
  const runId = process.env.VISUTRY_LOCAL_SALES_DEMO_RUN_ID
  if (!runId || !path.basename(outputDir).startsWith(runId)) throw new Error('Sales-demo output directory/run ID mismatch.')
  fs.mkdirSync(outputDir, { recursive: true })

  const temporaryDir = fs.mkdtempSync(path.join(os.tmpdir(), 'visutry-sales-scene-'))
  const audit: BrowserAudit = {
    unexpectedOrigins: [],
    errors: [],
    notFound: [],
    serverErrors: [],
    tryOnSubmissions: 0,
  }
  const sessionIds: string[] = []
  const scenes: SceneResult[] = []
  const startedAt = new Date().toISOString()

  try {
    scenes.push(await recordScene(
      browser, outputDir, temporaryDir,
      '01', 'Store Entry', '01-store-entry.webm',
      'Establish the working VisuTry Demo Optical Store and shopper entry.',
      '01-store-entry-qa.png', audit,
      async (page) => {
        await openStore(page)
        await wait(page, 1600)
        await assertVisibleImagesLoaded(page)
        await scrollNaturally(page, 440)
        await assertVisibleImagesLoaded(page)
        await wait(page, 850)
        const entry = page.getByRole('button', { name: 'Try on your photo' })
        await moveNaturally(page, entry)
        await entry.click()
        const workspace = page.getByRole('dialog', { name: 'Try-on workspace' })
        await expect(workspace).toBeVisible()
        await expect(workspace.getByRole('button', { name: 'I understand — continue' })).toBeVisible({ timeout: 20_000 })
        await wait(page, 1500)
      },
    ))

    scenes.push(await recordScene(
      browser, outputDir, temporaryDir,
      '02', 'Face Intelligence', '02-face-intelligence.webm',
      'Show on-device Face Intelligence and the shopper fit summary.',
      '02-face-intelligence-qa.png', audit,
      async (page) => {
        await openStore(page)
        await wait(page, 1200)
        const profile = await enterPhotoFlow(page, sessionIds)
        await moveNaturally(page, profile)
        await expect(profile).toContainText(/Oval profile/i)
        await expect(profile).toContainText(/width/i)
        await expect(profile).toContainText(/length/i)
        await expect(profile).toContainText(/jawline/i)
        await expect(page.getByTestId('store-fit-map')).toHaveAttribute('data-fit-map-overlay', 'visible')
        await expect.poll(() => page.getByTestId('store-fit-map').getAttribute('data-fit-map-point-count').then(Number)).toBeGreaterThan(0)
        await assertVisibleImagesLoaded(page)
        await wait(page, 4200)
      },
    ))

    scenes.push(await recordScene(
      browser, outputDir, temporaryDir,
      '03', 'Recommendation', '03-recommendation.webm',
      'Show personalized Store recommendations and their fit rationale.',
      '03-recommendation-qa.png', audit,
      async (page) => {
        await openStore(page)
        await wait(page, 1300)
        const profile = await enterPhotoFlow(page, sessionIds)
        await moveNaturally(page, page.getByRole('heading', { name: 'Recommended for you' }))
        await expect(profile).toContainText('Fit profile detected')
        const recommendationHeading = page.getByRole('heading', { name: 'Recommended for you' })
        await expect(recommendationHeading).toBeVisible()
        await wait(page, 1200)
        await expect(page.getByText('Why we recommend it').first()).toBeVisible()
        await expect(page.getByRole('button', { name: 'Explore all frames' })).toBeVisible()
        await assertVisibleImagesLoaded(page)
        await wait(page, 3300)
      },
    ))

    scenes.push(await recordScene(
      browser, outputDir, temporaryDir,
      '04', 'Frame Selection', '04-frame-selection.webm',
      'Show frame selection and reach Try-On entry without submitting a generation.',
      '04-frame-selection-qa.png', audit,
      async (page) => {
        await openStore(page)
        await wait(page, 450)
        await enterPhotoFlow(page, sessionIds)
        const explore = page.getByRole('button', { name: 'Explore all frames' })
        await moveNaturally(page, explore)
        await explore.click()
        const additional = page.getByRole('heading', { name: 'More frames from this Store' }).locator('xpath=ancestor::section[1]')
        await expect(additional.getByRole('button', { name: 'Select VT Rowan' })).toBeVisible()
        await moveNaturally(page, additional.getByRole('button', { name: 'Select VT Rowan' }))
        await additional.getByRole('button', { name: 'Select VT Rowan' }).click()
        const shortlist = page.getByRole('complementary')
        await expect(shortlist.getByText('Selected 1 of 2', { exact: true })).toBeVisible()
        const lane = page.getByRole('button', { name: 'Select VT Lane' })
        await moveNaturally(page, lane)
        await lane.click()
        await expect(shortlist.getByText('Selected 2 of 2', { exact: true })).toBeVisible()
        const continueButton = page.locator('[data-selection-cta="desktop"]')
        await moveNaturally(page, continueButton)
        await continueButton.click()
        await expect(continueButton).toContainText('Continue to Try-On')
        await wait(page, 700)
        await continueButton.click()
        await expect(page.getByTestId('store-tryon-start')).toBeVisible()
        await wait(page, 1300)
        await assertVisibleImagesLoaded(page)
        // Deliberately stop before clicking store-tryon-start.
      },
    ))

    assertTryOnSubmissionCount(audit.tryOnSubmissions)
    expect(audit.unexpectedOrigins).toEqual([])
    expect(audit.errors).toEqual([])
    expect(audit.notFound).toEqual([])
    expect(audit.serverErrors).toEqual([])
    expect(sessionIds).toHaveLength(3)
    expect(new Set(sessionIds).size).toBe(3)

    for (const scene of scenes) await extractQaStill(browser, outputDir, scene)

    const state = {
      runId,
      mode: 'blocked',
      startedAt,
      sessionIds,
      tryOnSubmissions: audit.tryOnSubmissions,
      browserAudit: audit,
      scenes,
      capturedAt: new Date().toISOString(),
    }
    fs.mkdirSync(path.dirname(stateFile), { recursive: true, mode: 0o700 })
    fs.writeFileSync(stateFile, JSON.stringify(state, null, 2), { mode: 0o600, flag: 'wx' })
  } finally {
    fs.rmSync(temporaryDir, { recursive: true, force: true })
  }
})
