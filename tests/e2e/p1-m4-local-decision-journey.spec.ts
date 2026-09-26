import { expect, test } from '@playwright/test'

const isLocalDecisionJourneyRun = process.env.NODE_ENV === 'test'
  && process.env.APP_ENV === 'local'
  && process.env.ENABLE_MOCKS === 'true'
  && process.env.TEST_MODE === 'true'
  && /^http:\/\/(127\.0\.0\.1|localhost):3001$/.test(process.env.PLAYWRIGHT_BASE_URL || '')

test.describe('P1-M4 Local Decision Journey', () => {
  test('applies and renders a bounded Experience policy without Try-On/Compare', async ({ page, request }) => {
    test.skip(!isLocalDecisionJourneyRun, 'Run against the guarded Local PostgreSQL environment.')

    const browserErrors: string[] = []
    const serverErrors: string[] = []
    page.on('pageerror', (error) => browserErrors.push(error.message))
    page.on('console', (message) => { if (message.type() === 'error') browserErrors.push(message.text()) })
    page.on('response', (response) => { if (response.status() >= 500) serverErrors.push(`${response.status()} ${response.url()}`) })

    const csrf = await request.get('/api/auth/csrf').then((response) => response.json()) as { csrfToken: string }
    const login = await request.post('/api/auth/callback/mock-credentials', {
      form: {
        email: 'admin@local.test',
        qaIdentity: 'admin',
        type: 'admin',
        csrfToken: csrf.csrfToken,
        callbackUrl: '/admin/store',
        json: 'true',
      },
    })
    expect(login.ok()).toBeTruthy()

    const merchantsResponse = await request.get('/api/admin/store/merchants')
    expect(merchantsResponse.status()).toBe(200)
    const merchantsPayload = await merchantsResponse.json() as { data: { merchants: Array<{ id: string; slug: string }> } }
    const merchant = merchantsPayload.data.merchants.find((item) => item.slug === 'local-qa-pilot')
    test.skip(!merchant, 'Run the Local Live Pulse E2E first to provision the deterministic public Store fixture.')

    const workspaceResponse = await request.get(`/api/admin/store/merchants/${merchant!.id}/experiences?type=STORE`)
    expect(workspaceResponse.status()).toBe(200)
    const workspacePayload = await workspaceResponse.json() as { data: { experiences: Array<{ id: string; type: string }> } }
    const experience = workspacePayload.data.experiences.find((item) => item.type === 'STORE')
    test.skip(!experience, 'The Local Store fixture has no Experience yet.')

    const reducedPolicy = { enabledStages: ['FACE_ANALYSIS', 'FIT_PROFILE', 'RECOMMENDATION'] }
    const updateResponse = await request.put(`/api/admin/store/merchants/${merchant!.id}/experiences/${experience!.id}`, {
      data: { journeyPolicy: reducedPolicy },
    })
    expect(updateResponse.status()).toBe(200)

    try {
      await page.goto('/en/store/local-qa-pilot', { waitUntil: 'networkidle' })
      await expect(page.getByRole('button', { name: 'Try on your photo', exact: true })).toBeVisible()
      await page.getByRole('button', { name: 'Try on your photo', exact: true }).click()
      await expect(page.getByRole('dialog', { name: /try-on workspace/i })).toBeVisible()
      await page.getByRole('button', { name: /I understand.*continue/i }).click()
      const progress = page.getByRole('dialog', { name: /try-on workspace/i }).getByRole('main').locator('section').first()
      await expect(progress).toContainText(/fit profile/i)
      await expect(progress).toContainText(/choose frames/i)
      await expect(progress).not.toContainText(/start try-on|compare/i)
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
    } finally {
      const restoreResponse = await request.put(`/api/admin/store/merchants/${merchant!.id}/experiences/${experience!.id}`, {
        data: { journeyPolicy: null },
      })
      expect(restoreResponse.status()).toBe(200)
    }

    expect(browserErrors).toEqual([])
    expect(serverErrors).toEqual([])
  })
})
