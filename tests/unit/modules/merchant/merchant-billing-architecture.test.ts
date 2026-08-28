/** @jest-environment node */

import fs from 'fs'
import path from 'path'
import { classifyB4ProductionPublicSlice } from '../../../../cloudflare-router/b4-production-public-slice'
import { isApprovedEdgeApi } from '../../../../cloudflare-router/approved-edge-api'

const root = path.resolve(__dirname, '../../../..')

function request(pathname: string, method = 'POST'): Request {
  return new Request(`https://www.visutry.com${pathname}`, { method })
}

describe('Merchant billing runtime ownership', () => {
  it('keeps one Vercel/Next billing implementation with no Cloudflare alias', () => {
    const nextConfig = fs.readFileSync(path.join(root, 'next.config.js'), 'utf8')
    const canonical = path.join(root, 'src/modules/merchant/application/merchant-billing.ts')
    const cloudflareAdapter = path.join(root, 'src/modules/merchant/application/merchant-billing-cloudflare.ts')

    expect(fs.existsSync(canonical)).toBe(true)
    expect(fs.existsSync(cloudflareAdapter)).toBe(false)
    expect(nextConfig).not.toContain('merchant-billing-cloudflare')
  })

  it.each([
    '/api/payment/webhook',
    '/api/merchant/merchant-1/billing/checkout',
    '/api/merchant/merchant-1/billing/change-plan',
    '/api/merchant/merchant-1/billing/portal',
  ])('keeps %s Vercel-required in production', (pathname) => {
    expect(classifyB4ProductionPublicSlice(request(pathname))).toMatchObject({
      backend: 'vercel',
      routeClass: 'vercel-required',
      invocation: 'vercel',
    })
  })

  it('does not expose billing or Stripe paths through the approved Cloudflare edge API set', () => {
    for (const pathname of [
      '/api/payment/webhook',
      '/api/payment/create-session',
      '/api/merchant/merchant-1/billing/checkout',
      '/api/merchant/merchant-1/billing/change-plan',
      '/api/merchant/merchant-1/billing/portal',
    ]) {
      expect(isApprovedEdgeApi(request(pathname))).toBe(false)
      expect(classifyB4ProductionPublicSlice(request(pathname))).toMatchObject({ backend: 'vercel' })
    }
  })

  it('routes application billing entry points to the canonical service', () => {
    const entryPoints = [
      'src/app/api/payment/webhook/route.ts',
      'src/app/api/merchant/[merchantId]/billing/checkout/route.ts',
      'src/app/api/merchant/[merchantId]/billing/change-plan/route.ts',
      'src/app/api/merchant/[merchantId]/billing/portal/route.ts',
    ]

    for (const relativePath of entryPoints) {
      const source = fs.readFileSync(path.join(root, relativePath), 'utf8')
      expect(source).toContain("merchant-billing'")
      expect(source).not.toContain('merchant-billing-cloudflare')
    }
  })
})
