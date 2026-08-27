/**
 * ADR-007 Consumer stability regression suite.
 * Required evidence for Store PRs that touch shared generation/poll/retention/quota/cron.
 */

import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs'
import { join, relative } from 'node:path'
import { submitTryOnTask, getTryOnResult } from '@/lib/tryon-service'
import { prisma } from '@/lib/prisma'
import { pollTaskResult, submitAsyncTask } from '@/lib/grsai'
import { put } from '@vercel/blob'
import {
  __resetStoreGrsaiSucceededPersistHandlerForTests,
  getStoreGrsaiSucceededPersistHandler,
  registerStoreGrsaiSucceededPersistHandler,
} from '@/lib/generation/tryon-result-persist'
import { collectTryOnRetentionDeleteTargets } from '@/lib/retention/tryon-retention-targets'

jest.mock('@prisma/client', () => ({
  TaskStatus: {
    PENDING: 'PENDING',
    PROCESSING: 'PROCESSING',
    COMPLETED: 'COMPLETED',
    FAILED: 'FAILED',
  },
  TryOnType: {
    GLASSES: 'GLASSES',
  },
}))

jest.mock('@/lib/prisma', () => ({
  prisma: {
    tryOnTask: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    user: {
      update: jest.fn(),
      findUnique: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}))

jest.mock('@vercel/blob', () => ({
  put: jest.fn(),
}))

jest.mock('@/lib/grsai', () => ({
  submitAsyncTask: jest.fn(),
  pollTaskResult: jest.fn(),
}))

jest.mock('@/lib/gemini', () => ({
  generateTryOnImage: jest.fn(),
}))

jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}))

jest.mock('next/cache', () => ({
  revalidateTag: jest.fn(),
}))

const TaskStatus = {
  PENDING: 'PENDING',
  PROCESSING: 'PROCESSING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
}

function walkTsFiles(dir: string, acc: string[] = []): string[] {
  if (!existsSync(dir)) return acc
  for (const name of readdirSync(dir)) {
    const full = join(dir, name)
    const st = statSync(full)
    if (st.isDirectory()) {
      if (name === 'node_modules' || name === '.next' || name === 'store' || name === 'merchant' || name === 'admin') continue
      walkTsFiles(full, acc)
    } else if (/\.(ts|tsx)$/.test(name)) {
      acc.push(full)
    }
  }
  return acc
}

/**
 * Authoritative Consumer→Store import allowlist (ADR-007).
 * Discover is a Commerce discovery surface that may live under `(main)` for
 * URL/SEO reasons while calling Store application services.
 */
const CONSUMER_STORE_IMPORT_ALLOWLIST = new Set([
  'src/app/[locale]/(main)/discover/page.tsx',
  'src/components/discover/DiscoverPage.tsx',
])

/** Broad roots — fail closed for newly added Consumer paths. */
const CONSUMER_BOUNDARY_ROOTS = [
  'src/app/[locale]/(main)',
  'src/app/api',
  'src/components',
  'src/lib',
  'src/config',
  'src/hooks',
]

/**
 * Non-Consumer / Store-adapter exclusions. Keep this list tiny and explicit.
 * Everything else under the broad roots is treated as Consumer-boundary.
 */
const NON_CONSUMER_PATH_PREFIXES = [
  'src/app/api/store/',
  'src/app/api/merchant/',
  'src/app/api/agent/',
  'src/app/api/admin/',
  'src/app/api/mcp/',
  'src/app/api/business/',
  'src/app/api/cron/cleanup-store-assets/',
  'src/app/api/cron/sync-pending-store-tasks/',
  // Combined cron isolates Store failure; it intentionally references Store.
  'src/app/api/cron/sync-pending-tasks/',
  'src/components/store/',
  'src/components/merchant/',
  'src/components/admin/',
  'src/lib/store-discovery-',
  'src/lib/merchant-skill',
  'src/lib/agent-distribution',
  'src/lib/cron/sync-pending-store-tasks',
]

function isNonConsumerPath(rel: string): boolean {
  return NON_CONSUMER_PATH_PREFIXES.some((prefix) =>
    prefix.endsWith('/') ? rel.startsWith(prefix) || rel === prefix.slice(0, -1) : rel === prefix || rel.startsWith(prefix),
  )
}

