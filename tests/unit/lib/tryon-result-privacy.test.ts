const mockFindUnique = jest.fn()
const mockUpdate = jest.fn()
const mockUpdateMany = jest.fn()
const mockPut = jest.fn()
const mockHead = jest.fn()
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
  head: (...args: unknown[]) => mockHead(...args),
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
    mockHead.mockReset()
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

    expect(mockPut).toHaveBeenCalledTimes(1)
    expect(mockPut).toHaveBeenCalledWith(
      'tryon/result/user-1/task-private-result.png',
      expect.any(File),
      { access: 'private', storeId: 'store_tryon' },
    )
    expect(mockUpdateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        id: 'task-private-result',
        resultPersistVersion: 0,
      }),
      data: expect.objectContaining({
        resultPersistLeaseOwner: expect.any(String),
        resultPersistLeaseUntil: expect.any(Date),
        resultPersistVersion: { increment: 1 },
      }),
    }))
    expect(mockUpdateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        id: 'task-private-result',
        status: { not: 'COMPLETED' },
        resultPersistLeaseOwner: expect.any(String),
        resultPersistVersion: 1,
      }),
      data: expect.objectContaining({
        status: 'COMPLETED',
        resultImageUrl: expect.stringContaining('.private.blob.vercel-storage.com/'),
        resultPersistLeaseOwner: null,
        resultPersistLeaseUntil: null,
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

  it('does not download or write the result when another request owns the persistence claim', async () => {
    process.env.TRY_ON_BLOB_ACCESS_MODE = 'private'
    process.env.TRY_ON_BLOB_STORE_ID = 'store_tryon'
    prepareSucceededPoll()
    mockUpdateMany.mockResolvedValueOnce({ count: 0 })
    mockFindUnique.mockResolvedValueOnce({
      status: 'PROCESSING',
      resultImageUrl: null,
    })

    const result = await getTryOnResult('task-private-result')

    expect(result).toEqual({
      status: 'PROCESSING',
      progress: 100,
      isNewCompletion: false,
    })
    expect(global.fetch).not.toHaveBeenCalled()
    expect(mockPut).not.toHaveBeenCalled()
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
    expect(mockUpdate).not.toHaveBeenCalled()
    expect(mockUpdateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        id: 'task-private-result',
        status: { not: 'COMPLETED' },
        resultPersistLeaseOwner: expect.any(String),
        resultPersistVersion: 1,
      }),
      data: expect.objectContaining({
        status: 'PROCESSING',
        errorMessage: null,
        metadata: expect.objectContaining({
          privateBlob: true,
          privatePersistPending: true,
          privatePersistError: 'private blob unavailable',
        }),
      }),
    }))
    const serializedCalls = JSON.stringify(mockUpdateMany.mock.calls)
    expect(serializedCalls).not.toContain('https://provider.example.com/result.png\"')
  })

  it('reconciles a private deterministic Blob already-exists conflict via head', async () => {
    process.env.TRY_ON_BLOB_ACCESS_MODE = 'private'
    process.env.TRY_ON_BLOB_STORE_ID = 'store_tryon'
    prepareSucceededPoll()
    const conflict = new Error('This blob already exists')
    conflict.name = 'BlobPreconditionFailedError'
    mockPut.mockRejectedValue(conflict)
    mockHead.mockResolvedValue({
      url: 'https://abc.private.blob.vercel-storage.com/tryon/result/user-1/task-private-result.png',
    })

    const result = await getTryOnResult('task-private-result')

    expect(mockHead).toHaveBeenCalledWith(
      'tryon/result/user-1/task-private-result.png',
      { storeId: 'store_tryon' },
    )
    expect(mockUpdateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        resultPersistLeaseOwner: expect.any(String),
        resultPersistVersion: 1,
      }),
      data: expect.objectContaining({
        status: 'COMPLETED',
        resultImageUrl: expect.stringContaining('.private.blob.vercel-storage.com/'),
        resultPersistLeaseOwner: null,
        resultPersistLeaseUntil: null,
        metadata: expect.objectContaining({ resultReconciledFromExistingBlob: true }),
      }),
    }))
    expect(result).toMatchObject({
      status: 'COMPLETED',
      resultImageUrl: expect.stringContaining('.private.blob.vercel-storage.com/'),
    })
  })

  it('does not regress a completed task when a stale private persist failure arrives', async () => {
    process.env.TRY_ON_BLOB_ACCESS_MODE = 'private'
    process.env.TRY_ON_BLOB_STORE_ID = 'store_tryon'
    prepareSucceededPoll()
    mockPut.mockRejectedValue(new Error('private blob unavailable'))
    mockUpdateMany
      .mockResolvedValueOnce({ count: 1 })
      .mockResolvedValueOnce({ count: 0 })
    mockFindUnique.mockResolvedValueOnce({
      status: 'COMPLETED',
      resultImageUrl: 'https://abc.private.blob.vercel-storage.com/result.png',
    })

    const result = await getTryOnResult('task-private-result')

    expect(result).toMatchObject({
      status: 'COMPLETED',
      resultImageUrl: 'https://abc.private.blob.vercel-storage.com/result.png',
    })
    expect(mockUpdate).not.toHaveBeenCalled()
  })

  it('retains the legacy provider-URL fallback only in public mode', async () => {
    prepareSucceededPoll()
    mockPut.mockRejectedValue(new Error('public blob unavailable'))

    const result = await getTryOnResult('task-private-result')

    expect(mockUpdateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        resultPersistLeaseOwner: expect.any(String),
        resultPersistVersion: 1,
      }),
      data: expect.objectContaining({
        status: 'COMPLETED',
        resultImageUrl: 'https://provider.example.com/result.png',
        resultPersistLeaseOwner: null,
        resultPersistLeaseUntil: null,
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
