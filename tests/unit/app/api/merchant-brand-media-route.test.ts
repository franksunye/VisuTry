/** @jest-environment node */

jest.mock('@vercel/blob', () => ({ put: jest.fn(), del: jest.fn() }))
jest.mock('@/lib/api-auth-runtime', () => ({ requireAuth: jest.fn() }))
jest.mock('@/modules/merchant/application/merchant-access', () => ({
  requireMerchantMembership: jest.fn(),
  MerchantAccessError: class MerchantAccessError extends Error {
    readonly code = 'MERCHANT_ACCESS_NOT_FOUND'
    readonly httpStatus = 404
  },
}))
jest.mock('@/lib/prisma', () => ({
  prisma: {
    merchant: { findUnique: jest.fn() },
    experience: { count: jest.fn(), findFirst: jest.fn() },
    $transaction: jest.fn(),
  },
}))
jest.mock('@/modules/store/application/experience-command-service-prisma', () => ({
  experienceCommands: { updateSharedConfiguration: jest.fn() },
}))
jest.mock('@/modules/store/application/public-discovery-invalidation', () => ({
  withPublicDiscoveryInvalidation: jest.fn(({ mutation }: { mutation: () => unknown }) => mutation()),
}))
jest.mock('@/modules/store/application/public-edge-paths-server', () => ({
  getPublicEdgeTagsForMerchant: jest.fn().mockResolvedValue([]),
}))
jest.mock('@/lib/logger', () => ({ logger: { error: jest.fn() } }))

import { NextRequest } from 'next/server'
import { put, del } from '@vercel/blob'
import { requireAuth } from '@/lib/api-auth-runtime'
import { requireMerchantMembership } from '@/modules/merchant/application/merchant-access'
import { prisma } from '@/lib/prisma'
import { experienceCommands } from '@/modules/store/application/experience-command-service-prisma'
import { withPublicDiscoveryInvalidation } from '@/modules/store/application/public-discovery-invalidation'
import { POST } from '@/app/api/merchant/[merchantId]/brand/media/route'

const merchantId = 'merchant-a'
const experienceId = 'experience-store-a'
let merchantRow: Record<string, unknown>
let experienceRow: Record<string, unknown> | null
let liveExperienceCount: number
let failMerchantCommit: boolean
let failExperienceCommand: boolean

function png(width: number, height: number) {
  const bytes = new Uint8Array(64)
  bytes.set([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a], 0)
  bytes.set([0x49,0x48,0x44,0x52], 12)
  const view = new DataView(bytes.buffer)
  view.setUint32(16, width)
  view.setUint32(20, height)
  return Buffer.from(bytes)
}

function uploadRequest(options: { kind: 'logo' | 'hero'; approved?: boolean; experienceId?: string; file?: File }) {
  const form = new FormData()
  form.set('kind', options.kind)
  if (options.experienceId) form.set('experienceId', options.experienceId)
  if (options.approved) form.set('approvedLiveChange', 'true')
  form.set('file', options.file ?? new File([
    png(options.kind === 'hero' ? 1280 : 640, options.kind === 'hero' ? 640 : 640),
  ], `${options.kind}.png`, { type: 'image/png' }))
  return new NextRequest(`http://localhost/api/merchant/${merchantId}/brand/media`, { method: 'POST', body: form })
}

