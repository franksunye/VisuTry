/** @jest-environment node */

import { randomUUID } from 'node:crypto'
import { Pool } from 'pg'

const mockGetCloudflareSql = jest.fn()

jest.mock('@/data/neon-cloudflare', () => ({ getCloudflareSql: () => mockGetCloudflareSql() }))
jest.mock('@/modules/store/application/public-discovery-invalidation', () => ({
  withPublicDiscoveryInvalidation: async ({ mutation }: { mutation: () => Promise<unknown> }) => mutation(),
}))
jest.mock('@/modules/store/application/public-edge-paths-server', () => ({ getPublicEdgeTagsForMerchant: async () => [] }))
jest.mock('@/modules/store/application/public-edge-paths-cloudflare', () => ({ getPublicEdgeTagsForCloudflareMerchant: async () => [] }))
jest.mock('@/modules/merchant/application/merchant-agent-credentials', () => ({ recordMerchantAgentOperation: async () => undefined }))
jest.mock('@/modules/merchant/application/merchant-agent-credentials-cloudflare', () => ({ recordMerchantAgentOperation: async () => undefined }))

import { prisma } from '@/lib/prisma'
import type { AgentMerchantActor } from '@/modules/merchant/domain/actor'
import { merchantOnboarding } from '@/modules/merchant/application/merchant-onboarding'
import { importMerchantFrames as importMerchantFramesCloudflare } from '@/modules/merchant/application/merchant-onboarding-cloudflare'

type PgQuery = { text: string; params: unknown[]; then: PromiseLike<unknown>['then'] }

function createNeonCompatiblePgAdapter(pool: Pool) {
  const query = (text: string, params: unknown[] = []): PgQuery => ({
    text,
    params,
    then: (onfulfilled, onrejected) => pool.query(text, params).then((result) => result.rows).then(onfulfilled, onrejected),
  })
  const tag: any = (strings: TemplateStringsArray, ...params: unknown[]) => {
    let text = strings[0] ?? ''
    for (let index = 0; index < params.length; index += 1) text += `$${index + 1}${strings[index + 1] ?? ''}`
    return query(text, params)
  }

  tag.query = query as typeof tag.query
  tag.unsafe = (raw: string) => raw as never
  tag.transaction = async (queries: Array<{ text: string; params?: unknown[] }>, options?: { isolationLevel?: string }) => {
    const client = await pool.connect()
    try {
      const isolation = options?.isolationLevel === 'Serializable' ? 'SERIALIZABLE' : 'READ COMMITTED'
      await client.query(`BEGIN ISOLATION LEVEL ${isolation}`)
      const results: unknown[][] = []
      for (const item of queries) {
        const result = await client.query(item.text, item.params ?? [])
        results.push(result.rows)
      }
      await client.query('COMMIT')
      return results as never
    } catch (error) {
      await client.query('ROLLBACK').catch(() => undefined)
      throw error
    } finally {
      client.release()
    }
  }
  return tag
}

const enabled = process.env.VISUTRY_CATALOG_CAPACITY_PG_TEST === '1'
const postgresDescribe = enabled ? describe : describe.skip
const actor = (merchantId: string): AgentMerchantActor => ({
  actorType: 'AGENT_CREDENTIAL' as const,
  actorId: 'catalog-capacity-postgres-test',
  merchantId,
  scopes: ['catalog:write'],
})

