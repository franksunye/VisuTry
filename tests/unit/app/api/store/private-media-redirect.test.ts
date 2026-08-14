/** @jest-environment node */

import { NextRequest, NextResponse } from 'next/server'
import { GET as getResult } from '@/app/api/store/sessions/try-on/[taskId]/result/route'
import { GET as getAsset } from '@/app/api/store/sessions/assets/[assetId]/route'
import {
  createStoreRuntime,
  resolveStoreSessionAsset,
  resolveStoreSessionAssetAccess,
  resolveStoreTryOnResult,
  resolveStoreTryOnResultAccess,
  storeErrorResponse,
} from '@/modules/store/application'
import { readStoreCapabilityToken } from '@/modules/store/infrastructure'
import { createPrivateBlobGetUrl } from '@/lib/blob/private-signed-url'

jest.mock('@/lib/mocks', () => ({ isMockMode: false }))
jest.mock('@/modules/store/application', () => ({
  createStoreRuntime: jest.fn(),
  resolveStoreSessionAsset: jest.fn(),
  resolveStoreSessionAssetAccess: jest.fn(),
  resolveStoreTryOnResult: jest.fn(),
  resolveStoreTryOnResultAccess: jest.fn(),
  storeErrorResponse: jest.fn((error: unknown) => NextResponse.json({ error: String(error) }, { status: 403 })),
}))
jest.mock('@/modules/store/infrastructure', () => ({
  readStoreCapabilityToken: jest.fn(),
}))
jest.mock('@/lib/blob/private-signed-url', () => ({
  createPrivateBlobGetUrl: jest.fn(),
  pathnameFromPrivateBlobUrl: jest.fn(),
  privateBlobRedirect: (url: string) => new Response(null, {
    status: 307,
    headers: { Location: url, 'Cache-Control': 'private, no-store' },
  }),
}))

const runtime = { merchants: {}, sessions: {}, experiences: {}, assets: {} }

describe('private Store media redirects', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(createStoreRuntime as jest.Mock).mockReturnValue(runtime)
    ;(readStoreCapabilityToken as jest.Mock).mockReturnValue('cap-a')
    ;(createPrivateBlobGetUrl as jest.Mock).mockResolvedValue({
      url: 'https://store.private.blob.vercel-storage.com/signed?signature=1',
      validUntil: Date.now() + 120_000,
    })
  })

  it('redirects a valid Store result without returning an image body', async () => {
    ;(resolveStoreTryOnResultAccess as jest.Mock).mockResolvedValue({
      taskId: 'task-a',
      resultImageUrl: 'https://store.private.blob.vercel-storage.com/tryon/result/a.png',
      resultPathname: 'tryon/result/store/merchant-a/task-a.png',
      accessMode: 'PRIVATE_SIGNED',
      expiresAt: new Date(Date.now() + 60_000),
    })

    const response = await getResult(
      new NextRequest('http://localhost/api/store/sessions/try-on/task-a/result?merchantSlug=merchant-a&merchantSessionId=session-a'),
      { params: { taskId: 'task-a' } },
    )

    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toContain('store.private.blob.vercel-storage.com')
    expect(new Uint8Array(await response.arrayBuffer())).toHaveLength(0)
    expect(createPrivateBlobGetUrl).toHaveBeenCalledWith(expect.objectContaining({
      pathname: 'tryon/result/store/merchant-a/task-a.png',
    }))
    expect(resolveStoreTryOnResult).not.toHaveBeenCalled()
  })

  it('redirects a valid Store asset without returning an image body', async () => {
    ;(resolveStoreSessionAssetAccess as jest.Mock).mockResolvedValue({
      assetId: 'asset-a',
      merchantId: 'merchant-a',
      storageKey: 'store/merchant-a/sessions/session-a/photo.jpg',
      accessMode: 'PRIVATE_SIGNED',
      expiresAt: new Date(Date.now() + 60_000),
    })

    const response = await getAsset(
      new NextRequest('http://localhost/api/store/sessions/assets/asset-a?merchantSlug=merchant-a&merchantSessionId=session-a'),
      { params: { assetId: 'asset-a' } },
    )

    expect(response.status).toBe(307)
    expect(new Uint8Array(await response.arrayBuffer())).toHaveLength(0)
    expect(createPrivateBlobGetUrl).toHaveBeenCalledWith(expect.objectContaining({
      pathname: 'store/merchant-a/sessions/session-a/photo.jpg',
    }))
    expect(resolveStoreSessionAsset).not.toHaveBeenCalled()
  })

  it('does not issue a result grant when capability/merchant/session authorization fails', async () => {
    ;(resolveStoreTryOnResultAccess as jest.Mock).mockRejectedValue(new Error('SESSION_UNAUTHORIZED'))

    const response = await getResult(
      new NextRequest('http://localhost/api/store/sessions/try-on/task-b/result?merchantSlug=merchant-b&merchantSessionId=session-b'),
      { params: { taskId: 'task-a' } },
    )

    expect(response.status).toBe(403)
    expect(createPrivateBlobGetUrl).not.toHaveBeenCalled()
  })

  it('does not issue an asset grant when capability/merchant/session authorization fails', async () => {
    ;(resolveStoreSessionAssetAccess as jest.Mock).mockRejectedValue(new Error('SESSION_UNAUTHORIZED'))

    const response = await getAsset(
      new NextRequest('http://localhost/api/store/sessions/assets/asset-b?merchantSlug=merchant-b&merchantSessionId=session-b'),
      { params: { assetId: 'asset-a' } },
    )

    expect(response.status).toBe(403)
    expect(createPrivateBlobGetUrl).not.toHaveBeenCalled()
  })
})
