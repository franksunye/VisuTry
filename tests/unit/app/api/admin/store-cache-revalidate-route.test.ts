/** @jest-environment node */

import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma'
import { invalidatePublicDiscovery } from '@/modules/store/application/public-discovery-invalidation'
import * as routeHandlers from '@/app/api/admin/store/cache/revalidate/route'
import { POST } from '@/app/api/admin/store/cache/revalidate/route'

jest.mock('@/lib/api-auth', () => ({ requireAdmin: jest.fn() }))
jest.mock('@/lib/prisma', () => ({
  prisma: {
    $transaction: jest.fn(),
    merchant: {
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      upsert: jest.fn(),
    },
    experience: {
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      upsert: jest.fn(),
    },
    merchantFrame: {
      create: jest.fn(),
      createMany: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
    experienceFrame: {
      create: jest.fn(),
      createMany: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
  },
}))
jest.mock('@/modules/store/application/public-discovery-invalidation', () => ({
  invalidatePublicDiscovery: jest.fn(async ({ target }: { target: { kind: string; merchantSlug: string; experienceSlug?: string } }) => ({
    merchantSlug: target.merchantSlug,
    scope: target.kind === 'experience' ? 'CAMPAIGN' : 'STORE',
    ...(target.experienceSlug ? { experienceSlug: target.experienceSlug } : {}),
    tags: [],
    paths: [],
    publicHtmlPurge: { attempted: true, success: true, tagCount: 1 },
  })),
}))

const admin = requireAdmin as jest.Mock
const invalidator = invalidatePublicDiscovery as jest.Mock
const db = prisma as unknown as {
  $transaction: jest.Mock
  merchant: Record<string, jest.Mock>
  experience: Record<string, jest.Mock>
  merchantFrame: Record<string, jest.Mock>
  experienceFrame: Record<string, jest.Mock>
}

function request(body: unknown) {
  return new NextRequest('http://localhost/api/admin/store/cache/revalidate', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
}

function expectNoBusinessWrites() {
  expect(db.$transaction).not.toHaveBeenCalled()
  for (const model of [db.merchant, db.experience, db.merchantFrame, db.experienceFrame]) {
    for (const method of Object.values(model)) expect(method).not.toHaveBeenCalled()
  }
}

describe('POST /api/admin/store/cache/revalidate', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    admin.mockResolvedValue({ ok: true, userId: 'admin-1' })
  })

  it('rejects unauthenticated requests before parsing or invalidating', async () => {
    admin.mockResolvedValue({
      ok: false,
      response: NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 }),
    })

    const response = await POST(request({ merchantSlug: 'visutry-demo-optical' }))

    expect(response.status).toBe(401)
    expect(invalidator).not.toHaveBeenCalled()
    expectNoBusinessWrites()
  })

  it('rejects authenticated non-admin requests', async () => {
    admin.mockResolvedValue({
      ok: false,
      response: NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 }),
    })

    const response = await POST(request({ merchantSlug: 'visutry-demo-optical' }))

    expect(response.status).toBe(403)
    expect(invalidator).not.toHaveBeenCalled()
    expectNoBusinessWrites()
  })

  it.each([
    { merchantSlug: '' },
    { merchantSlug: '../visutry-demo-optical' },
    { merchantSlug: 'Bad_Slug' },
    { merchantSlug: 'a'.repeat(181) },
    { merchantSlug: 'visutry-demo-optical', experienceSlug: 'bad_slug' },
    { merchantSlug: 'visutry-demo-optical', arbitraryTag: 'tryon' },
    { merchantSlug: 'visutry-demo-optical', path: '/anything' },
  ])('rejects invalid or unbounded scope: %j', async (body) => {
    const response = await POST(request(body))

    expect(response.status).toBe(400)
    expect(await response.json()).toMatchObject({ success: false, error: 'INVALID_REQUEST' })
    expect(invalidator).not.toHaveBeenCalled()
    expectNoBusinessWrites()
  })

  it('invokes only the shared Store invalidator for a valid admin request', async () => {
    const response = await POST(request({ merchantSlug: ' visutry-demo-optical ' }))
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(response.headers.get('cache-control')).toBe('no-store')
    expect(invalidator).toHaveBeenCalledTimes(1)
    expect(invalidator).toHaveBeenCalledWith({
      target: { kind: 'store', merchantSlug: 'visutry-demo-optical' },
    })
    expect(body).toMatchObject({
      success: true,
      data: { merchantSlug: 'visutry-demo-optical', scope: 'STORE' },
    })
    expectNoBusinessWrites()
  })

  it('uses the existing Campaign experience invalidation when an experience slug is supplied', async () => {
    const response = await POST(request({
      merchantSlug: 'visutry-demo-optical',
      experienceSlug: 'spring-edit',
    }))

    expect(response.status).toBe(200)
    expect(invalidator).toHaveBeenCalledWith({
      target: {
        kind: 'experience',
        merchantSlug: 'visutry-demo-optical',
        experienceSlug: 'spring-edit',
      },
    })
    expectNoBusinessWrites()
  })

  it('exports POST only; GET cannot trigger invalidation', () => {
    expect(Object.keys(routeHandlers).sort()).toEqual(['POST', 'dynamic'])
    expect('GET' in routeHandlers).toBe(false)
  })
})
