const mockFindUnique = jest.fn()
const mockUpdate = jest.fn()
const mockUpdateMany = jest.fn()
const mockPut = jest.fn()
const mockPollTaskResult = jest.fn()

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
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
      update: (...args: unknown[]) => mockUpdate(...args),
      updateMany: (...args: unknown[]) => mockUpdateMany(...args),
      create: jest.fn(),
    },
  },
}))

jest.mock('@vercel/blob', () => ({
  put: (...args: unknown[]) => mockPut(...args),
}))

jest.mock('@/lib/grsai', () => ({
  submitAsyncTask: jest.fn(),
  pollTaskResult: (...args: unknown[]) => mockPollTaskResult(...args),
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

jest.mock('@/lib/generation/reconcile-stale-consumer-dispatch', () => ({
  reconcileStaleConsumerDispatch: jest.fn().mockResolvedValue(false),
  STALE_CONSUMER_DISPATCH_ERROR: 'stale',
}))

jest.mock('@/lib/generation/tryon-result-persist', () => ({
  isStoreTryOnOrigin: jest.fn().mockReturnValue(false),
  getStoreGrsaiSucceededPersistHandler: jest.fn(),
}))

jest.mock('@/lib/tryon-media-loader', () => ({
  tryOnProviderMediaInput: jest.fn(async (value: string) => value),
}))

import { getTryOnResult } from '@/lib/tryon-service'

const PRIVATE_ENV_KEYS = [
  'TRY_ON_BLOB_ACCESS_MODE',
  'TRY_ON_BLOB_STORE_ID',
  'FACE_ANALYSIS_BLOB_ACCESS_MODE',
  'FACE_ANALYSIS_BLOB_STORE_ID',
] as const

describe('Try-On result privacy persistence', () => {
  const originalEnv: Partial<Record<(typeof PRIVATE_ENV_KEYS)[number], string | undefined>> = {}
  const originalFetch = global.fetch

  beforeAll(() => {
    for (const key of PRIVATE_ENV_KEYS) originalEnv[key] = process.env[key]
  })

  beforeEach(() => {
    jest.clearAllMocks()
    for (const key of PRIVATE_ENV_KEYS) delete process.env[key]
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      blob: jest.fn().mockResolvedValue(new Blob(['result'], { type: 'image/png' })),
    }) as any
  })

  afterAll(() => {
    global.fetch = originalFetch
    for (const key of PRIVATE_ENV_KEYS) {
      const value = originalEnv[key]
      if (value === undefined) delete process.env[key]
      else process.env[key] = value
    }
  })

  function prepareSucceededPoll() {
    const task = {
      id: 'task-private-result',
      userId: 'user-1',
      merchantId: null,
      origin: 'CONSUMER',
      type: 'GLASSES',
      status: 'PROCESSING',
      resultImageUrl: null,
      errorMessage: null,
      metadata: {
        serviceType: 'grsai',
        externalTaskId: 'external-1',
        retryCount: 0,
      },
    }

    mockFindUnique
      .mockResolvedValueOnce(task)
      .mockResolvedValueOnce({
        status: 'PROCESSING',
        resultImageUrl: null,
        metadata: task.metadata,
        resultPersistLeaseOwner: null,
        resultPersistLeaseUntil: null,
        resultPersistVersion: 0,
      })
    mockPollTaskResult.mockResolvedValue({
      status: 'succeeded',
      progress: 100,
      imageUrl: 'https://provider.example.com/result.png',
      metadata: { description: 'done' },
    })
    mockUpdateMany.mockResolvedValue({ count: 1 })
  }

  it('persists a new consumer result privately when private policy is enabled', async () => {
    process.env.TRY_ON_BLOB_ACCESS_MODE = 'private'
    process.env.TRY_ON_BLOB_STORE_ID = 'store_tryon'
    prepareSucceededPoll()
    mockPut.mockResolvedValue({
      url: 'https://abc.private.blob.vercel-storage.com/tryon/result/user-1/task-private-result.png',
    })

    const result = await getTryOnResult('task-private-result')

    expect(mockPut).toHaveBeenCalledWith(
      'tryon/result/user-1/task-private-result.png',
      expect.any(File),
      { access: 'private', storeId: 'store_tryon' },
    )
    expect(mockUpdateMany).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        status: 'COMPLETED',
        resultImageUrl: expect.stringContaining('.private.blob.vercel-storage.com/'),
        metadata: expect.objectContaining({
          privateBlob: true,
          privatePersistPending: false,
          privatePersistError: null,
        }),
      }),
    }))
    expect(result).toMatchObject({
      status: 'COMPLETED',
      isNewCompletion: true,
    })
  })

  it('never falls back to a provider URL when private result persistence fails', async () => {
    process.env.TRY_ON_BLOB_ACCESS_MODE = 'private'
    process.env.TRY_ON_BLOB_STORE_ID = 'store_tryon'
    prepareSucceededPoll()
    mockPut.mockRejectedValue(new Error('private blob unavailable'))

    const result = await getTryOnResult('task-private-result')

    expect(result).toEqual({
      status: 'PROCESSING',
      progress: 100,
      isNewCompletion: false,
    })
    expect(mockUpdateMany).not.toHaveBeenCalled()
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: 'task-private-result' },
      data: expect.objectContaining({
        status: 'PROCESSING',
        errorMessage: null,
        metadata: expect.objectContaining({
          privateBlob: true,
          privatePersistPending: true,
          privatePersistError: 'private blob unavailable',
        }),
      }),
    })
    const serializedCalls = JSON.stringify(mockUpdate.mock.calls)
    expect(serializedCalls).not.toContain('resultImageUrl')
    expect(serializedCalls).not.toContain('https://provider.example.com/result.png\"')
  })

  it('retains the legacy provider-URL fallback only in public mode', async () => {
    prepareSucceededPoll()
    mockPut.mockRejectedValue(new Error('public blob unavailable'))

    const result = await getTryOnResult('task-private-result')

    expect(mockUpdateMany).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        status: 'COMPLETED',
        resultImageUrl: 'https://provider.example.com/result.png',
        metadata: expect.objectContaining({
          privateBlob: false,
          privatePersistPending: false,
        }),
      }),
    }))
    expect(result).toMatchObject({
      status: 'COMPLETED',
      resultImageUrl: 'https://provider.example.com/result.png',
    })
  })
})
