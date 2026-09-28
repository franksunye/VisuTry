import fs from 'node:fs'
import path from 'node:path'
import net from 'node:net'
import dotenv from 'dotenv'
import { PrismaClient } from '@prisma/client'
import { assertDatabaseEnvironment } from '../src/lib/app-environment'
import { createRuntimePostgresAdapter, resolveRuntimePostgresProvider } from '../src/lib/postgres-runtime'
import { MockBlob, readMockBlob } from '../src/lib/mocks/blob'
import {
  assertDemoServerStopped,
  assertDemoStoreIdentity,
  assertLocalDemoMerchantIdentity,
  assertLocalDemoSessionResetEnvironment,
  assertLocalDemoShopperMediaPathname,
  localDemoShopperMediaPathnameFromReference,
  localDemoShopperMediaPrefixes,
  localDemoTryOnTaskScope,
} from './lib/local-demo-session-reset-contract'

const envFile = path.join(process.cwd(), '.env.local')
if (fs.existsSync(envFile)) dotenv.config({ path: envFile, override: false })

function isTcpPortListening(host: string, port: number): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const socket = net.createConnection({ host, port })
    const timeout = setTimeout(() => {
      socket.destroy()
      reject(new Error('Could not verify whether the Local Demo app is stopped; refusing reset.'))
    }, 1500)
    socket.once('connect', () => {
      clearTimeout(timeout)
      socket.destroy()
      resolve(true)
    })
    socket.once('error', (error: NodeJS.ErrnoException) => {
      clearTimeout(timeout)
      socket.destroy()
      if (error.code === 'ECONNREFUSED' || error.code === 'EHOSTUNREACH') resolve(false)
      else reject(new Error('Could not verify whether the Local Demo app is stopped; refusing reset.'))
    })
  })
}

function printCounts(label: string, counts: Record<string, number>): void {
  console.log(`${label}: ${Object.entries(counts).map(([key, value]) => `${key}=${value}`).join(' ')}`)
}

function addLocalMediaReference(target: Set<string>, value: string | null | undefined, merchantId: string): void {
  const pathname = localDemoShopperMediaPathnameFromReference(value, merchantId)
  if (pathname) target.add(pathname)
}

async function listScopedLocalMedia(merchantId: string): Promise<string[]> {
  const pathnames = new Set<string>()
  for (const prefix of localDemoShopperMediaPrefixes(merchantId)) {
    const { blobs } = await MockBlob.list({ prefix })
    for (const blob of blobs) {
      assertLocalDemoShopperMediaPathname(blob.pathname, merchantId)
      pathnames.add(blob.pathname)
    }
  }
  return [...pathnames]
}

