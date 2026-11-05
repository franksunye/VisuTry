/** @jest-environment node */
jest.mock('@/modules/merchant/application/merchant-onboarding', () => ({ MerchantOnboardingError: class extends Error {} }))
jest.mock('@/lib/api-auth-runtime', () => ({ requireAuth: jest.fn() }))
jest.mock('@/modules/merchant/application/merchant-access', () => ({ requireMerchantMembership: jest.fn(), MerchantAccessError: class extends Error { code = 'MERCHANT_ACCESS_NOT_FOUND'; httpStatus = 404 } }))
jest.mock('@/modules/merchant/application/merchant-catalog-source-intake-runtime', () => ({ inspectHumanMerchantCatalogSource: jest.fn() }))
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api-auth-runtime'
import { requireMerchantMembership } from '@/modules/merchant/application/merchant-access'
import { inspectHumanMerchantCatalogSource } from '@/modules/merchant/application/merchant-catalog-source-intake-runtime'
import { POST } from '@/app/api/merchant/[merchantId]/catalog/inspect/route'
const inspect = inspectHumanMerchantCatalogSource as jest.Mock
const flag = process.env.NEXT_PUBLIC_MERCHANT_PUBLIC_URL_IMPORT_ENABLED
const params = { params: { merchantId: 'merchant-a' } }
function request(body: unknown) {
  return new NextRequest('http://localhost/api/merchant/merchant-a/catalog/inspect', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })
}
beforeEach(() => {
  jest.clearAllMocks()
  delete process.env.NEXT_PUBLIC_MERCHANT_PUBLIC_URL_IMPORT_ENABLED
  ;(requireAuth as jest.Mock).mockResolvedValue({ ok: true, userId: 'user-a' })
  ;(requireMerchantMembership as jest.Mock).mockResolvedValue({ membershipId: 'membership-a' })
  inspect.mockResolvedValue({ candidates: [], requiresApproval: true })
})
afterEach(() => { if (flag === undefined) delete process.env.NEXT_PUBLIC_MERCHANT_PUBLIC_URL_IMPORT_ENABLED; else process.env.NEXT_PUBLIC_MERCHANT_PUBLIC_URL_IMPORT_ENABLED = flag })
it.each([undefined, 'false', '1'])('blocks URL requests before any inspection with flag %s', async value => {
  if (value !== undefined) process.env.NEXT_PUBLIC_MERCHANT_PUBLIC_URL_IMPORT_ENABLED = value
  const result = await POST(request({ sourceType: 'url', sourceUrls: ['https://example.com/product'] }), params)
  expect(result.status).toBe(403)
  expect(await result.json()).toMatchObject({ error: 'PUBLIC_URL_IMPORT_DISABLED' })
  expect(inspect).not.toHaveBeenCalled()
})
it('allows explicit opt-in without bypassing membership checks', async () => {
  process.env.NEXT_PUBLIC_MERCHANT_PUBLIC_URL_IMPORT_ENABLED = 'true'
  expect((await POST(request({ sourceType: 'url', url: 'https://example.com/product' }), params)).status).toBe(200)
  expect(requireMerchantMembership).toHaveBeenCalledWith(expect.objectContaining({ merchantId: 'merchant-a', roles: ['OWNER', 'ADMIN'] }))
  expect(inspect).toHaveBeenCalledTimes(1)
})
it('keeps manual inspection and original product URLs available', async () => {
  const result = await POST(request({ sourceType: 'manual', manualProducts: [{ sku: 'A', name: 'Frame', imageUrl: 'https://example.com/a.jpg', productUrl: 'https://example.com/product' }] }), params)
  expect(result.status).toBe(200)
  expect(inspect).toHaveBeenCalledWith(expect.objectContaining({ manualProducts: [expect.objectContaining({ productUrl: 'https://example.com/product' })] }))
})
it('preserves authentication before reporting feature availability', async () => {
  ;(requireAuth as jest.Mock).mockResolvedValue({ ok: false, response: NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 }) })
  expect((await POST(request({ sourceType: 'url', url: 'https://example.com' }), params)).status).toBe(401)
  expect(inspect).not.toHaveBeenCalled()
})

it('rejects cross-tenant inspection before calling the source service', async () => {
  const { MerchantAccessError } = await import('@/modules/merchant/application/merchant-access')
  ;(requireMerchantMembership as jest.Mock).mockRejectedValue(new MerchantAccessError())
  expect((await POST(request({ sourceType: 'url', url: 'https://example.com' }), params)).status).toBe(404)
  expect(inspect).not.toHaveBeenCalled()
})
