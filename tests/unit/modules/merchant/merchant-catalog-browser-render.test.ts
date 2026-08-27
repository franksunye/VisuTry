/** @jest-environment node */

jest.mock('@/modules/merchant/application/merchant-source-network', () => ({
  MerchantSourceNetworkError: class MerchantSourceNetworkError extends Error {
    readonly code: string

    constructor(code: string, message: string) {
      super(message)
      this.name = 'MerchantSourceNetworkError'
      this.code = code
    }
  },
  resolveAndPinMerchantSourceUrl: jest.fn(async (url: string) => ({
    url,
    protocol: 'https:',
    hostname: new URL(url).hostname,
    address: '93.184.216.34',
    family: 4 as const,
    port: 443,
    path: new URL(url).pathname,
  })),
}))

import {
  createMerchantBrowserRenderedFetch,
  isMerchantBrowserRenderingConfigured,
} from '@/modules/merchant/application/merchant-catalog-browser-render'

describe('Cloudflare Browser Rendering merchant catalog adapter', () => {
  const originalEnv = { ...process.env }
  const originalFetch = global.fetch

  beforeEach(() => {
    process.env = { ...originalEnv }
    delete process.env.MERCHANT_BROWSER_RENDERING_ENABLED
    delete process.env.CLOUDFLARE_BROWSER_RENDERING_ACCOUNT_ID
    delete process.env.CLOUDFLARE_BROWSER_RENDERING_API_TOKEN
    jest.clearAllMocks()
  })

  afterAll(() => {
    process.env = originalEnv
    global.fetch = originalFetch
  })

  function configure() {
    process.env.MERCHANT_BROWSER_RENDERING_ENABLED = 'true'
    process.env.CLOUDFLARE_BROWSER_RENDERING_ACCOUNT_ID = 'account-123'
    process.env.CLOUDFLARE_BROWSER_RENDERING_API_TOKEN = 'secret-token'
  }

  it('stays inactive until explicitly enabled with both credentials', () => {
    expect(isMerchantBrowserRenderingConfigured()).toBe(false)
    expect(createMerchantBrowserRenderedFetch()).toBeUndefined()
    configure()
    delete process.env.CLOUDFLARE_BROWSER_RENDERING_API_TOKEN
    expect(isMerchantBrowserRenderingConfigured()).toBe(false)
  })

  it('returns rendered HTML and sends bounded navigation options without cookies', async () => {
    configure()
    const fetchMock = jest.fn().mockResolvedValue(new Response(JSON.stringify({
      success: true,
      result: '<html><script type="application/ld+json">{"@type":"Product","name":"Rendered Frame"}</script></html>',
      meta: { finalUrl: 'https://catalog.example.test/', status: 200, redirectChain: [] },
    }), { status: 200, headers: { 'content-type': 'application/json' } }))
    global.fetch = fetchMock as typeof fetch

    const renderedFetch = createMerchantBrowserRenderedFetch()
    await expect(renderedFetch?.('https://catalog.example.test')).resolves.toMatchObject({
      url: 'https://catalog.example.test/',
      contentType: 'text/html; charset=utf-8',
    })
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.cloudflare.com/client/v4/accounts/account-123/browser-rendering/content',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ Authorization: 'Bearer secret-token' }),
        body: expect.stringContaining('domcontentloaded'),
      }),
    )
    const options = fetchMock.mock.calls[0][1] as RequestInit
    expect(options.headers).not.toHaveProperty('Cookie')
  })

  it('rejects cross-origin rendered redirects', async () => {
    configure()
    global.fetch = jest.fn().mockResolvedValue(new Response(JSON.stringify({
      success: true,
      result: '<html></html>',
      meta: { finalUrl: 'https://attacker.example.test/', status: 200 },
    }), { status: 200 })) as typeof fetch

    await expect(createMerchantBrowserRenderedFetch()?.('https://catalog.example.test'))
      .rejects.toMatchObject({ code: 'SOURCE_REDIRECT_REJECTED' })
  })

  it('rejects provider errors without exposing provider details', async () => {
    configure()
    global.fetch = jest.fn().mockResolvedValue(new Response(JSON.stringify({
      success: false,
      errors: [{ message: 'internal provider secret' }],
    }), { status: 403 })) as typeof fetch

    await expect(createMerchantBrowserRenderedFetch()?.('https://catalog.example.test'))
      .rejects.toMatchObject({ code: 'BROWSER_RENDER_FAILED', message: 'The rendered page could not be inspected.' })
  })
})

