/** @jest-environment node */
jest.mock('@vercel/blob', () => ({ put: jest.fn(), list: jest.fn() }))
jest.mock('@/lib/api-auth-runtime', () => ({ requireAuth: jest.fn() }))
jest.mock('@/modules/merchant/application/merchant-access', () => ({ requireMerchantMembership: jest.fn() }))
jest.mock('@/modules/merchant/application/merchant-agent-http', () => ({
  merchantAgentErrorResponse: jest.fn(() => new Response(JSON.stringify({ success: false }), { status: 403 })),
}))

import { NextRequest } from 'next/server'
import { list, put } from '@vercel/blob'
import { requireAuth } from '@/lib/api-auth-runtime'
import { requireMerchantMembership } from '@/modules/merchant/application/merchant-access'
import { POST } from '@/app/api/merchant/[merchantId]/catalog/media/route'
import {
  parseCatalogProductMediaUrl, requireOwnedCatalogProductMediaUrl,
} from '@/modules/merchant/domain/merchant-catalog-media'

const merchantId = 'merchant-a'
const blobRoot = 'https://abc123.public.blob.vercel-storage.com'
const key = '0123456789abcdef0123456789abcdef'
const blobPath = 'merchant-catalog/merchant-a/product/' + key + '.png'
const storedUrl = blobRoot + '/' + blobPath

function png(w = 640, h = 480): Uint8Array {
  const out = new Uint8Array(64)
  out.set([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a], 0)
  out.set([0x49,0x48,0x44,0x52], 12)
  new DataView(out.buffer).setUint32(16, w)
  new DataView(out.buffer).setUint32(20, h)
  return out
}
function request(file = new File([png().buffer as ArrayBuffer], 'frame.png', { type: 'image/png' }), site?: string) {
  const form = new FormData()
  form.set('file', file)
  const result = new NextRequest('http://localhost/api/merchant/' + merchantId + '/catalog/media', { method: 'POST', body: form })
  if (site) result.headers.set('sec-fetch-site', site)
  return result
}
beforeEach(() => {
  jest.clearAllMocks()
  ;(requireAuth as jest.Mock).mockResolvedValue({ ok: true, userId: 'owner-a' })
  ;(requireMerchantMembership as jest.Mock).mockResolvedValue({ role: 'OWNER' })
  ;(list as jest.Mock).mockResolvedValue({ blobs: [], hasMore: false, cursor: undefined })
  ;(put as jest.Mock).mockResolvedValue({ url: storedUrl })
})

describe('Merchant Catalog product photo staging', () => {
  it('uploads only to owned Blob prefix, without writing a Catalog record', async () => {
    const response = await POST(request(), { params: { merchantId } })
    expect(response.status).toBe(200)
    expect(await response.json()).toMatchObject({ success: true, data: { url: storedUrl, width: 640, height: 480 } })
    expect(requireMerchantMembership).toHaveBeenCalledWith(expect.objectContaining({ merchantId, roles: ['OWNER', 'ADMIN'] }))
    expect(put).toHaveBeenCalledWith(expect.stringMatching(/^merchant-catalog\/merchant-a\/product\/[a-f0-9]{32}\.png$/), expect.any(Buffer), {
      access: 'public', contentType: 'image/png', addRandomSuffix: false,
    })
  })

  it('checks auth before storage or reading multipart body', async () => {
    ;(requireAuth as jest.Mock).mockResolvedValueOnce({
      ok: false, response: new Response(JSON.stringify({ error: 'UNAUTHORIZED' }), { status: 401 }),
    })
    expect((await POST(request(), { params: { merchantId } })).status).toBe(401)
    expect(requireMerchantMembership).not.toHaveBeenCalled()
    expect(list).not.toHaveBeenCalled()
    expect(put).not.toHaveBeenCalled()
  })

  it('enforces tenant membership and cross-site request denial before storage', async () => {
    ;(requireMerchantMembership as jest.Mock).mockRejectedValueOnce(new Error('denied'))
    expect((await POST(request(), { params: { merchantId } })).status).toBe(403)
    expect((await POST(request(undefined, 'cross-site'), { params: { merchantId } })).status).toBe(403)
    expect(list).not.toHaveBeenCalled()
    expect(put).not.toHaveBeenCalled()
  })

  it('rejects spoofed image bytes and excessive decoded dimensions before uploading', async () => {
    for (const file of [
      new File([new TextEncoder().encode('<svg/>').buffer as ArrayBuffer], 'frame.png', { type: 'image/png' }),
      new File([png(10000, 200).buffer as ArrayBuffer], 'huge.png', { type: 'image/png' }),
    ]) {
      expect((await POST(request(file), { params: { merchantId } })).status).toBe(400)
    }
    expect(list).not.toHaveBeenCalled()
    expect(put).not.toHaveBeenCalled()
  })

  it('enforces actual multipart bytes despite dishonest Content-Length', async () => {
    const huge = new File([new ArrayBuffer(4 * 1024 * 1024 + 40 * 1024)], 'large.png', { type: 'image/png' })
    const incoming = request(huge)
    incoming.headers.set('content-length', '1')
    expect((await POST(incoming, { params: { merchantId } })).status).toBe(400)
    expect(put).not.toHaveBeenCalled()
  })

  it('blocks incomplete Blob listings and 100 recent uploads before creating another Blob', async () => {
    ;(list as jest.Mock).mockResolvedValueOnce({ blobs: [], hasMore: true, cursor: 'more' })
    expect((await POST(request(), { params: { merchantId } })).status).toBe(429)
    ;(list as jest.Mock).mockResolvedValueOnce({
      blobs: Array.from({ length: 100 }, () => ({ uploadedAt: new Date() })), hasMore: false,
    })
    expect((await POST(request(), { params: { merchantId } })).status).toBe(429)
    expect(put).not.toHaveBeenCalled()
  })

  it('does not treat foreign, query-bearing or non-product URLs as tenant-owned', () => {
    expect(requireOwnedCatalogProductMediaUrl(storedUrl, merchantId)).toBe(storedUrl)
    expect(parseCatalogProductMediaUrl(storedUrl)?.merchantId).toBe(merchantId)
    expect(() => requireOwnedCatalogProductMediaUrl(storedUrl, 'merchant-b')).toThrow()
    expect(parseCatalogProductMediaUrl('https://evil.test/' + blobPath)).toBeNull()
    expect(parseCatalogProductMediaUrl(storedUrl + '?src=x')).toBeNull()
    expect(parseCatalogProductMediaUrl(blobRoot + '/merchant-brand/merchant-a/logo/' + key + '.png')).toBeNull()
  })

})
