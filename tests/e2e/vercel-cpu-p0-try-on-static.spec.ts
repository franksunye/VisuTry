import { test, expect } from '@playwright/test'

for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }, { width: 430, height: 932 }]) {
  test(`public Try-On handoff preserves parameters at ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport)
    await page.goto('/en/try-on/glasses?source=free-face-shape-detector&faceShape=oval&photoHandoff=handoff-test&ignored=1')

    // The first visible hero CTA previously linked back to this exact URL,
    // causing an unauthenticated visitor to loop on the public landing.
    const startLink = page.getByRole('link', { name: 'Start glasses try-on' })
    const belowFoldLink = page.getByRole('link', { name: 'Start free glasses try-on' })
    const expectedCallback = '/en/try-on/glasses?source=free-face-shape-detector&faceShape=oval&photoHandoff=handoff-test'
    await expect(startLink).toBeVisible()
    await expect(belowFoldLink).toBeVisible()
    for (const link of [startLink, belowFoldLink]) {
      await expect.poll(async () => {
        const href = await link.getAttribute('href')
        return href ? new URL(href, 'http://127.0.0.1:3001').searchParams.get('callbackUrl') : null
      }).toBe(expectedCallback)
    }

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
