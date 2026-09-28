import { expect, test } from '@playwright/test'
import path from 'node:path'

test.use({ viewport: { width: 1024, height: 768 } })
test.setTimeout(120_000)

test('Local Demo shopper can explore the full Store selection and choose Rowan plus Lane without starting Try-On', async ({ page, context }) => {
  const unexpectedOrigins: string[] = []
  const tryOnRequests: string[] = []
  const httpErrors: string[] = []
  const consoleErrors: string[] = []
  const allowedOrigins = new Set(['http://127.0.0.1:3001', 'http://127.0.0.1:4100'])

  await context.route('**/*', async (route) => {
    const requestUrl = new URL(route.request().url())
    if (requestUrl.protocol === 'data:' || requestUrl.protocol === 'blob:') return route.continue()
    if (!allowedOrigins.has(requestUrl.origin)) {
      unexpectedOrigins.push(requestUrl.origin)
      return route.abort('blockedbyclient')
    }
    if (requestUrl.pathname.includes('/api/store/sessions/try-on')) {
      tryOnRequests.push(requestUrl.pathname)
      return route.abort('blockedbyclient')
    }
    return route.continue()
  })

  page.on('response', (response) => {
    if (response.status() >= 500) httpErrors.push(`${response.status()} ${response.url()}`)
  })
  page.on('console', (message) => {
    const text = message.text()
    // MediaPipe's bundled TFLite runtime emits this informational startup line
    // through console.error; it is not a browser/application error.
    if (message.type() === 'error' && !text.includes('INFO: Created TensorFlow Lite XNNPACK delegate for CPU.')) {
      consoleErrors.push(text)
    }
  })
  page.on('pageerror', (error) => consoleErrors.push(error.message))

  await page.goto('/en/store/visutry-demo-optical', { waitUntil: 'load' })
  await expect(page.getByRole('heading', { name: 'Shop the VisuTry Demo Optical eyewear collection' })).toBeVisible()
  await page.getByRole('button', { name: 'Try on your photo' }).click()
  const workspace = page.getByRole('dialog', { name: 'Try-on workspace' })
  await expect(workspace).toBeVisible()
  await workspace.getByRole('button', { name: 'I understand — continue' }).click()

  const shopperPhoto = path.resolve('docs/assets/local-demo/visutry-demo-shopper-v1.png')
  await workspace.getByLabel('Your photo').setInputFiles(shopperPhoto)
  await expect(page.getByRole('heading', { name: 'Recommended for you' })).toBeVisible({ timeout: 45000 })
  await expect(page.getByTestId('store-fit-profile')).toContainText('Fit profile detected')

  const recommendedSection = page.getByRole('heading', { name: 'Recommended for you' }).locator('xpath=ancestor::section[1]')
  const rankedNames = await recommendedSection.locator('button[aria-label^="Select "]').evaluateAll((buttons) =>
    buttons.map((button) => button.getAttribute('aria-label')?.replace(/^Select /, '')),
  )
  expect(rankedNames).toEqual(['VT Cove', 'VT Mira', 'VT Arden', 'VT North', 'VT Sable', 'VT Lane'])
  await expect(page.getByText('Why we recommend it').first()).toBeVisible()
  await expect(page.getByText('Why it fits')).toHaveCount(0)
  await expect(page.getByText('Price unavailable')).toHaveCount(0)
  await expect(page.getByText('$0.00')).toHaveCount(0)

  await page.getByRole('button', { name: 'Explore all frames' }).click()
  const additionalSection = page.getByRole('heading', { name: 'More frames from this Store' }).locator('xpath=ancestor::section[1]')
  const additionalList = additionalSection.getByRole('list')
  await expect(additionalList.getByRole('button', { name: 'Select VT Rowan' })).toBeVisible()
  await expect(additionalList.locator('button[aria-label^="Select "]')).toHaveCount(4)
  const additionalNames = await additionalList.locator('button[aria-label^="Select "]').evaluateAll((buttons) =>
    buttons.map((button) => button.getAttribute('aria-label')?.replace(/^Select /, '')),
  )
  expect(additionalNames).toEqual(expect.arrayContaining(['VT Rowan', 'VT Vale', 'VT Solis', 'VT Lumen']))
  expect(new Set([...rankedNames, ...additionalNames]).size).toBe(10)

  await additionalList.getByRole('button', { name: 'Select VT Rowan' }).click()
  await expect(additionalList.getByRole('button', { name: 'Remove VT Rowan' })).toHaveAttribute('aria-pressed', 'true')
  await recommendedSection.getByRole('button', { name: 'Select VT Lane' }).click()
  await expect(recommendedSection.getByRole('button', { name: 'Remove VT Lane' })).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByText('Selected 2 of 2', { exact: true }).first()).toBeVisible()
  await expect(additionalList.getByRole('button', { name: 'Select VT Solis' })).toBeDisabled()

  // Deliberately stop before confirming the selection or entering Try-On.
  expect(tryOnRequests).toEqual([])
  expect(unexpectedOrigins).toEqual([])
  expect(httpErrors).toEqual([])
  expect(consoleErrors).toEqual([])
})
