/** @jest-environment node */

jest.mock('@/lib/prisma', () => ({
  prisma: {
    merchantActivationEvent: {
      findMany: jest.fn(),
      create: jest.fn(),
      createMany: jest.fn(),
      upsert: jest.fn(),
    },
    experience: { findFirst: jest.fn() },
  },
}))
jest.mock('@/data/neon-cloudflare', () => ({ getCloudflareSql: jest.fn() }))

import { getCloudflareSql } from '@/data/neon-cloudflare'
import { prisma } from '@/lib/prisma'
import { getMerchantWorkspaceMode as getPrismaWorkspaceMode } from '@/modules/merchant/application/merchant-operating-reads'
import { getMerchantWorkspaceMode as getCloudflareWorkspaceMode } from '@/modules/merchant/application/merchant-operating-reads-cloudflare'

const activationEvents = prisma.merchantActivationEvent as unknown as {
  findMany: jest.Mock
  create: jest.Mock
  createMany: jest.Mock
  upsert: jest.Mock
}
const experience = prisma.experience as unknown as { findFirst: jest.Mock }

describe('Prisma / Cloudflare Merchant workspace-mode read parity', () => {
  beforeEach(() => jest.clearAllMocks())

  it.each([
    ['preview event', [{ eventType: 'merchant_store_previewed' }], null, { mode: 'OPERATING', reason: 'STORE_PREVIEWED' }],
    ['publish event without preview', [{ eventType: 'merchant_store_published' }], null, { mode: 'OPERATING', reason: 'STORE_PUBLISHED' }],
    ['ACTIVE Store without activation events', [], [{ id: 'store-a' }], { mode: 'OPERATING', reason: 'ACTIVE_STORE' }],
    ['DRAFT Store without activation events', [], null, { mode: 'ACTIVATION', reason: 'FIRST_VALUE_NOT_REACHED' }],
    ['no Store or activation events', [], null, { mode: 'ACTIVATION', reason: 'FIRST_VALUE_NOT_REACHED' }],
  ])('%s is resolved identically by both runtime adapters', async (_label, events, activeStoreRows, expected) => {
    activationEvents.findMany.mockResolvedValue(events)
    experience.findFirst.mockResolvedValue(activeStoreRows?.[0] ?? null)
    const cloudflareSql = jest.fn((strings: TemplateStringsArray) => {
      const query = strings.join('?')
      return Promise.resolve(query.includes('MerchantActivationEvent') ? events : activeStoreRows ?? [])
    })
    ;(getCloudflareSql as jest.Mock).mockReturnValue(cloudflareSql)

    const [prismaResult, cloudflareResult] = await Promise.all([
      getPrismaWorkspaceMode({ merchantId: 'merchant-test' }),
      getCloudflareWorkspaceMode({ merchantId: 'merchant-test' }),
    ])

    expect(prismaResult).toEqual(expected)
    expect(cloudflareResult).toEqual(expected)
    expect(activationEvents.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        merchantId: 'merchant-test',
        eventType: { in: ['merchant_store_previewed', 'merchant_store_published'] },
      },
    }))
    expect(experience.findFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: { merchantId: 'merchant-test', type: 'STORE', status: 'ACTIVE' },
    }))
  })

  it('is a read-only compatibility resolver and never synthesizes an activation event', async () => {
    activationEvents.findMany.mockResolvedValue([])
    experience.findFirst.mockResolvedValue({ id: 'store-a' })
    const cloudflareSql = jest.fn((strings: TemplateStringsArray) => Promise.resolve(
      strings.join('?').includes('MerchantActivationEvent') ? [] : [{ id: 'store-a' }],
    ))
    ;(getCloudflareSql as jest.Mock).mockReturnValue(cloudflareSql)

    await getPrismaWorkspaceMode({ merchantId: 'merchant-test' })
    await getCloudflareWorkspaceMode({ merchantId: 'merchant-test' })

    expect(activationEvents.create).not.toHaveBeenCalled()
    expect(activationEvents.createMany).not.toHaveBeenCalled()
    expect(activationEvents.upsert).not.toHaveBeenCalled()
    expect(cloudflareSql.mock.calls).toHaveLength(2)
    expect(cloudflareSql.mock.calls.every(([strings]) => strings.join('?').trimStart().startsWith('SELECT'))).toBe(true)
  })
})