async function main(): Promise<void> {
  assertLocalDemoSessionResetEnvironment(process.env)
  if (resolveRuntimePostgresProvider(process.env) !== 'PRISMA_PG') {
    throw new Error('Refusing: PrismaPg Local runtime is not selected.')
  }
  await assertDemoServerStopped(isTcpPortListening)

  const prisma = new PrismaClient({ adapter: createRuntimePostgresAdapter(process.env) })
  try {
    const marker = await assertDatabaseEnvironment({
      client: prisma,
      expectedEnvironment: 'local',
      expectedDatabaseIdentity: 'local:127.0.0.1:5433/visutry_local',
    })
    if (marker.environment !== 'LOCAL') throw new Error('Refusing: Local database marker verification failed.')

    const result = await prisma.$transaction(async (tx) => {
      const merchant = await tx.merchant.findUnique({
        where: { slug: 'visutry-demo-optical' },
        select: {
          id: true,
          slug: true,
          name: true,
          classification: true,
          classificationSource: true,
          pilotType: true,
          referenceData: true,
          frames: { select: { id: true, sku: true, source: true, sourceNotes: true, status: true } },
          experiences: {
            select: {
              id: true,
              slug: true,
              type: true,
              status: true,
              referenceMetadata: true,
              frames: { select: { merchantFrameId: true, active: true } },
            },
          },
          memberships: { select: { userId: true, role: true } },
        },
      })
      if (!merchant) throw new Error('Refusing: the dedicated Local Demo TEST Merchant does not exist.')
      assertLocalDemoMerchantIdentity(merchant)

      const allowedSourceNotes = new Set([
        'VisuTry-owned synthetic local demo inventory; not offered for sale. Material and color labels describe visual appearance only.',
        'VisuTry-owned synthetic demo inventory; not offered for sale. Material and color labels describe visual appearance only.',
      ])
      const manifestPath = path.join(process.cwd(), 'docs/assets/local-demo/visutry-demo-catalog-v1.json')
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8')) as { items?: Array<{ sku?: string }> }
      const expectedSkus = new Set((manifest.items || []).map((item) => item.sku).filter((sku): sku is string => typeof sku === 'string'))
      if (expectedSkus.size !== 10
        || merchant.frames.length !== 10
        || merchant.frames.some((frame) => !frame.sku
          || !expectedSkus.has(frame.sku)
          || frame.source !== 'SEED'
          || !allowedSourceNotes.has(frame.sourceNotes || '')
          || frame.status !== 'ACTIVE')) {
        throw new Error('Refusing: the target Merchant no longer has exactly the canonical 10-product Local Demo catalog.')
      }
      if (merchant.memberships.length !== 1
        || merchant.memberships[0]?.userId !== 'mock-user-1'
        || merchant.memberships[0]?.role !== 'OWNER') {
        throw new Error('Refusing: the dedicated Local Demo Merchant membership boundary is unexpected.')
      }
      if (merchant.experiences.length !== 1) {
        throw new Error('Refusing: the dedicated Demo Merchant does not have exactly one managed Store.')
      }
      const store = merchant.experiences[0]
      assertDemoStoreIdentity(store)
      const storeFrameIds = new Set(store.frames.filter((row) => row.active).map((row) => row.merchantFrameId))
      const catalogFrameIds = new Set(merchant.frames.map((row) => row.id))
      if (store.status !== 'ACTIVE'
        || storeFrameIds.size !== 10
        || [...storeFrameIds].some((id) => !catalogFrameIds.has(id))) {
        throw new Error('Refusing: Store is not the expected active Store with all 10 managed products selected.')
      }

      const sessionRows = await tx.merchantSession.findMany({
        where: { merchantId: merchant.id },
        select: { id: true, photoAssetId: true },
      })
      const sessionIds = sessionRows.map((row) => row.id)
      const taskRows = await tx.tryOnTask.findMany({
        where: { merchantId: merchant.id, merchantSessionId: { in: sessionIds } },
        select: {
          id: true,
          userImageUrl: true,
          itemImageUrl: true,
          resultImageUrl: true,
          metadata: true,
        },
      })
      const taskIds = taskRows.map((row) => row.id)
      const decisionRows = await tx.decisionResult.findMany({
        where: { merchantId: merchant.id, merchantSessionId: { in: sessionIds } },
        select: { id: true },
      })
      const decisionIds = decisionRows.map((row) => row.id)
      const generationRows = await tx.generationRequest.findMany({
        where: localDemoTryOnTaskScope(merchant.id, taskIds),
        select: { id: true },
      })
      const generationRequestIds = generationRows.map((row) => row.id)

      const sessionPhotoAssetIds = sessionRows.flatMap((row) => row.photoAssetId ? [row.photoAssetId] : [])
      const relatedAssets = await tx.storeAsset.findMany({
        where: {
          merchantId: merchant.id,
          OR: [
            { merchantSessionId: { not: null } },
            { ownerType: 'SESSION' },
            ...(sessionPhotoAssetIds.length ? [{ id: { in: sessionPhotoAssetIds } }] : []),
          ],
        },
        select: { id: true, purpose: true, storageKey: true, providerUrl: true },
      })
      const assetIds = relatedAssets.map((row) => row.id)
      if (assetIds.length) {
        const outsidePhotoReferences = await tx.merchantSession.count({
          where: { photoAssetId: { in: assetIds }, id: { notIn: sessionIds } },
        })
        if (outsidePhotoReferences > 0) {
          throw new Error('Refusing: a shopper photo asset is also referenced by a session outside this Demo reset scope.')
        }
      }

      const orphanRowsForMerchant = await tx.storeOrphanBlob.findMany({
        where: { merchantId: merchant.id },
        select: { id: true, tryOnTaskId: true, url: true, pathname: true },
      })
      const taskIdSet = new Set(taskIds)
      const shopperOrphanRows = orphanRowsForMerchant.filter((row) => {
        const pathFromUrl = localDemoShopperMediaPathnameFromReference(row.url, merchant.id)
        const pathFromPathname = localDemoShopperMediaPathnameFromReference(row.pathname, merchant.id)
        return taskIdSet.has(row.tryOnTaskId || '') || Boolean(pathFromUrl || pathFromPathname)
      })
      const orphanRows = shopperOrphanRows
      const orphanIds = orphanRows.map((row) => row.id)

      const mediaReferences = new Set<string>()
      for (const row of sessionRows) {
        // The corresponding StoreAsset below is the canonical photo pathname
        // source; the FK is still included to ensure session-owned rows are found.
        if (row.photoAssetId && !relatedAssets.some((asset) => asset.id === row.photoAssetId)) {
          throw new Error('Refusing: a Demo shopper photo reference has no matching session-owned StoreAsset.')
        }
      }
      for (const row of taskRows) {
        addLocalMediaReference(mediaReferences, row.userImageUrl, merchant.id)
        addLocalMediaReference(mediaReferences, row.itemImageUrl, merchant.id)
        addLocalMediaReference(mediaReferences, row.resultImageUrl, merchant.id)
        const metadata = row.metadata && typeof row.metadata === 'object' && !Array.isArray(row.metadata)
          ? row.metadata as Record<string, unknown>
          : {}
        for (const key of ['userPathname', 'itemPathname', 'resultPathname']) {
          const value = metadata[key]
          if (typeof value === 'string') addLocalMediaReference(mediaReferences, value, merchant.id)
        }
      }
      for (const row of relatedAssets) {
        if (row.purpose === 'SHOPPER_PHOTO' || row.storageKey.startsWith(`store/${merchant.id}/sessions/`)) {
          const storagePath = localDemoShopperMediaPathnameFromReference(row.storageKey, merchant.id)
          const providerPath = localDemoShopperMediaPathnameFromReference(row.providerUrl, merchant.id)
          if (!storagePath && !providerPath) {
            throw new Error('Refusing: a Demo shopper photo asset does not identify an exact Local media object.')
          }
          if (storagePath) mediaReferences.add(storagePath)
          if (providerPath) mediaReferences.add(providerPath)
        } else {
          addLocalMediaReference(mediaReferences, row.storageKey, merchant.id)
          addLocalMediaReference(mediaReferences, row.providerUrl, merchant.id)
        }
      }
      for (const row of orphanRows) {
        addLocalMediaReference(mediaReferences, row.pathname, merchant.id)
        addLocalMediaReference(mediaReferences, row.url, merchant.id)
      }

      const before = {
        sessions: sessionIds.length,
        photoAssets: assetIds.length,
        storeEvents: sessionIds.length ? await tx.merchantEvent.count({ where: { merchantId: merchant.id, merchantSessionId: { in: sessionIds } } }) : 0,
        intents: sessionIds.length ? await tx.merchantIntent.count({ where: { merchantId: merchant.id, merchantSessionId: { in: sessionIds } } }) : 0,
        tryOnTasks: taskIds.length,
        decisionResults: decisionIds.length,
        decisionShares: decisionIds.length ? await tx.decisionResultShare.count({ where: { merchantId: merchant.id, decisionResultId: { in: decisionIds } } }) : 0,
        usageLedger: sessionIds.length || taskIds.length ? await tx.merchantUsageLedger.count({ where: { merchantId: merchant.id, OR: [{ merchantSessionId: { in: sessionIds } }, { tryOnTaskId: { in: taskIds } }] } }) : 0,
        sponsoredUsage: sessionIds.length ? await tx.merchantSponsoredUsage.count({ where: { merchantId: merchant.id, merchantSessionId: { in: sessionIds } } }) : 0,
        generationRequests: generationRequestIds.length,
        generationAttempts: generationRequestIds.length ? await tx.generationAttempt.count({ where: { requestId: { in: generationRequestIds } } }) : 0,
        orphanBlobs: orphanIds.length,
        abuseCounters: await tx.storeAbuseCounter.count({ where: { merchantId: merchant.id } }),
        firstShopperMilestones: await tx.merchantActivationEvent.count({ where: { merchantId: merchant.id, eventType: 'merchant_first_shopper_session' } }),
      }

      await tx.merchantActivationEvent.deleteMany({ where: { merchantId: merchant.id, eventType: 'merchant_first_shopper_session' } })
      if (taskIds.length) {
        await tx.generationRequest.deleteMany({
          where: localDemoTryOnTaskScope(merchant.id, taskIds),
        })
      }
      await tx.storeOrphanBlob.deleteMany({ where: { merchantId: merchant.id, id: { in: orphanIds } } })
      if (sessionIds.length) {
        await tx.merchantEvent.deleteMany({ where: { merchantId: merchant.id, merchantSessionId: { in: sessionIds } } })
        await tx.merchantIntent.deleteMany({ where: { merchantId: merchant.id, merchantSessionId: { in: sessionIds } } })
        await tx.merchantUsageLedger.deleteMany({
          where: { merchantId: merchant.id, OR: [{ merchantSessionId: { in: sessionIds } }, ...(taskIds.length ? [{ tryOnTaskId: { in: taskIds } }] : [])] },
        })
        await tx.merchantSponsoredUsage.deleteMany({ where: { merchantId: merchant.id, merchantSessionId: { in: sessionIds } } })
        await tx.decisionResultShare.deleteMany({ where: { merchantId: merchant.id, decisionResultId: { in: decisionIds } } })
        await tx.decisionResult.deleteMany({ where: { merchantId: merchant.id, merchantSessionId: { in: sessionIds } } })
        await tx.tryOnTask.deleteMany({ where: { merchantId: merchant.id, merchantSessionId: { in: sessionIds } } })
        await tx.storeAbuseCounter.deleteMany({ where: { merchantId: merchant.id } })
        await tx.merchantSession.updateMany({ where: { merchantId: merchant.id, id: { in: sessionIds } }, data: { photoAssetId: null } })
        if (assetIds.length) {
          await tx.storeAsset.updateMany({ where: { merchantId: merchant.id, id: { in: assetIds } }, data: { merchantSessionId: null } })
          await tx.storeAsset.deleteMany({ where: { merchantId: merchant.id, id: { in: assetIds } } })
        }
        await tx.merchantSession.deleteMany({ where: { merchantId: merchant.id, id: { in: sessionIds } } })
      } else {
        await tx.storeAbuseCounter.deleteMany({ where: { merchantId: merchant.id } })
        if (assetIds.length) {
          await tx.storeAsset.updateMany({ where: { merchantId: merchant.id, id: { in: assetIds } }, data: { merchantSessionId: null } })
          await tx.storeAsset.deleteMany({ where: { merchantId: merchant.id, id: { in: assetIds } } })
        }
      }

      const after = {
        sessions: await tx.merchantSession.count({ where: { merchantId: merchant.id } }),
        photoAssets: await tx.storeAsset.count({ where: { merchantId: merchant.id, OR: [{ merchantSessionId: { not: null } }, { ownerType: 'SESSION' }] } }),
        storeEvents: sessionIds.length ? await tx.merchantEvent.count({ where: { merchantId: merchant.id, merchantSessionId: { in: sessionIds } } }) : 0,
        intents: sessionIds.length ? await tx.merchantIntent.count({ where: { merchantId: merchant.id, merchantSessionId: { in: sessionIds } } }) : 0,
        tryOnTasks: taskIds.length ? await tx.tryOnTask.count({ where: { merchantId: merchant.id, id: { in: taskIds } } }) : 0,
        decisionResults: decisionIds.length ? await tx.decisionResult.count({ where: { merchantId: merchant.id, id: { in: decisionIds } } }) : 0,
        decisionShares: decisionIds.length ? await tx.decisionResultShare.count({ where: { merchantId: merchant.id, decisionResultId: { in: decisionIds } } }) : 0,
        usageLedger: sessionIds.length || taskIds.length ? await tx.merchantUsageLedger.count({ where: { merchantId: merchant.id, OR: [{ merchantSessionId: { in: sessionIds } }, { tryOnTaskId: { in: taskIds } }] } }) : 0,
        sponsoredUsage: sessionIds.length ? await tx.merchantSponsoredUsage.count({ where: { merchantId: merchant.id, merchantSessionId: { in: sessionIds } } }) : 0,
        generationRequests: await tx.generationRequest.count({
          where: localDemoTryOnTaskScope(merchant.id, taskIds),
        }),
        generationAttempts: generationRequestIds.length ? await tx.generationAttempt.count({ where: { requestId: { in: generationRequestIds } } }) : 0,
        orphanBlobs: await tx.storeOrphanBlob.count({
          where: localDemoTryOnTaskScope(merchant.id, taskIds),
        }),
        abuseCounters: await tx.storeAbuseCounter.count({ where: { merchantId: merchant.id } }),
        firstShopperMilestones: await tx.merchantActivationEvent.count({ where: { merchantId: merchant.id, eventType: 'merchant_first_shopper_session' } }),
      }
      if (Object.values(after).some((count) => count !== 0)) {
        throw new Error('Shopper reset verification failed; transaction will roll back.')
      }

      const preserved = {
        merchant: await tx.merchant.count({ where: { id: merchant.id, slug: 'visutry-demo-optical', classification: 'TEST' } }),
        stores: await tx.experience.count({ where: { merchantId: merchant.id, type: 'STORE', slug: 'store', status: 'ACTIVE' } }),
        products: await tx.merchantFrame.count({ where: { merchantId: merchant.id } }),
        selectedProducts: await tx.experienceFrame.count({ where: { merchantId: merchant.id, experienceId: store.id, active: true } }),
      }
      if (preserved.merchant !== 1 || preserved.stores !== 1 || preserved.products !== 10 || preserved.selectedProducts !== 10) {
        throw new Error('Reset changed the protected Merchant/Store/catalog fixture invariant; transaction will roll back.')
      }
      return {
        merchantId: merchant.id,
        classification: merchant.classification,
        before,
        after,
        preserved,
        mediaReferences: [...mediaReferences],
        taskIds,
      }
    }, { maxWait: 10_000, timeout: 30_000 })

    // The filesystem store cannot participate in the database transaction.
    // Enumerate only the dedicated Merchant's exact shopper namespaces after
    // DB commit, union those objects with durable row references, then delete
    // and verify. If interrupted, rerunning reset discovers leftovers by
    // prefix even when their DB rows have already been removed.
    const diskMediaBefore = await listScopedLocalMedia(result.merchantId)
    const mediaToDelete = [...new Set([...result.mediaReferences, ...diskMediaBefore])]
    for (const pathname of mediaToDelete) assertLocalDemoShopperMediaPathname(pathname, result.merchantId)
    if (mediaToDelete.length) await MockBlob.del(mediaToDelete)

    const mediaRemaining: string[] = []
    for (const pathname of mediaToDelete) {
      if (await readMockBlob(pathname)) mediaRemaining.push(pathname)
    }
    const scopedMediaAfter = await listScopedLocalMedia(result.merchantId)
    if (mediaRemaining.length || scopedMediaAfter.length) {
      throw new Error(`Local shopper media reset verification failed; remaining objects=${[...new Set([...mediaRemaining, ...scopedMediaAfter])].length}. Rerun the bounded reset.`)
    }

    const finalDbState = await prisma.$transaction(async (tx) => {
      const merchant = await tx.merchant.findUniqueOrThrow({
        where: { id: result.merchantId },
        select: { id: true },
      })
      const sessions = await tx.merchantSession.count({ where: { merchantId: merchant.id } })
      const tasks = await tx.tryOnTask.count({ where: { merchantId: merchant.id, origin: { in: ['STORE_DEMO', 'STORE_PILOT'] } } })
      const decisions = await tx.decisionResult.count({ where: { merchantId: merchant.id } })
      const shopperAssets = await tx.storeAsset.count({
        where: { merchantId: merchant.id, OR: [{ merchantSessionId: { not: null } }, { ownerType: 'SESSION' }] },
      })
      const remainingOrphanRows = await tx.storeOrphanBlob.findMany({
        where: { merchantId: merchant.id },
        select: { tryOnTaskId: true, url: true, pathname: true },
      })
      const taskIdSet = new Set(result.taskIds)
      const shopperOrphans = remainingOrphanRows.filter((row) =>
        taskIdSet.has(row.tryOnTaskId || '')
        || Boolean(localDemoShopperMediaPathnameFromReference(row.pathname, merchant.id))
        || Boolean(localDemoShopperMediaPathnameFromReference(row.url, merchant.id)),
      ).length
      const preserved = {
        merchant: await tx.merchant.count({ where: { id: merchant.id, slug: 'visutry-demo-optical', classification: 'TEST' } }),
        stores: await tx.experience.count({ where: { merchantId: merchant.id, type: 'STORE', slug: 'store', status: 'ACTIVE' } }),
        products: await tx.merchantFrame.count({ where: { merchantId: merchant.id } }),
        selectedProducts: await tx.experienceFrame.count({ where: { merchantId: merchant.id, active: true } }),
      }
      return { sessions, tasks, decisions, shopperAssets, shopperOrphans, preserved }
    })
    if (finalDbState.sessions || finalDbState.tasks || finalDbState.decisions || finalDbState.shopperAssets || finalDbState.shopperOrphans
      || finalDbState.preserved.merchant !== 1 || finalDbState.preserved.stores !== 1
      || finalDbState.preserved.products !== 10 || finalDbState.preserved.selectedProducts !== 10) {
      throw new Error('Final Local Demo reset verification failed: shopper DB state must be zero while the canonical Merchant/Store/10-product fixture remains.')
    }

    console.log('LOCAL DEMO SHOPPER SESSION RESET')
    console.log('environment: LOCAL')
    console.log(`merchantId: ${result.merchantId}`)
    console.log(`classification: ${result.classification}`)
    printCounts('before shopper state', result.before)
    console.log('action: cleared shopper sessions, related assets/events/intents/usage/results/tasks, abuse counters, and first-shopper milestone; preserved Merchant/Store/catalog.')
    printCounts('after shopper state', result.after)
    printCounts('preserved fixture', result.preserved)
    console.log(`local shopper media: before=${diskMediaBefore.length} references=${result.mediaReferences.length} deleted=${mediaToDelete.length} after=${scopedMediaAfter.length}`)
    printCounts('final database verification', {
      sessions: finalDbState.sessions,
      shopperTryOnTasks: finalDbState.tasks,
      decisionResults: finalDbState.decisions,
      shopperAssets: finalDbState.shopperAssets,
      shopperOrphans: finalDbState.shopperOrphans,
      merchant: finalDbState.preserved.merchant,
      stores: finalDbState.preserved.stores,
      products: finalDbState.preserved.products,
      selectedProducts: finalDbState.preserved.selectedProducts,
    })
    console.log('PASS')
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exitCode = 1
})
