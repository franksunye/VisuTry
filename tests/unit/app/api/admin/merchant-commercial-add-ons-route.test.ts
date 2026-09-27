/** @jest-environment node */

import { NextRequest } from 'next/server'
import { requireAdmin } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma'
import { withPublicDiscoveryInvalidation } from '@/modules/store/application/public-discovery-invalidation'
import { GET, PUT } from '@/app/api/admin/store/merchants/[id]/commercial-add-ons/route'

jest.mock('@/lib/api-auth', () => ({ requireAdmin: jest.fn() }))
jest.mock('@/lib/prisma', () => ({
  prisma: {
    merchant: { findUnique: jest.fn() },
    $transaction: jest.fn(),
  },
}))
jest.mock('@/modules/store/application/public-discovery-invalidation', () => ({
  withPublicDiscoveryInvalidation: jest.fn(async ({ mutation }: { mutation: () => Promise<unknown> }) => mutation()),
}))

const admin = requireAdmin as jest.Mock
const db = prisma as unknown as {
  merchant: { findUnique: jest.Mock }
  $transaction: jest.Mock
}
const boundary = withPublicDiscoveryInvalidation as jest.Mock

describe('Merchant commercial add-on admin route', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    admin.mockResolvedValue({ ok: true, userId: 'admin-1' })
  })

  it('reports effective Kiosk availability from plan plus provisioned add-ons', async () => {
    db.merchant.findUnique.mockResolvedValue({
      id: 'merchant-1',
      planCode: 'LAUNCH',
      commercialStatus: 'PAID_ACTIVE',
      commercialAddOns: ['KIOSK'],
      entitlementEffectiveFrom: new Date('2026-09-01T00:00:00.000Z'),
      billingPeriodEnd: new Date('2026-10-01T00:00:00.000Z'),
    })

    const response = await GET(
      new NextRequest('http://localhost/api/admin/store/merchants/merchant-1/commercial-add-ons'),
      { params: { id: 'merchant-1' } },
    )
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.data).toMatchObject({
      merchantId: 'merchant-1',
      planCode: 'LAUNCH',
      commercialAddOns: ['KIOSK'],
      kioskDelivery: 'add_on',
      kioskAvailable: true,
    })
  })

  it('provisions Kiosk for an add-on eligible plan and audits the mutation', async () => {
    db.merchant.findUnique.mockResolvedValue({ id: 'merchant-1', slug: 'merchant-one', planCode: 'LAUNCH' })
    const tx = {
      merchant: {
        update: jest.fn().mockResolvedValue({ id: 'merchant-1', commercialAddOns: ['KIOSK'] }),
      },
      merchantOperationAudit: { create: jest.fn().mockResolvedValue({ id: 'audit-1' }) },
    }
    db.$transaction.mockImplementation(async (fn: (value: typeof tx) => Promise<unknown>) => fn(tx))

    const response = await PUT(new NextRequest('http://localhost/api/admin/store/merchants/merchant-1/commercial-add-ons', {
      method: 'PUT',
      body: JSON.stringify({ addOns: ['KIOSK'] }),
    }), { params: { id: 'merchant-1' } })
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.data).toMatchObject({
      merchantId: 'merchant-1',
      commercialAddOns: ['KIOSK'],
      kioskDelivery: 'add_on',
    })
    expect(tx.merchant.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'merchant-1' },
      data: { commercialAddOns: ['KIOSK'] },
    }))
    expect(tx.merchantOperationAudit.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        merchantId: 'merchant-1',
        actorType: 'ADMIN',
        actorId: 'admin-1',
        action: 'commercial_add_ons_set',
      }),
    }))
    expect(boundary).toHaveBeenCalledWith(expect.objectContaining({
      target: { kind: 'merchant', merchantSlug: 'merchant-one' },
    }))
  })

  it('does not sell Kiosk as an add-on when the plan already includes it', async () => {
    db.merchant.findUnique.mockResolvedValue({ id: 'merchant-1', slug: 'merchant-one', planCode: 'SCALE' })

    const response = await PUT(new NextRequest('http://localhost/api/admin/store/merchants/merchant-1/commercial-add-ons', {
      method: 'PUT',
      body: JSON.stringify({ addOns: ['KIOSK'] }),
    }), { params: { id: 'merchant-1' } })

    expect(response.status).toBe(409)
    await expect(response.json()).resolves.toMatchObject({ error: 'KIOSK_ALREADY_INCLUDED' })
    expect(db.$transaction).not.toHaveBeenCalled()
  })

  it('allows removal and rejects unsupported add-ons', async () => {
    db.merchant.findUnique.mockResolvedValue({ id: 'merchant-1', slug: 'merchant-one', planCode: 'GROWTH' })
    const tx = {
      merchant: {
        update: jest.fn().mockResolvedValue({ id: 'merchant-1', commercialAddOns: [] }),
      },
      merchantOperationAudit: { create: jest.fn().mockResolvedValue({ id: 'audit-1' }) },
    }
    db.$transaction.mockImplementation(async (fn: (value: typeof tx) => Promise<unknown>) => fn(tx))

    const remove = await PUT(new NextRequest('http://localhost/api/admin/store/merchants/merchant-1/commercial-add-ons', {
      method: 'PUT',
      body: JSON.stringify({ addOns: [] }),
    }), { params: { id: 'merchant-1' } })
    expect(remove.status).toBe(200)

    const unsupported = await PUT(new NextRequest('http://localhost/api/admin/store/merchants/merchant-1/commercial-add-ons', {
      method: 'PUT',
      body: JSON.stringify({ addOns: ['UNKNOWN'] }),
    }), { params: { id: 'merchant-1' } })
    expect(unsupported.status).toBe(400)
  })
})
