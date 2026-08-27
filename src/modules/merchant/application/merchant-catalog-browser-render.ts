import {
  MerchantSourceNetworkError,
  resolveAndPinMerchantSourceUrl,
} from './merchant-source-network'
import type { CatalogSourceDocument } from './merchant-catalog-source-shared'

const CLOUDFLARE_BROWSER_RENDERING_API = 'https://api.cloudflare.com/client/v4/accounts'
const MAX_RENDERED_RESPONSE_BYTES = 512 * 1024
const RENDER_REQUEST_TIMEOUT_MS = 15_000
const PAGE_LOAD_TIMEOUT_MS = 10_000
const PAGE_SETTLE_TIMEOUT_MS = 1_500
const PAGE_ACTION_TIMEOUT_MS = 12_000

type BrowserRenderedFetch = (url: string) => Promise<CatalogSourceDocument | null>

type BrowserRenderingResponse = {
  success?: boolean
  result?: unknown
  errors?: unknown[]
  meta?: {
    finalUrl?: unknown
    status?: unknown
    redirectChain?: unknown
  }
}

function browserRenderError(code: string, message: string): MerchantSourceNetworkError {
  return new MerchantSourceNetworkError(code, message)
}

function configuredCredentials(): { accountId: string; apiToken: string } | null {
  if (process.env.MERCHANT_BROWSER_RENDERING_ENABLED !== 'true') return null
  const accountId = process.env.CLOUDFLARE_BROWSER_RENDERING_ACCOUNT_ID?.trim()
  const apiToken = process.env.CLOUDFLARE_BROWSER_RENDERING_API_TOKEN?.trim()
  if (!accountId || !apiToken) return null
  return { accountId, apiToken }
}

export function isMerchantBrowserRenderingConfigured(): boolean {
  return configuredCredentials() !== null
}

function urlValue(value: unknown): string | null {
  if (typeof value === 'string') return value
  if (!value || typeof value !== 'object') return null
  for (const key of ['url', 'location', 'targetUrl', 'to']) {
    const candidate = (value as Record<string, unknown>)[key]
    if (typeof candidate === 'string') return candidate
  }
  return null
}

async function validateRenderedUrl(rawUrl: string, expectedOrigin: string): Promise<string> {
  let parsed: URL
  try {
    parsed = new URL(rawUrl)
  } catch {
    throw browserRenderError('SOURCE_REDIRECT_REJECTED', 'The rendered source returned an invalid URL.')
  }
  if (parsed.origin !== expectedOrigin) {
    throw browserRenderError('SOURCE_REDIRECT_REJECTED', 'Cross-origin redirects are not allowed during inspection.')
  }
  parsed.hash = ''
  await resolveAndPinMerchantSourceUrl(parsed.toString())
  return parsed.toString()
}

function assertRenderedBodySize(body: string): void {
  if (new TextEncoder().encode(body).byteLength > MAX_RENDERED_RESPONSE_BYTES) {
    throw browserRenderError('SOURCE_TOO_LARGE', 'The rendered source response exceeds the size limit.')
  }
}

async function fetchWithCloudflareBrowserRendering(rawUrl: string, credentials: { accountId: string; apiToken: string }): Promise<CatalogSourceDocument> {
  const pinned = await resolveAndPinMerchantSourceUrl(rawUrl)
  const sourceUrl = new URL(pinned.url)
  sourceUrl.hash = ''
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), RENDER_REQUEST_TIMEOUT_MS)
  try {
    const response = await fetch(`${CLOUDFLARE_BROWSER_RENDERING_API}/${encodeURIComponent(credentials.accountId)}/browser-rendering/content`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${credentials.apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: sourceUrl.toString(),
        gotoOptions: {
          waitUntil: 'domcontentloaded',
          timeout: PAGE_LOAD_TIMEOUT_MS,
        },
        waitForTimeout: PAGE_SETTLE_TIMEOUT_MS,
        actionTimeout: PAGE_ACTION_TIMEOUT_MS,
      }),
      signal: controller.signal,
    })
    let payload: BrowserRenderingResponse
    try {
      payload = await response.json() as BrowserRenderingResponse
    } catch {
      throw browserRenderError('BROWSER_RENDER_FAILED', 'The browser-render provider returned an invalid response.')
    }
    if (!response.ok || payload.success === false || typeof payload.result !== 'string') {
      throw browserRenderError('BROWSER_RENDER_FAILED', 'The rendered page could not be inspected.')
    }

    const finalUrl = typeof payload.meta?.finalUrl === 'string' ? payload.meta.finalUrl : sourceUrl.toString()
    const safeFinalUrl = await validateRenderedUrl(finalUrl, sourceUrl.origin)
    const redirectChain = Array.isArray(payload.meta?.redirectChain) ? payload.meta.redirectChain : []
    for (const redirect of redirectChain) {
      const redirectUrl = urlValue(redirect)
      if (redirectUrl) await validateRenderedUrl(redirectUrl, sourceUrl.origin)
    }
    const status = typeof payload.meta?.status === 'number' ? payload.meta.status : 200
    if (status < 200 || status >= 300) throw browserRenderError('SOURCE_UNREACHABLE', `The source returned HTTP ${status}.`)
    assertRenderedBodySize(payload.result)
    return { url: safeFinalUrl, body: payload.result, contentType: 'text/html; charset=utf-8' }
  } catch (error) {
    if (error instanceof MerchantSourceNetworkError) throw error
    if (error instanceof Error && error.name === 'AbortError') throw browserRenderError('SOURCE_TIMEOUT', 'The rendered source request timed out.')
    throw browserRenderError('BROWSER_RENDER_FAILED', 'The rendered page could not be inspected.')
  } finally {
    clearTimeout(timer)
  }
}

export function createMerchantBrowserRenderedFetch(): BrowserRenderedFetch | undefined {
  const credentials = configuredCredentials()
  if (!credentials) return undefined
  return (url) => fetchWithCloudflareBrowserRendering(url, credentials)
}

