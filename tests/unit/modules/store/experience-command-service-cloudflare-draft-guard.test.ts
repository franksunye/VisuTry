import { getCloudflareSql } from '@/data/neon-cloudflare'
import { ExperienceCommandError } from '@/modules/store/application/experience-command-service'
import { experienceCommandsCloudflare } from '@/modules/store/application/experience-command-service-cloudflare'

jest.mock('@/data/neon-cloudflare', () => ({ getCloudflareSql: jest.fn() }))
jest.mock('@/modules/store/application/public-discovery-invalidation', () => ({
  withPublicDiscoveryInvalidation: jest.fn(async ({ mutation }: { mutation: () => Promise<unknown> }) => mutation()),
}))

function sqlAdapter() {
  const sql = jest.fn((strings: TemplateStringsArray) => {
    const query = strings.join('')
    if (query.includes('FROM "Experience" e JOIN "Merchant" m')) {
      return Promise.resolve([{ id: 'campaign-a', slug: 'spring', type: 'CAMPAIGN', merchantSlug: 'merchant-a' }])
    }
    return Promise.resolve([])
  }) as jest.Mock & { transaction: jest.Mock }
  sql.transaction = jest.fn()
  return sql
}

describe('Cloudflare Experience Agent draft-only write boundary', () => {
  beforeEach(() => jest.clearAllMocks())

  it('maps an ACTIVE Campaign guard rejection before running the write batch', async () => {
    const sql = sqlAdapter()
    sql.transaction.mockRejectedValue({ code: '22012' })
    ;(getCloudflareSql as jest.Mock).mockReturnValue(sql)

    await expect(experienceCommandsCloudflare.updateCampaignConfiguration({
      merchantId: 'merchant-a', experienceId: 'campaign-a', patch: { primaryCtaLabel: 'Shop now' }, draftOnly: true,
    })).rejects.toBeInstanceOf(ExperienceCommandError)

    const guardQuery = sql.mock.calls.find((call) => String(call[0]?.join?.('') ?? '').includes('"status" = \'DRAFT\''))
    expect(guardQuery?.[0].join('')).toContain('"merchantId"')
    expect(guardQuery?.[0].join('')).toContain('FOR UPDATE')
    expect(sql.transaction).toHaveBeenCalledTimes(1)
    expect(sql.transaction.mock.calls[0]?.[0]).toHaveLength(2)
  })

  it('commits a Draft Campaign update only after the guard statement', async () => {
    const sql = sqlAdapter()
    sql.transaction.mockResolvedValue([[], [{ id: 'campaign-a' }]])
    ;(getCloudflareSql as jest.Mock).mockReturnValue(sql)

    await experienceCommandsCloudflare.updateCampaignConfiguration({
      merchantId: 'merchant-a', experienceId: 'campaign-a', patch: { primaryCtaLabel: 'Shop now' }, draftOnly: true,
    })

    expect(sql.transaction.mock.calls[0]?.[0]).toHaveLength(2)
    expect(String(sql.mock.calls.find((call) => String(call[0]?.join?.('') ?? '').includes("'DRAFT'"))?.[0]?.join?.(''))).toContain('FOR UPDATE')
  })

  it('rejects ACTIVE frame replacement before the delete/insert batch can commit', async () => {
    const sql = sqlAdapter()
    sql.transaction.mockRejectedValue({ code: '22012' })
    ;(getCloudflareSql as jest.Mock).mockReturnValue(sql)

    await expect(experienceCommandsCloudflare.replaceCatalogSelection({
      merchantId: 'merchant-a', experienceId: 'campaign-a', expectedType: 'CAMPAIGN', frameIds: ['frame-a'], draftOnly: true,
    })).rejects.toBeInstanceOf(ExperienceCommandError)

    expect(sql.transaction).toHaveBeenCalledTimes(1)
    expect(sql.transaction.mock.calls[0]?.[0]).toHaveLength(3)
    expect(String(sql.mock.calls.find((call) => String(call[0]?.join?.('') ?? '').includes("'DRAFT'"))?.[0]?.join?.(''))).toContain('FOR UPDATE')
  })
})