postgresDescribe('Merchant Catalog capacity concurrent PostgreSQL contract', () => {
  let pool!: Pool
  let cloudflareSql: ReturnType<typeof createNeonCompatiblePgAdapter>
  const merchantIds: string[] = []

  beforeAll(async () => {
    const connectionString = process.env.DATABASE_URL
    if (!connectionString) throw new Error('Set DATABASE_URL to the disposable loopback PostgreSQL database.')
    const url = new URL(connectionString)
    if (!['127.0.0.1', 'localhost', '::1'].includes(url.hostname) || url.pathname !== '/visutry_catalog_capacity_test') {
      throw new Error('Refusing Catalog concurrency test outside loopback visutry_catalog_capacity_test.')
    }
    pool = new Pool({ connectionString, max: 8 })
    cloudflareSql = createNeonCompatiblePgAdapter(pool)
    mockGetCloudflareSql.mockReturnValue(cloudflareSql)
    await pool.query(`
      CREATE OR REPLACE FUNCTION public.test_catalog_capacity_insert_delay() RETURNS trigger
      LANGUAGE plpgsql AS $$
      BEGIN
        IF NEW."sku" LIKE 'RACE-%' THEN PERFORM pg_sleep(0.15); END IF;
        RETURN NEW;
      END $$;
      DROP TRIGGER IF EXISTS test_catalog_capacity_insert_delay ON public."MerchantFrame";
      CREATE TRIGGER test_catalog_capacity_insert_delay
      BEFORE INSERT ON public."MerchantFrame"
      FOR EACH ROW EXECUTE FUNCTION public.test_catalog_capacity_insert_delay();
    `)
  })

  afterAll(async () => {
    if (!enabled || !pool) return
    if (merchantIds.length > 0) {
      await pool.query('DELETE FROM "MerchantActivationEvent" WHERE "merchantId" = ANY($1::text[])', [merchantIds])
      await pool.query('DELETE FROM "MerchantFrame" WHERE "merchantId" = ANY($1::text[])', [merchantIds])
      await pool.query('DELETE FROM "Merchant" WHERE "id" = ANY($1::text[])', [merchantIds])
    }
    await pool.query('DROP TRIGGER IF EXISTS test_catalog_capacity_insert_delay ON public."MerchantFrame"')
    await pool.query('DROP FUNCTION IF EXISTS public.test_catalog_capacity_insert_delay()')
    await pool.end()
    await prisma.$disconnect()
  })

  it.each([
    ['Prisma', (merchantId: string, frames: Array<{ sku: string; name: string; shape: string; imageUrl: string }>) =>
      merchantOnboarding.importMerchantFrames({ actor: actor(merchantId), frames })],
    ['Cloudflare SQL batch', (merchantId: string, frames: Array<{ sku: string; name: string; shape: string; imageUrl: string }>) =>
      importMerchantFramesCloudflare({ actor: actor(merchantId), frames })],
  ])('%s serializes two simultaneous imports and rejects the losing batch atomically', async (_runtime, importFrames) => {
    const suffix = randomUUID()
    const merchantId = `catalog-capacity-${suffix}`
    merchantIds.push(merchantId)
    await pool.query(
      'INSERT INTO "Merchant" ("id", "slug", "name", "planCode", "commercialStatus", "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, $5, NOW(), NOW())',
      [merchantId, merchantId, 'Catalog capacity concurrency test', 'FREE', 'ACTIVE'],
    )
    await pool.query(`
      INSERT INTO "MerchantFrame" ("id", "merchantId", "sku", "name", "shape", "status", "source", "createdAt", "updatedAt")
      SELECT $1 || '-base-' || series.i, $1, 'BASE-' || series.i, 'Existing frame ' || series.i, 'round', 'ACTIVE', 'MANUAL', NOW(), NOW()
      FROM generate_series(1, 48) AS series(i)
    `, [merchantId])

    const batches = ['A', 'B'].map((batch) => Array.from({ length: 2 }, (_, index) => ({
      sku: `RACE-${suffix}-${batch}-${index + 1}`,
      name: `Concurrent ${batch} ${index + 1}`,
      shape: 'round',
      imageUrl: `https://catalog-capacity.example.test/${suffix}/${batch}-${index + 1}.jpg`,
    })))
    const outcomes = await Promise.allSettled(batches.map((frames) => importFrames(merchantId, frames)))
    const fulfilledIndexes = outcomes.flatMap((outcome, index) => outcome.status === 'fulfilled' ? [index] : [])
    const rejected = outcomes.find((outcome): outcome is PromiseRejectedResult => outcome.status === 'rejected')

    expect(fulfilledIndexes).toHaveLength(1)
    expect(rejected).toBeDefined()
    expect(rejected?.reason).toMatchObject({ code: 'CATALOG_LIMIT_REACHED', httpStatus: 409 })

    const countResult = await pool.query('SELECT count(*)::int AS "count" FROM "MerchantFrame" WHERE "merchantId" = $1', [merchantId])
    expect(Number(countResult.rows[0]?.count)).toBe(50)
    const winningBatch = new Set(batches[fulfilledIndexes[0]].map((frame) => frame.sku))
    const stored = await pool.query('SELECT "sku" FROM "MerchantFrame" WHERE "merchantId" = $1 AND "sku" LIKE $2', [merchantId, `RACE-${suffix}-%`])
    const storedSkus = stored.rows.map((row) => String(row.sku))
    expect(storedSkus).toHaveLength(2)
    expect(storedSkus.every((sku) => winningBatch.has(sku))).toBe(true)
  }, 30000)
})
