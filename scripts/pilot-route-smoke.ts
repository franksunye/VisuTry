import { resolve } from 'node:path'
import { chromium } from 'playwright'
import { readPilotPackage, type PilotExperienceConfig } from '../src/modules/store/application/pilot-delivery-kit'

function packageArgument(): string {
  return process.argv.slice(2).find((argument) => !argument.startsWith('--')) ?? 'pilot/ello-sunglasses'
}

function baseUrlArgument(): string {
  const explicit = process.argv.find((argument) => argument.startsWith('--base-url='))?.slice('--base-url='.length)
  return (explicit || process.env.PILOT_BASE_URL || 'https://www.visutry.com').replace(/\/$/, '')
}

function routeFor(merchantSlug: string, experience: PilotExperienceConfig): string {
  return experience.type === 'STORE'
    ? `/en/store/${merchantSlug}`
    : `/en/c/${merchantSlug}/${experience.experienceSlug}`
}

async function main() {
  const packageDir = resolve(packageArgument())
  const baseUrl = baseUrlArgument()
  try {
    const pilot = await readPilotPackage(packageDir)
    const browser = await chromium.launch({ headless: true })
    const results: Array<Record<string, unknown>> = []
    for (const viewport of [{ name: 'desktop', width: 1440, height: 1000 }, { name: 'mobile', width: 390, height: 844 }]) {
      const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height } })
      for (const experience of pilot.experiences) {
        const page = await context.newPage()
        const consoleErrors: string[] = []
        const pageErrors: string[] = []
        page.on('console', (message) => {
          if (message.type() === 'error' && !message.text().includes('google-analytics.com')) consoleErrors.push(message.text())
        })
        page.on('pageerror', (error) => pageErrors.push(error.message))
        const route = routeFor(pilot.config.merchantSlug, experience)
        const expectedCount = experience.catalogSelection === 'ALL_ACTIVE'
          ? pilot.catalog.filter((row) => row.status === 'ACTIVE').length
          : experience.catalogSelection.length
        try {
          const response = await page.goto(`${baseUrl}${route}`, { waitUntil: 'networkidle', timeout: 60000 })
          const body = await page.locator('body').innerText()
          results.push({
            viewport: viewport.name,
            route,
            status: response?.status() ?? null,
            merchantIdentity: body.includes(pilot.config.displayName),
            headline: experience.headline ? body.includes(experience.headline) : true,
            frameCount: body.includes(`${expectedCount} frames ready`),
            referenceMarker: /Reference Pilot|REFERENCE PILOT|Simulation/i.test(body),
            applicationError: /Application error|Internal Server Error|Something went wrong/i.test(body),
            consoleErrors,
            pageErrors,
          })
        } catch (error) {
          results.push({ viewport: viewport.name, route, status: null, error: error instanceof Error ? error.message : String(error), consoleErrors, pageErrors })
        } finally {
          await page.close()
        }
      }
      await context.close()
    }
    await browser.close()
    const failures = results.filter((result) => result.status !== 200 || result.merchantIdentity !== true || result.headline !== true || result.frameCount !== true || result.referenceMarker !== true || result.applicationError === true || (result.consoleErrors as string[]).length > 0 || (result.pageErrors as string[]).length > 0 || Boolean(result.error))
    console.log(JSON.stringify({ command: 'pilot:route-smoke', packageDir, baseUrl, results, failures }, null, 2))
    if (failures.length > 0) process.exitCode = 1
  } catch (error) {
    console.error(JSON.stringify({ command: 'pilot:route-smoke', packageDir, baseUrl, errors: [String(error)] }, null, 2))
    process.exitCode = 1
  }
}

main()