describe('POST /api/merchant/[merchantId]/brand/media with mocked Blob and transactional persistence', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    merchantRow = { id: merchantId, name: 'Merchant A', slug: 'merchant-a', logoUrl: null, accentColor: null }
    experienceRow = { id: experienceId, type: 'STORE', status: 'DRAFT', heroAssetUrl: null }
    liveExperienceCount = 0
    failMerchantCommit = false
    failExperienceCommand = false

    ;(requireAuth as jest.Mock).mockResolvedValue({ ok: true, userId: 'owner-a' })
    ;(requireMerchantMembership as jest.Mock).mockResolvedValue({ role: 'OWNER' })
    ;(prisma.merchant.findUnique as jest.Mock).mockImplementation(async () => ({ ...merchantRow }))
    ;(prisma.experience.count as jest.Mock).mockImplementation(async () => liveExperienceCount)
    ;(prisma.experience.findFirst as jest.Mock).mockImplementation(async ({ where }) =>
      experienceRow && experienceRow.id === where.id && where.merchantId === merchantId ? { ...experienceRow } : null)
    ;(prisma.$transaction as jest.Mock).mockImplementation(async (callback: (tx: unknown) => Promise<unknown>) => {
      const staged = { ...merchantRow }
      const tx = {
        $queryRaw: jest.fn().mockResolvedValue([{ id: merchantId }]),
        experience: { count: jest.fn().mockResolvedValue(liveExperienceCount) },
        merchant: {
          update: jest.fn(async ({ data }: { data: Record<string, unknown> }) => {
            Object.assign(staged, data)
            if (failMerchantCommit) throw new Error('simulated database commit failure')
            return { ...staged }
          }),
        },
      }
      const result = await callback(tx)
      merchantRow = staged
      return result
    })
    ;(experienceCommands.updateSharedConfiguration as jest.Mock).mockImplementation(async ({ patch, afterUpdate }) => {
      const staged = { ...experienceRow!, ...patch }
      if (failExperienceCommand) throw new Error('simulated Experience persistence failure')
      if (afterUpdate) await afterUpdate({ experience: { findFirst: async () => ({ ...staged }) } })
      experienceRow = staged
      return staged
    })
    ;(put as jest.Mock).mockImplementation(async (pathname: string) => ({
      url: `https://cdn.public.blob.vercel-storage.com/${pathname}`,
    }))
    ;(del as jest.Mock).mockResolvedValue(undefined)
    ;(withPublicDiscoveryInvalidation as jest.Mock).mockImplementation(({ mutation }: { mutation: () => unknown }) => mutation())
  })

  it('mocks Logo upload, applies the saved URL through the Owner transaction, and returns it for readback', async () => {
    const response = await POST(uploadRequest({ kind: 'logo' }), { params: { merchantId } })
    const body = await response.json()
    const savedUrl = body.data.url as string

    expect(response.status).toBe(200)
    expect(savedUrl).toMatch(/^https:\/\/cdn\.public\.blob\.vercel-storage\.com\/merchant-brand\/merchant-a\/logo\//)
    expect(body.data).toMatchObject({ width: 640, height: 640 })
    expect(put).toHaveBeenCalledWith(expect.stringMatching(/^merchant-brand\/merchant-a\/logo\//), expect.any(Buffer), {
      access: 'public', contentType: 'image/png', addRandomSuffix: false,
    })
    expect(merchantRow.logoUrl).toBe(savedUrl)
    expect(del).not.toHaveBeenCalled()
  })

  it('requires live approval before a Logo upload starts', async () => {
    liveExperienceCount = 1
    const response = await POST(uploadRequest({ kind: 'logo' }), { params: { merchantId } })
    expect(response.status).toBe(409)
    expect(await response.json()).toMatchObject({ error: 'LIVE_CHANGE_CONFIRMATION_REQUIRED' })
    expect(put).not.toHaveBeenCalled()
    expect(merchantRow.logoUrl).toBeNull()
  })

  it('deletes a newly uploaded Logo if its database transaction fails without persisting the URL', async () => {
    failMerchantCommit = true
    const response = await POST(uploadRequest({ kind: 'logo' }), { params: { merchantId } })

    expect(response.status).toBe(500)
    expect(put).toHaveBeenCalledTimes(1)
    expect(del).toHaveBeenCalledWith(expect.stringMatching(/^https:\/\/cdn\.public\.blob\.vercel-storage\.com\/merchant-brand\/merchant-a\/logo\//))
    expect(merchantRow.logoUrl).toBeNull()
  })

  it.each(['STORE', 'CAMPAIGN'] as const)('saves a tenant-scoped %s Hero through the canonical Experience command', async type => {
    experienceRow = { id: experienceId, type, status: 'ACTIVE', heroAssetUrl: null }
    const response = await POST(uploadRequest({ kind: 'hero', experienceId, approved: true }), { params: { merchantId } })
    const body = await response.json()
    const savedUrl = body.data.url as string

    expect(response.status).toBe(200)
    expect(savedUrl).toMatch(new RegExp(`/merchant-brand/${merchantId}/hero/${experienceId}/`))
    expect(experienceRow?.heroAssetUrl).toBe(savedUrl)
    expect(experienceCommands.updateSharedConfiguration).toHaveBeenCalledWith(expect.objectContaining({
      merchantId, experienceId, expectedType: type, patch: { heroAssetUrl: savedUrl }, draftOnly: false,
    }))
    expect(del).not.toHaveBeenCalled()
  })

  it('requires explicit approval before uploading a live Hero', async () => {
    experienceRow = { id: experienceId, type: 'STORE', status: 'ACTIVE', heroAssetUrl: null }
    const response = await POST(uploadRequest({ kind: 'hero', experienceId }), { params: { merchantId } })

    expect(response.status).toBe(409)
    expect(await response.json()).toMatchObject({ error: 'LIVE_CHANGE_CONFIRMATION_REQUIRED' })
    expect(put).not.toHaveBeenCalled()
    expect(experienceRow?.heroAssetUrl).toBeNull()
  })

  it('compensates a failed Hero attachment without persisting the URL', async () => {
    failExperienceCommand = true
    const response = await POST(uploadRequest({ kind: 'hero', experienceId }), { params: { merchantId } })

    expect(response.status).toBe(500)
    expect(put).toHaveBeenCalledTimes(1)
    expect(del).toHaveBeenCalledTimes(1)
    expect(del).toHaveBeenCalledWith(expect.stringMatching(/^https:\/\/cdn\.public\.blob\.vercel-storage\.com\/merchant-brand\/merchant-a\/hero\/experience-store-a\//))
    expect(experienceRow?.heroAssetUrl).toBeNull()
  })

  it('preserves an attached Logo when cache invalidation fails after committed database write', async () => {
    ;(withPublicDiscoveryInvalidation as jest.Mock).mockImplementationOnce(async ({ mutation }) => {
      await mutation()
      throw new Error('simulated cache invalidation failure after commit')
    })
    const response = await POST(uploadRequest({ kind: 'logo' }), { params: { merchantId } })
    expect(response.status).toBe(503)
    expect(await response.json()).toMatchObject({ error: 'BRAND_CACHE_REFRESH_UNCONFIRMED', persisted: true })
    expect(merchantRow.logoUrl).toEqual(expect.stringMatching(/\/merchant-brand\/merchant-a\/logo\//))
    expect(del).not.toHaveBeenCalled()
  })

  it.each(['STORE', 'CAMPAIGN'] as const)('preserves an attached %s Hero when post-commit public invalidation fails', async type => {
    experienceRow = { id: experienceId, type, status: 'DRAFT', heroAssetUrl: null }
    ;(experienceCommands.updateSharedConfiguration as jest.Mock).mockImplementationOnce(async ({ patch, afterUpdate }) => {
      const staged = { ...experienceRow!, ...patch }
      if (afterUpdate) await afterUpdate({ experience: { findFirst: async () => ({ ...staged }) } })
      experienceRow = staged
      throw new Error('cache purge unavailable after Experience commit')
    })
    const response = await POST(uploadRequest({ kind: 'hero', experienceId }), { params: { merchantId } })
    expect(response.status).toBe(503)
    expect(await response.json()).toMatchObject({ error: 'BRAND_CACHE_REFRESH_UNCONFIRMED', persisted: true })
    expect(experienceRow?.heroAssetUrl).toEqual(expect.stringMatching(/\/merchant-brand\/merchant-a\/hero\//))
    expect(del).not.toHaveBeenCalled()
  })

  it('never deletes uploaded bytes when database readback fails after a commit error', async () => {
    ;(withPublicDiscoveryInvalidation as jest.Mock).mockImplementationOnce(async ({ mutation }) => {
      await mutation()
      throw new Error('post-commit purge failed')
    })
    // Upload preflight + updateMerchantBrand each read the profile before put.
    // Only the third read is the post-commit compensation check.
    ;(prisma.merchant.findUnique as jest.Mock)
      .mockImplementationOnce(async () => ({ ...merchantRow }))
      .mockImplementationOnce(async () => ({ ...merchantRow }))
      .mockImplementationOnce(async () => { throw new Error('readback unavailable') })
    const response = await POST(uploadRequest({ kind: 'logo' }), { params: { merchantId } })
    expect(put).toHaveBeenCalledTimes(1)
    expect(response.status).toBe(503)
    expect(await response.json()).toMatchObject({ error: 'BRAND_PERSISTENCE_UNCONFIRMED', persisted: false })
    expect(del).not.toHaveBeenCalled()
  })

  it('rejects a cross-tenant Experience before creating a Blob object', async () => {
    experienceRow = { id: 'experience-owned-by-other-merchant', type: 'STORE', status: 'DRAFT', heroAssetUrl: null }
    const response = await POST(uploadRequest({ kind: 'hero', experienceId }), { params: { merchantId } })

    expect(response.status).toBe(404)
    expect(await response.json()).toMatchObject({ error: 'EXPERIENCE_NOT_FOUND' })
    expect(put).not.toHaveBeenCalled()
    expect(del).not.toHaveBeenCalled()
  })

  it('rejects oversized streamed multipart bytes even with a dishonest Content-Length header', async () => {
    const huge = new File([new Uint8Array(4 * 1024 * 1024 + 48 * 1024)], 'large.png', { type: 'image/png' })
    const request = uploadRequest({ kind: 'logo', file: huge })
    // Client-controlled length cannot override the actual consumed byte cap.
    request.headers.set('content-length', '1')
    const response = await POST(request, { params: { merchantId } })
    expect(response.status).toBe(400)
    expect(await response.json()).toMatchObject({ error: 'INVALID_BRAND_UPLOAD' })
    expect(put).not.toHaveBeenCalled()
    expect(prisma.$transaction).not.toHaveBeenCalled()
  })

  it('rejects a malformed multipart body before any Blob or DB write', async () => {
    const request = new NextRequest('http://localhost/api/merchant/merchant-a/brand/media', {
      method: 'POST',
      headers: { 'content-type': 'multipart/form-data; boundary=garbage' },
      body: Buffer.from('not a multipart envelope'),
    })
    const response = await POST(request, { params: { merchantId } })
    expect(response.status).toBe(400)
    expect(await response.json()).toMatchObject({ error: 'INVALID_BRAND_UPLOAD' })
    expect(put).not.toHaveBeenCalled()
  })

  it('rejects an invalid image before writing Blob or database state', async () => {
    const badFile = new File([Buffer.from('<svg/>')], 'brand.svg', { type: 'image/svg+xml' })
    const response = await POST(uploadRequest({ kind: 'logo', file: badFile }), { params: { merchantId } })

    expect(response.status).toBe(400)
    expect(await response.json()).toMatchObject({ error: 'INVALID_BRAND_UPLOAD' })
    expect(put).not.toHaveBeenCalled()
    expect(del).not.toHaveBeenCalled()
    expect(merchantRow.logoUrl).toBeNull()
  })
})