function collectConsumerBoundaryFiles(cwd: string): string[] {
  const files: string[] = []
  for (const root of CONSUMER_BOUNDARY_ROOTS) {
    const absolute = join(cwd, root)
    if (!existsSync(absolute)) continue
    const st = statSync(absolute)
    if (st.isDirectory()) walkTsFiles(absolute, files)
    else files.push(absolute)
  }
  return files.filter((file) => !isNonConsumerPath(relative(cwd, file).replaceAll('\\', '/')))
}

describe('ADR-007 Consumer stability boundary', () => {
  const mockUser = {
    id: 'user-1',
    isPremium: false,
    premiumExpiresAt: null,
    creditsPurchased: 0,
    creditsUsed: 0,
  }

  const mockFile = {
    name: 'face.jpg',
    type: 'image/jpeg',
    arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(8)),
  } as unknown as File

  beforeEach(() => {
    jest.clearAllMocks()
    __resetStoreGrsaiSucceededPersistHandlerForTests()
    ;(put as jest.Mock).mockImplementation((path: string) => ({
      url: `https://blob.vercel-storage.com/${path}`,
    }))
    ;(submitAsyncTask as jest.Mock).mockResolvedValue('ext-1')
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      blob: jest.fn().mockResolvedValue(new Blob(['fake'], { type: 'image/png' })),
    }) as any
  })

  it('Consumer Try-On submission creates CONSUMER task with userId and no merchant attribution', async () => {
    ;(prisma.tryOnTask.create as jest.Mock).mockResolvedValue({
      id: 'consumer-task-1',
      status: TaskStatus.PENDING,
      userId: 'user-1',
      metadata: { serviceType: 'grsai', isAsync: true },
    })
    ;(prisma.tryOnTask.update as jest.Mock).mockResolvedValue({})

    await submitTryOnTask(mockUser as any, mockFile, mockFile, 'GLASSES')

    expect(prisma.tryOnTask.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: 'user-1',
        origin: 'CONSUMER',
        retentionStatus: 'ACTIVE',
        expiresAt: expect.any(Date),
      }),
    })
    const createData = (prisma.tryOnTask.create as jest.Mock).mock.calls[0][0].data
    expect(createData.merchantId).toBeUndefined()
    expect(createData.merchantSessionId).toBeUndefined()
    expect(createData.merchantFrameId).toBeUndefined()
  })

  it('Consumer success completes and returns a usable result', async () => {
    ;(prisma.tryOnTask.findUnique as jest.Mock)
      .mockResolvedValueOnce({
        id: 'task-1',
        origin: 'CONSUMER',
        userId: 'user-1',
        merchantId: null,
        status: TaskStatus.PROCESSING,
        userImageUrl: 'https://blob/user.jpg',
        itemImageUrl: 'https://blob/item.jpg',
        metadata: { serviceType: 'grsai', externalTaskId: 'ext-1', retryCount: 0 },
      })
      .mockResolvedValueOnce({
        status: TaskStatus.PROCESSING,
        resultImageUrl: null,
        metadata: {},
        resultPersistLeaseOwner: null,
        resultPersistLeaseUntil: null,
        resultPersistVersion: 0,
      })
    ;(pollTaskResult as jest.Mock).mockResolvedValue({
      status: 'succeeded',
      imageUrl: 'https://provider/result.png',
      progress: 100,
      metadata: {},
    })
    ;(prisma.tryOnTask.updateMany as jest.Mock).mockResolvedValue({ count: 1 })

    const result = await getTryOnResult('task-1')

    expect(result.status).toBe(TaskStatus.COMPLETED)
    expect(result.resultImageUrl).toBeTruthy()
    expect(result.isNewCompletion).toBe(true)
  })

  it('Consumer async polling remains functional when Store persist registration is absent / fails', async () => {
    expect(getStoreGrsaiSucceededPersistHandler()).toBeNull()

    ;(prisma.tryOnTask.findUnique as jest.Mock)
      .mockResolvedValueOnce({
        id: 'task-consumer',
        origin: 'CONSUMER',
        userId: 'user-1',
        merchantId: null,
        status: TaskStatus.PROCESSING,
        userImageUrl: 'https://blob/user.jpg',
        itemImageUrl: 'https://blob/item.jpg',
        metadata: { serviceType: 'grsai', externalTaskId: 'ext-c', retryCount: 0 },
      })
      .mockResolvedValueOnce({
        status: TaskStatus.PROCESSING,
        resultImageUrl: null,
        metadata: {},
        resultPersistLeaseOwner: null,
        resultPersistLeaseUntil: null,
        resultPersistVersion: 0,
      })
    ;(pollTaskResult as jest.Mock).mockResolvedValue({
      status: 'succeeded',
      imageUrl: 'https://provider/result.png',
      progress: 100,
    })
    ;(prisma.tryOnTask.updateMany as jest.Mock).mockResolvedValue({ count: 1 })

    const result = await getTryOnResult('task-consumer')
    expect(result.status).toBe(TaskStatus.COMPLETED)

    // Store task without handler must not complete via Consumer provider-URL fallback
    ;(prisma.tryOnTask.findUnique as jest.Mock)
      .mockResolvedValueOnce({
        id: 'task-store',
        origin: 'STORE_DEMO',
        userId: null,
        merchantId: 'm1',
        status: TaskStatus.PROCESSING,
        userImageUrl: 'pending://user',
        itemImageUrl: 'pending://item',
        metadata: { serviceType: 'grsai', externalTaskId: 'ext-s', retryCount: 0 },
      })
      .mockResolvedValueOnce({
        status: TaskStatus.PROCESSING,
        resultImageUrl: null,
        metadata: {},
        resultPersistLeaseOwner: null,
        resultPersistLeaseUntil: null,
        resultPersistVersion: 0,
      })

    const storeResult = await getTryOnResult('task-store')
    expect(storeResult.status).toBe(TaskStatus.PROCESSING)
    expect(prisma.tryOnTask.updateMany).toHaveBeenCalledTimes(2) // Consumer claim + completion; Store handler is absent
  })

  it('Store completion handler never mutates Consumer counters (settlement stays separate)', async () => {
    const consumerUpdate = jest.fn()
    registerStoreGrsaiSucceededPersistHandler(async () => {
      // Store handler must not touch User counters
      expect(consumerUpdate).not.toHaveBeenCalled()
      return {
        status: TaskStatus.COMPLETED as any,
        resultImageUrl: 'https://blob/store-result.png',
        progress: 100,
        isNewCompletion: true,
      }
    })

    ;(prisma.tryOnTask.findUnique as jest.Mock)
      .mockResolvedValueOnce({
        id: 'task-store-2',
        origin: 'STORE_DEMO',
        userId: null,
        merchantId: 'm1',
        status: TaskStatus.PROCESSING,
        metadata: { serviceType: 'grsai', externalTaskId: 'ext-s2', retryCount: 0 },
      })
      .mockResolvedValueOnce({
        status: TaskStatus.PROCESSING,
        resultImageUrl: null,
        metadata: {},
        resultPersistLeaseOwner: null,
        resultPersistLeaseUntil: null,
        resultPersistVersion: 0,
      })
    ;(pollTaskResult as jest.Mock).mockResolvedValue({
      status: 'succeeded',
      imageUrl: 'https://provider/result.png',
      progress: 100,
    })

    const result = await getTryOnResult('task-store-2')
    expect(result.status).toBe(TaskStatus.COMPLETED)
    expect(prisma.user.update).not.toHaveBeenCalled()
  })

  it('Consumer quota settlement remains a separate Consumer policy module', () => {
    const quotaSource = readFileSync(join(process.cwd(), 'src/lib/quota.ts'), 'utf8')
    expect(quotaSource).toContain('settleTryOnTaskQuota')
    expect(quotaSource).not.toContain('modules/store')
    expect(quotaSource).not.toContain('MerchantUsage')
  })

  it('Consumer result persistence falls back to provider URL when blob upload fails', async () => {
    ;(prisma.tryOnTask.findUnique as jest.Mock)
      .mockResolvedValueOnce({
        id: 'task-fallback',
        origin: 'CONSUMER',
        userId: 'user-1',
        merchantId: null,
        status: TaskStatus.PROCESSING,
        metadata: { serviceType: 'grsai', externalTaskId: 'ext-f', retryCount: 0 },
      })
      .mockResolvedValueOnce({
        status: TaskStatus.PROCESSING,
        resultImageUrl: null,
        metadata: {},
        resultPersistLeaseOwner: null,
        resultPersistLeaseUntil: null,
        resultPersistVersion: 0,
      })
    ;(pollTaskResult as jest.Mock).mockResolvedValue({
      status: 'succeeded',
      imageUrl: 'https://provider/fallback.png',
      progress: 100,
    })
    ;(put as jest.Mock).mockRejectedValue(new Error('blob unavailable'))
    ;(prisma.tryOnTask.updateMany as jest.Mock).mockResolvedValue({ count: 1 })

    const result = await getTryOnResult('task-fallback')
    expect(result.status).toBe(TaskStatus.COMPLETED)
    expect(result.resultImageUrl).toBe('https://provider/fallback.png')
  })

  it('shared retention targets collect Consumer and Store blob refs without Store imports', () => {
    const targets = collectTryOnRetentionDeleteTargets({
      userImageUrl: 'https://blob.vercel-storage.com/tryon/user/u1/a.jpg',
      itemImageUrl: 'https://blob.vercel-storage.com/tryon/item/u1/b.jpg',
      resultImageUrl: 'https://provider.example/should-skip.png',
      metadata: {
        resultPathname: 'tryon/result/u1/task.png',
      },
    })
    expect(targets).toEqual([
      'https://blob.vercel-storage.com/tryon/user/u1/a.jpg',
      'https://blob.vercel-storage.com/tryon/item/u1/b.jpg',
      'tryon/result/u1/task.png',
    ])
  })

  it('Consumer boundary must not import modules/store except the authoritative allowlist', () => {
    const cwd = process.cwd()
    const files = collectConsumerBoundaryFiles(cwd)
    expect(files.length).toBeGreaterThan(50)

    const violations: string[] = []
    for (const file of files) {
      const rel = relative(cwd, file).replaceAll('\\', '/')
      if (CONSUMER_STORE_IMPORT_ALLOWLIST.has(rel)) continue
      const source = readFileSync(file, 'utf8')
      if (source.includes('@/modules/store') || source.includes('modules/store/')) {
        violations.push(rel)
      }
    }

    expect(violations).toEqual([])
  })

  it('Discover is the only allowlisted Commerce discovery surface under Consumer roots', () => {
    const discover = readFileSync(
      join(process.cwd(), 'src/app/[locale]/(main)/discover/page.tsx'),
      'utf8',
    )
    expect(discover).toContain('modules/store')
    expect([...CONSUMER_STORE_IMPORT_ALLOWLIST].sort()).toEqual([
      'src/app/[locale]/(main)/discover/page.tsx',
      'src/components/discover/DiscoverPage.tsx',
    ].sort())
  })

  it('Frame Compare entrypoint still routes through Consumer submitTryOnTask (no Store dependency)', () => {
    const source = readFileSync(
      join(process.cwd(), 'src/lib/compare-tryon-server.ts'),
      'utf8',
    )
    expect(source).toContain("from '@/lib/tryon-service'")
    expect(source).toContain('submitTryOnTask')
    expect(source).not.toContain('modules/store')
    expect(source).not.toContain('submitStoreTryOnTask')
  })

  it('combined pending sync isolates Store failure from Consumer processing', () => {
    const source = readFileSync(
      join(process.cwd(), 'src/app/api/cron/sync-pending-tasks/route.ts'),
      'utf8',
    )
    expect(source).toContain('syncPendingConsumerTryOnTasks')
    expect(source).toContain('consumerError')
    expect(source).toContain('storeError')
    // Store sync is dynamically imported so a Store module throw cannot
    // prevent Consumer catch block from existing independently.
    expect(source).toMatch(/try \{[\s\S]*syncPendingConsumerTryOnTasks[\s\S]*\} catch/)
    expect(source).toMatch(/try \{[\s\S]*syncPendingStoreTryOnTasks[\s\S]*\} catch/)
  })

  it('cleanup route batches Consumer and Store origins separately', () => {
    const source = readFileSync(
      join(process.cwd(), 'src/app/api/cron/cleanup-expired-tasks/route.ts'),
      'utf8',
    )
    expect(source).toContain("origins: ['CONSUMER']")
    expect(source).toContain("origins: ['STORE_DEMO', 'STORE_PILOT']")
  })

  it('Store pending sync helper lives under modules/store (not shared Consumer cron core)', () => {
    const storeCron = readFileSync(
      join(
        process.cwd(),
        'src/modules/store/infrastructure/cron/sync-pending-store-tasks.ts',
      ),
      'utf8',
    )
    expect(storeCron).toContain('syncPendingStoreTryOnTasks')
    expect(storeCron).toContain('settleStoreTryOnUsage')
    expect(storeCron).not.toContain('settleTryOnTaskQuota')

    const consumerCron = readFileSync(
      join(process.cwd(), 'src/lib/cron/sync-pending-consumer-tasks.ts'),
      'utf8',
    )
    expect(consumerCron).toContain("origin: 'CONSUMER'")
    expect(consumerCron).not.toContain('modules/store')
  })
})
