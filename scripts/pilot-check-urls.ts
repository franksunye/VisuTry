import { resolve } from 'node:path'
import { readPilotPackage, type PilotCatalogRow } from '../src/modules/store/application/pilot-delivery-kit'

type UrlKind = 'product' | 'image'

type UrlCheck = {
  kind: UrlKind
  externalId: string
  url: string
  finalUrl: string | null
  status: number | null
  healthy: boolean
  redirects: Array<{ status: number; from: string; to: string }>
  fallbackToGet: boolean
  error?: string
}

const timeoutMs = Math.max(1000, Number(process.env.PILOT_URL_TIMEOUT_MS ?? 10000))
const concurrency = Math.max(1, Math.min(20, Number(process.env.PILOT_URL_CONCURRENCY ?? 4)))

function packageArgument(): string {
  return process.argv.slice(2).find((argument) => !argument.startsWith('--')) ?? 'pilot/ello-sunglasses'
}

async function fetchWithHealth(url: string, kind: UrlKind, externalId: string): Promise<UrlCheck> {
  let currentUrl = url
  let method: 'HEAD' | 'GET' = 'HEAD'
  let fallbackToGet = false
  const redirects: UrlCheck['redirects'] = []

  for (let hop = 0; hop < 6; hop += 1) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)
    try {
      const response = await fetch(currentUrl, {
        method,
        redirect: 'manual',
        signal: controller.signal,
        headers: { 'user-agent': 'VisuTry-Pilot-URL-Health/1.0' },
      })
      clearTimeout(timer)

      if (method === 'HEAD' && [403, 405, 501].includes(response.status)) {
        method = 'GET'
        fallbackToGet = true
        continue
      }

      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get('location')
        if (!location) {
          return { kind, externalId, url, finalUrl: currentUrl, status: response.status, healthy: false, redirects, fallbackToGet, error: 'redirect response has no location' }
        }
        const nextUrl = new URL(location, currentUrl).toString()
        redirects.push({ status: response.status, from: currentUrl, to: nextUrl })
        currentUrl = nextUrl
        method = 'HEAD'
        continue
      }

      return {
        kind,
        externalId,
        url,
        finalUrl: currentUrl,
        status: response.status,
        healthy: response.status >= 200 && response.status < 300,
        redirects,
        fallbackToGet,
      }
    } catch (error) {
      clearTimeout(timer)
      if (method === 'HEAD') {
        method = 'GET'
        fallbackToGet = true
        continue
      }
      return {
        kind,
        externalId,
        url,
        finalUrl: currentUrl,
        status: null,
        healthy: false,
        redirects,
        fallbackToGet,
        error: error instanceof Error ? error.message : String(error),
      }
    }
  }

  return { kind, externalId, url, finalUrl: currentUrl, status: null, healthy: false, redirects, fallbackToGet, error: 'too many redirects' }
}

async function mapWithConcurrency(rows: Array<{ row: PilotCatalogRow; kind: UrlKind; url: string }>) {
  const results: UrlCheck[] = []
  let nextIndex = 0
  async function worker() {
    while (nextIndex < rows.length) {
      const row = rows[nextIndex]
      nextIndex += 1
      results.push(await fetchWithHealth(row.url, row.kind, row.row.externalId))
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, rows.length) }, () => worker()))
  return results.sort((a, b) => `${a.externalId}:${a.kind}`.localeCompare(`${b.externalId}:${b.kind}`))
}

async function main() {
  const packageDir = resolve(packageArgument())
  try {
    const pilot = await readPilotPackage(packageDir)
    const rows = pilot.catalog.flatMap((row) => [
      { row, kind: 'product' as const, url: row.productUrl },
      { row, kind: 'image' as const, url: row.imageUrl },
    ])
    const checks = await mapWithConcurrency(rows)
    const products = checks.filter((check) => check.kind === 'product')
    const images = checks.filter((check) => check.kind === 'image')
    const report = {
      command: 'pilot:check-urls',
      packageDir,
      timeoutMs,
      concurrency,
      productUrls: { healthy: products.filter((check) => check.healthy).length, total: products.length },
      imageUrls: { healthy: images.filter((check) => check.healthy).length, total: images.length },
      redirects: checks.filter((check) => check.redirects.length > 0),
      failures: checks.filter((check) => !check.healthy),
    }
    console.log(JSON.stringify(report, null, 2))
    if (report.failures.length > 0) process.exitCode = 1
  } catch (error) {
    console.error(JSON.stringify({ command: 'pilot:check-urls', packageDir, failures: [String(error)] }, null, 2))
    process.exitCode = 1
  }
}

main()
