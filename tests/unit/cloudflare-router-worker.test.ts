import { classify } from '../../cloudflare-router/worker'

function request(path: string, method = 'GET') {
  return { url: `https://staging.example${path}`, method } as Request
}

describe('Cloudflare staging capability router', () => {
  it('keeps the complete Auth0 browser transaction on Cloudflare', () => {
    expect(classify(request('/api/auth/csrf'))).toMatchObject({ backend: 'cloudflare', routeClass: 'cf-ready' })
    expect(classify(request('/api/auth/signin/auth0'))).toMatchObject({ backend: 'cloudflare', routeClass: 'cf-ready' })
    expect(classify(request('/api/auth/signin/auth0', 'POST'))).toMatchObject({ backend: 'cloudflare', routeClass: 'cf-ready' })
    expect(classify(request('/api/auth/callback/auth0'))).toMatchObject({ backend: 'cloudflare', routeClass: 'cf-ready' })
    expect(classify(request('/api/auth/callback/auth0', 'POST'))).toMatchObject({ backend: 'cloudflare', routeClass: 'cf-ready' })
    expect(classify(request('/api/auth/signout', 'POST'))).toMatchObject({ backend: 'cloudflare', routeClass: 'cf-ready' })
  })

  it('keeps unsupported capabilities on Vercel and defaults unknown routes there', () => {
    expect(classify(request('/api/payment/create-session', 'POST'))).toMatchObject({ backend: 'vercel', routeClass: 'vercel-required' })
    expect(classify(request('/api/unknown-capability'))).toMatchObject({ backend: 'vercel', routeClass: 'unknown-fallback' })
    expect(classify(request('/api/merchant/workspaces', 'PUT'))).toMatchObject({ backend: 'vercel', routeClass: 'unknown-fallback' })
  })
})
