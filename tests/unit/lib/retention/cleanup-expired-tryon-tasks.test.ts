import { del } from '@vercel/blob'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { cleanupExpiredTryOnTasks } from '@/lib/retention/cleanup-expired-tryon-tasks'

jest.mock('@vercel/blob', () => ({
  del: jest.fn(),
}))

jest.mock('@/lib/prisma', () => ({
  prisma: {
    tryOnTask: {
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}))

jest.mock('@/lib/mocks', () => ({
  isMockMode: false,
}))

jest.mock('@/lib/logger', () => ({
  logger: {
    warn: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  },
}))

const mockedDel = del as jest.MockedFunction<typeof del>
const mockedFindMany = prisma.tryOnTask.findMany as jest.Mock
const mockedUpdate = prisma.tryOnTask.update as jest.Mock
const mockedDelete = prisma.tryOnTask.delete as jest.Mock
const mockedWarn = logger.warn as jest.Mock

const PRIVATE_BLOB_TOKEN = 'private-token-for-retention-test'

function makeTask(overrides: Record<string, unknown> = {}) {
  return {
    id: 'task-1',
    userId: 'user-1',
    userImageUrl: 'https://mij4q7mtisfurire.private.blob.vercel-storage.com/tryon/user/photo.jpg',
    itemImageUrl: 'https://mij4q7mtisfurire.private.blob.vercel-storage.com/tryon/item/frame.png',
    glassesImageUrl: null,
    resultImageUrl: 'https://mij4q7mtisfurire.private.blob.vercel-storage.com/tryon/result/result.png',
    deleteFailCount: 0,
    retentionStatus: 'ACTIVE',
    metadata: {},
    ...overrides,
  }
}

function queueTasks(active: unknown[] = [], blocked: unknown[] = []) {
  mockedFindMany.mockImplementation(async ({ where }: { where: { retentionStatus: unknown } }) =>
    where.retentionStatus === 'DELETE_BLOCKED' ? blocked : active,
  )
}

describe('cleanupExpiredTryOnTasks Blob credential binding', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    process.env.RPIVATE_BLOB_READ_WRITE_TOKEN = PRIVATE_BLOB_TOKEN
    mockedUpdate.mockResolvedValue({})
    mockedDelete.mockResolvedValue({})
    mockedDel.mockResolvedValue(undefined)
  })

  afterEach(() => {
    delete process.env.RPIVATE_BLOB_READ_WRITE_TOKEN
  })

  it('deletes canonical Try-On blobs with the explicit private-store token', async () => {
    const task = makeTask()
    queueTasks([task])

    const result = await cleanupExpiredTryOnTasks({ maxRounds: 1 })

    expect(result.deleted).toBe(1)
    expect(mockedDel).toHaveBeenCalledTimes(3)
    expect(mockedDel.mock.calls.every(([, options]) => options?.token === PRIVATE_BLOB_TOKEN)).toBe(true)
    expect(mockedDelete).toHaveBeenCalledWith({ where: { id: task.id } })
  })

  it('never logs the Blob token when deletion fails', async () => {
    const task = makeTask({ deleteFailCount: 9 })
    mockedDel.mockRejectedValue(new Error('Access denied, please provide a valid token for this resource'))
    queueTasks([task])

    await cleanupExpiredTryOnTasks({ maxRounds: 1 })

    expect(JSON.stringify(mockedWarn.mock.calls)).not.toContain(PRIVATE_BLOB_TOKEN)
  })

  it('treats BlobNotFound as successful cleanup', async () => {
    mockedDel.mockRejectedValue(new Error('Blob not found'))
    queueTasks([makeTask()])

    const result = await cleanupExpiredTryOnTasks({ maxRounds: 1 })

    expect(result.deleted).toBe(1)
    expect(result.failed).toBe(0)
    expect(mockedDelete).toHaveBeenCalledTimes(1)
  })

  it('keeps AccessDenied as a failure and does not delete the DB task', async () => {
    mockedDel.mockRejectedValue(new Error('Access denied, please provide a valid token for this resource'))
    queueTasks([makeTask()])

    const result = await cleanupExpiredTryOnTasks({ maxRounds: 1 })

    expect(result.failed).toBe(1)
    expect(mockedDelete).not.toHaveBeenCalled()
    expect(mockedUpdate).toHaveBeenLastCalledWith({
      where: { id: 'task-1' },
      data: expect.objectContaining({
        deleteFailCount: 1,
        retentionStatus: 'PENDING_DELETE',
      }),
    })
  })

  it('enters DELETE_BLOCKED at the existing fail cap', async () => {
    mockedDel.mockRejectedValue(new Error('Access denied'))
    queueTasks([makeTask({ deleteFailCount: 9 })])

    const result = await cleanupExpiredTryOnTasks({ maxRounds: 1 })

    expect(result.failed).toBe(1)
    expect(mockedUpdate).toHaveBeenLastCalledWith({
      where: { id: 'task-1' },
      data: expect.objectContaining({
        deleteFailCount: 10,
        retentionStatus: 'DELETE_BLOCKED',
      }),
    })
    expect(mockedWarn).toHaveBeenCalledWith(
      'api',
      'TryOnTask retention entered DELETE_BLOCKED',
      expect.objectContaining({ taskId: 'task-1', failCount: 10 }),
    )
  })

  it('recovers a DELETE_BLOCKED task after a later successful retry', async () => {
    queueTasks([], [makeTask({ retentionStatus: 'DELETE_BLOCKED', deleteFailCount: 10 })])

    const result = await cleanupExpiredTryOnTasks({ maxRounds: 1 })

    expect(result.blockedRetried).toBe(1)
    expect(result.deleted).toBe(1)
    expect(mockedDelete).toHaveBeenCalledWith({ where: { id: 'task-1' } })
  })

  it('fails closed when the canonical deletion token is not configured', async () => {
    delete process.env.RPIVATE_BLOB_READ_WRITE_TOKEN
    queueTasks([makeTask()])

    const result = await cleanupExpiredTryOnTasks({ maxRounds: 1 })

    expect(result.failed).toBe(1)
    expect(mockedDel).not.toHaveBeenCalled()
    expect(mockedDelete).not.toHaveBeenCalled()
  })

  it('preserves origin filtering used to isolate Consumer and Store cleanup', async () => {
    queueTasks()

    await cleanupExpiredTryOnTasks({ origins: ['CONSUMER'], maxRounds: 1 })

    expect(mockedFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ origin: { in: ['CONSUMER'] } }),
      }),
    )
  })
})
