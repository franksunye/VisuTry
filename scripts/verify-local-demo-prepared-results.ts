import dotenv from 'dotenv'
import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { PrismaClient } from '@prisma/client'
import { assertDatabaseEnvironment, assertLocalDatabaseUrl } from '../src/lib/app-environment'
import { createRuntimePostgresAdapter, resolveRuntimePostgresProvider } from '../src/lib/postgres-runtime'
import { sanitizeDecisionResultPayload } from '../src/modules/store/domain/decision-result'
import { PREPARED_DEMO_RESULT_MANIFEST } from '../src/modules/store/infrastructure/prepared-demo/prepared-result-manifest'

if (process.env.APP_ENV !== 'local' || process.env.VERCEL_ENV || process.env.VERCEL) {
  throw new Error('Refusing: prepared Demo audit requires explicit Local outside Vercel.')
}
if (process.env.VISUTRY_LOCAL_DEMO_RUNTIME !== '1' || process.env.ENABLE_MOCKS !== 'true') {
  throw new Error('Refusing: Local Demo runtime and TEST mock auth markers are required.')
}
if (process.env.VISUTRY_LOCAL_DEMO_EXECUTION_MODE !== 'PREPARED_DEMO' || process.env.VISUTRY_LOCAL_DEMO_PROVIDER_MODE !== 'blocked') {
  throw new Error('Refusing: this audit requires PREPARED_DEMO with Providers blocked.')
}

const envFile = path.join(process.cwd(), '.env.local')
dotenv.config({ path: envFile, override: false })
assertLocalDatabaseUrl(process.env.DATABASE_URL)
if (resolveRuntimePostgresProvider(process.env) !== 'PRISMA_PG') {
  throw new Error('Refusing: Local audit must use the loopback PrismaPg runtime.')
}

async function main() {
  const databaseIdentity = 'local:127.0.0.1:5433/visutry_local'
  if (process.env.VISUTRY_DATABASE_IDENTITY !== databaseIdentity) {
    throw new Error('Refusing: expected Local database identity marker is missing.')
  }
  const prisma = new PrismaClient({ adapter: createRuntimePostgresAdapter(process.env) })
  try {
    await assertDatabaseEnvironment({
      client: prisma,
      expectedEnvironment: 'local',
      expectedDatabaseIdentity: databaseIdentity,
    })
    const merchant = await prisma.merchant.findUnique({
      where: { slug: 'visutry-demo-optical' },
      select: { id: true, slug: true, classification: true, pilotType: true, commercialExceptionCode: true },
    })
    if (!merchant || merchant.classification !== 'TEST' || merchant.pilotType !== 'DEMO' || merchant.commercialExceptionCode !== 'VISUTRY_DEMO') {
      throw new Error('Refusing: canonical explicit Local Demo identity does not match.')
    }

    const result = await prisma.decisionResult.findFirst({
      where: { merchantId: merchant.id },
      orderBy: { updatedAt: 'desc' },
      select: { id: true, merchantSessionId: true, payload: true },
    })
    if (!result) throw new Error('Prepared Demo audit found no Decision Result created by the browser journey.')
    const payload = sanitizeDecisionResultPayload(result.payload)
    const prepared = payload.tryOnResults.filter((item) => item.source === 'PREPARED_DEMO')
    const approvedLocalAssets = PREPARED_DEMO_RESULT_MANIFEST.filter((asset) =>
      asset.assetClass === 'APPROVED_DEMO_OUTPUT' &&
      asset.reviewStatus === 'APPROVED' &&
      asset.localStoragePath,
    )
    if (approvedLocalAssets.length !== 2 || approvedLocalAssets.some((asset) => asset.productionStorageKey !== null)) {
      throw new Error('The Local audit requires exactly two approved Local outputs and no configured Production storage keys.')
    }
    const expectedAssets = approvedLocalAssets.map((asset) => asset.assetKey).sort()
    const actualAssets = prepared.map((item) => item.sourceRef.assetKey).sort()
    if (prepared.length !== 2 || JSON.stringify(actualAssets) !== JSON.stringify(expectedAssets)) {
      throw new Error('Decision Result does not contain exactly the canonical Rowan and Lane prepared references.')
    }

    const frameRows = await prisma.merchantFrame.findMany({
      where: { merchantId: merchant.id, id: { in: prepared.map((item) => item.frameId) } },
      select: { id: true, sku: true },
    })
    const skuById = new Map(frameRows.map((frame) => [frame.id, frame.sku]))
    for (const item of prepared) {
      const descriptor = PREPARED_DEMO_RESULT_MANIFEST.find((asset) => asset.assetKey === item.sourceRef.assetKey)
      if (!descriptor || skuById.get(item.frameId) !== descriptor.frameSku) {
        throw new Error('Prepared result provenance does not resolve to its canonical tenant frame SKU.')
      }
      if (descriptor.assetClass !== 'APPROVED_DEMO_OUTPUT' || descriptor.reviewStatus !== 'APPROVED' || !descriptor.localStoragePath) {
        throw new Error('The browser journey used a QA fixture or a non-approved asset instead of the approved prepared output.')
      }
      const bytes = await readFile(path.resolve(process.cwd(), descriptor.localStoragePath))
      if (createHash('sha256').update(bytes).digest('hex') !== descriptor.assetSha256) {
        throw new Error(`Prepared output checksum mismatch for ${descriptor.frameIdentity}.`)
      }
    }

    const [tryOnTasks, generationRequests, generationAttempts, tryOnUsageRows, tryOnEvents] = await Promise.all([
      prisma.tryOnTask.count({ where: { merchantId: merchant.id, merchantSessionId: result.merchantSessionId } }),
      prisma.generationRequest.count({ where: { merchantId: merchant.id } }),
      prisma.generationAttempt.count({ where: { request: { merchantId: merchant.id } } }),
      prisma.merchantUsageLedger.count({
        where: {
          merchantId: merchant.id,
          merchantSessionId: result.merchantSessionId,
          kind: { in: ['RENDER_ATTEMPT', 'RENDER_SUCCESS', 'RENDER_FAILURE'] },
        },
      }),
      prisma.merchantEvent.count({
        where: {
          merchantId: merchant.id,
          merchantSessionId: result.merchantSessionId,
          type: { in: ['merchant_tryon_started', 'merchant_tryon_completed', 'merchant_tryon_failed'] },
        },
      }),
    ])
    if (tryOnTasks || generationRequests || generationAttempts || tryOnUsageRows || tryOnEvents) {
      throw new Error('Prepared Demo journey unexpectedly created live Try-On, usage, generation, or provider telemetry rows.')
    }

    console.log('LOCAL PREPARED DEMO AUDIT: PASS')
    console.log(`merchant=${merchant.id} session=${result.merchantSessionId} decisionResult=${result.id}`)
    console.log(`preparedResults=${prepared.length} frameSkus=${[...skuById.values()].sort().join(',')}`)
    console.log(`approvedAssets=${approvedLocalAssets.map((asset) => `${asset.frameIdentity}:${asset.assetSha256}`).join(',')}`)
    console.log(`TryOnTask=${tryOnTasks} GenerationRequest=${generationRequests} GenerationAttempt=${generationAttempts}`)
    console.log(`renderUsage=${tryOnUsageRows} tryOnEvents=${tryOnEvents}`)
  } finally {
    await prisma.$disconnect()
  }
}

void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : 'Local prepared Demo audit failed.')
  process.exitCode = 1
})
