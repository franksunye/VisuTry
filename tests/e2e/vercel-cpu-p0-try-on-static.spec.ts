import { test, expect } from '@playwright/test'

for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
  test(`public Try-On handoff preserves parameters at ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport)
    await page.goto('/en/try-on/glasses?source=free-face-shape-detector&faceShape=oval&photoHandoff=handoff-test&ignored=1')

    const startLink = page.locator('main a[href^="/en/auth/signin?callbackUrl="]').first()
    await expect(startLink).toBeVisible()
    await expect.poll(async () => {
      const href = await startLink.getAttribute('href')
      return href ? new URL(href, 'http://127.0.0.1:3001').searchParams.get('callbackUrl') : null
    }).toBe('/en/try-on/glasses?source=free-face-shape-detector&faceShape=oval&photoHandoff=handoff-test')

    // The offline browser test does not perform Auth0 login; it verifies the
    // actual clicked destination without contacting the external auth provider.
    await page.route('**/en/auth/signin?**', async (route) => {
      await route.fulfill({ status: 200, contentType: 'text/html', body: '<title>Offline sign-in destination</title>' })
    })
    await startLink.click()
    await expect(page).toHaveURL(/\/en\/auth\/signin\?callbackUrl=/)
    expect(new URL(page.url()).searchParams.get('callbackUrl')).toBe(
      '/en/try-on/glasses?source=free-face-shape-detector&faceShape=oval&photoHandoff=handoff-test',
    )
  })
}
