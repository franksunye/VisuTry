jest.mock('@/data/neon-cloudflare', () => ({ getCloudflareSql: jest.fn() }))
jest.mock('@/lib/prisma', () => ({
  prisma: {
    merchantAgentCredential: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}))

import { getCloudflareSql } from '@/data/neon-cloudflare'
import { prisma } from '@/lib/prisma'
import {
  createAgentSecret,
  LAST_USED_UPDATE_INTERVAL_MS,
} from '@/modules/merchant/domain/agent-credentials'
import { authenticateMerchantAgentCredential as authenticateCloudflare } from '@/modules/merchant/application/merchant-agent-credentials-cloudflare'
import { authenticateMerchantAgentCredential as authenticatePrisma } from '@/modules/merchant/application/merchant-agent-credentials'

const NOW = new Date('2026-09-20T12:00:00.000Z')
const prismaCredentials = prisma.merchantAgentCredential as unknown as {
  findUnique: jest.Mock
  update: jest.Mock
}
const getCloudflareSqlMock = getCloudflareSql as unknown as jest.Mock

describe('Prisma / Cloudflare Agent-key last-used parity', () => {
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(NOW)
    jest.clearAllMocks()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it.each([
    ['never used', null, true],
    ['inside the 15-minute window', new Date(NOW.getTime() - LAST_USED_UPDATE_INTERVAL_MS + 1), false],
    ['exactly at the 15-minute boundary', new Date(NOW.getTime() - LAST_USED_UPDATE_INTERVAL_MS), true],
    ['older than the 15-minute window', new Date(NOW.getTime() - LAST_USED_UPDATE_INTERVAL_MS - 1), true],
  ])('%s updates both runtime paths consistently', async (_label, lastUsedAt, shouldUpdate) => {
    const generated = createAgentSecret()
    const credential = {
      id: 'credential-a',
      merchantId: 'merchant-a',
      secretHash: generated.secretHash,
      scopes: ['merchant:read'],
      status: 'ACTIVE',
      lastUsedAt,
    }
    prismaCredentials.findUnique.mockResolvedValue(credential)
    prismaCredentials.update.mockResolvedValue(undefined)

    const cloudflareQueries: Array<{ text: string; values: unknown[] }> = []
    const cloudflareSql = jest.fn((strings: TemplateStringsArray, ...values: unknown[]) => {
      const text = strings.join(' ? ')
      cloudflareQueries.push({ text, values })
      return Promise.resolve(text.includes('SELECT') ? [{
        ...credential,
        lastUsedAt: lastUsedAt?.toISOString() ?? null,
      }] : [])
    })
    getCloudflareSqlMock.mockReturnValue(cloudflareSql)

    const [prismaActor, cloudflareActor] = await Promise.all([
      authenticatePrisma(generated.secret),
      authenticateCloudflare(generated.secret),
    ])

    expect(prismaActor).toEqual(cloudflareActor)
    expect(prismaCredentials.update).toHaveBeenCalledTimes(shouldUpdate ? 1 : 0)
    const usageUpdates = cloudflareQueries.filter((query) => query.text.includes('UPDATE "MerchantAgentCredential"'))
    expect(usageUpdates).toHaveLength(shouldUpdate ? 1 : 0)
    if (shouldUpdate) {
      expect(usageUpdates[0].text).toContain('"status" = \'ACTIVE\'')
      expect(usageUpdates[0].text).toContain('"lastUsedAt" IS NULL')
      expect(usageUpdates[0].values).toContain('credential-a')
      expect(usageUpdates[0].values).toContain(LAST_USED_UPDATE_INTERVAL_MS)
    }
  })

  it('does not write usage timestamps for a key that fails verification', async () => {
    const generated = createAgentSecret()
    prismaCredentials.findUnique.mockResolvedValue({
      id: 'credential-a', merchantId: 'merchant-a', secretHash: generated.secretHash,
      scopes: ['merchant:read'], status: 'ACTIVE', lastUsedAt: null,
    })
    const cloudflareQueries: string[] = []
    const cloudflareSql = jest.fn((strings: TemplateStringsArray) => {
      const text = strings.join(' ? ')
      cloudflareQueries.push(text)
      return Promise.resolve([{ id: 'credential-a', merchantId: 'merchant-a', secretHash: generated.secretHash, scopes: ['merchant:read'], status: 'ACTIVE', lastUsedAt: null }])
    })
    getCloudflareSqlMock.mockReturnValue(cloudflareSql)

    await expect(authenticatePrisma(`${generated.secret}wrong`)).rejects.toThrow()
    await expect(authenticateCloudflare(`${generated.secret}wrong`)).rejects.toThrow()
    expect(prismaCredentials.update).not.toHaveBeenCalled()
    expect(cloudflareQueries.some((query) => query.includes('UPDATE "MerchantAgentCredential"'))).toBe(false)
  })
})
