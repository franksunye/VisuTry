/** @jest-environment node */

import { assertTrustedMcpOrigin, dcrClientIdentityFromHeaders, McpOriginError } from '@/modules/merchant/application/merchant-mcp-security'

describe('MCP transport security policy', () => {
  const originalAllowedOrigins = process.env.MCP_ALLOWED_ORIGINS
  const originalProxyMode = process.env.DCR_RATE_LIMIT_TRUSTED_PROXY_MODE
  const originalVercel = process.env.VERCEL
  const originalVercelUrl = process.env.VERCEL_URL

  afterEach(() => {
    if (originalAllowedOrigins === undefined) delete process.env.MCP_ALLOWED_ORIGINS
    else process.env.MCP_ALLOWED_ORIGINS = originalAllowedOrigins
    if (originalProxyMode === undefined) delete process.env.DCR_RATE_LIMIT_TRUSTED_PROXY_MODE
    else process.env.DCR_RATE_LIMIT_TRUSTED_PROXY_MODE = originalProxyMode
    if (originalVercel === undefined) delete process.env.VERCEL
    else process.env.VERCEL = originalVercel
    if (originalVercelUrl === undefined) delete process.env.VERCEL_URL
    else process.env.VERCEL_URL = originalVercelUrl
  })

  it.each([null, 'http://localhost:3000', 'https://www.visutry.com'])('allows absent or exact trusted Origin %s', (origin) => {
    process.env.MCP_ALLOWED_ORIGINS = 'http://localhost:3000,https://www.visutry.com'
    expect(() => assertTrustedMcpOrigin(origin)).not.toThrow()
  })

  it.each([
    'https://evil.example',
    'https://www.visutry.com.evil.example',
    'https://www.visutry.com.evil',
    'https://www.visutry.com/path',
    'not an origin',
    'null',
  ])('rejects untrusted, suffix, similar, path, or malformed Origin %s', (origin) => {
    process.env.MCP_ALLOWED_ORIGINS = 'https://www.visutry.com'
    expect(() => assertTrustedMcpOrigin(origin)).toThrow(McpOriginError)
  })

  it('uses fixed identity when proxy trust is disabled and ignores spoofable headers', () => {
    process.env.DCR_RATE_LIMIT_TRUSTED_PROXY_MODE = 'none'
    const headers = new Headers({ 'x-forwarded-for': '203.0.113.10', 'x-real-ip': '198.51.100.3', 'cf-connecting-ip': '192.0.2.4' })
    expect(dcrClientIdentityFromHeaders(headers)).toEqual({ identity: 'untrusted', source: 'none' })
  })

  it('accepts only one valid Vercel client address and ignores other forwarding headers', () => {
    process.env.DCR_RATE_LIMIT_TRUSTED_PROXY_MODE = 'vercel'
    expect(dcrClientIdentityFromHeaders(new Headers({ 'x-vercel-forwarded-for': '203.0.113.10', 'x-forwarded-for': '1.2.3.4', 'x-real-ip': '198.51.100.3' }))).toEqual({ identity: '203.0.113.10', source: 'vercel' })
    expect(dcrClientIdentityFromHeaders(new Headers({ 'x-vercel-forwarded-for': '203.0.113.10, 198.51.100.3' }))).toEqual({ identity: 'unknown', source: 'vercel' })
  })

  it.each([
    new Headers({ 'x-forwarded-for': '1.2.3.4' }),
    new Headers({ 'x-vercel-forwarded-for': 'not-an-ip', 'x-forwarded-for': '1.2.3.4' }),
  ])('uses the shared unknown bucket when Vercel canonical identity is absent or invalid', (headers) => {
    process.env.DCR_RATE_LIMIT_TRUSTED_PROXY_MODE = 'vercel'
    expect(dcrClientIdentityFromHeaders(headers)).toEqual({ identity: 'unknown', source: 'vercel' })
  })

  it('accepts only Cloudflare CF-Connecting-IP in explicit Cloudflare mode', () => {
    process.env.DCR_RATE_LIMIT_TRUSTED_PROXY_MODE = 'cloudflare'
    expect(dcrClientIdentityFromHeaders(new Headers({ 'cf-connecting-ip': '2001:db8::10', 'x-forwarded-for': '203.0.113.10' }))).toEqual({ identity: '2001:db8::10', source: 'cloudflare' })
    expect(dcrClientIdentityFromHeaders(new Headers({ 'cf-connecting-ip': 'not-an-ip' }))).toEqual({ identity: 'unknown', source: 'cloudflare' })
  })
})
