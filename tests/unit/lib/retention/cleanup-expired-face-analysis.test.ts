import { del } from '@vercel/blob'
import { prisma } from '@/lib/prisma'
import { cleanupExpiredFaceAnalysis, deleteFaceAnalysisBlobFirst } from '@/lib/retention/cleanup-expired-face-analysis'

jest.mock('@vercel/blob', () => ({ del: jest.fn() }))
jest.mock('@/lib/prisma', () => ({ prisma: { faceAnalysisTask: {
  findMany: jest.fn(), update: jest.fn(), delete: jest.fn(),
} } }))
jest.mock('@/lib/logger', () => ({ logger: { warn: jest.fn(), error: jest.fn() } }))
jest.mock('@/lib/mocks', () => ({ isMockMode: false }))

const mockedDel = del as jest.Mock
const tasks = prisma.faceAnalysisTask
const mockFindMany = tasks.findMany as jest.Mock
const mockUpdate = tasks.update as jest.Mock
const mockDelete = tasks.delete as jest.Mock

function faceTask(overrides: Record<string, unknown> = {}) {
  return {
    id: 'face-1', userId: 'user-1',
    userImageUrl: 'https://store.public.blob.vercel-storage.com/face-analysis/user/photo.jpg',
    metadata: { blobPathname: 'face-analysis/user/photo.jpg' },
    retentionStatus: 'ACTIVE', deleteFailCount: 0,
    ...overrides,
  }
}

function queue(active: unknown[] = [], blocked: unknown[] = []) {
  mockFindMany.mockImplementation(async ({ where }: { where: { retentionStatus: unknown } }) =>
    where.retentionStatus === 'DELETE_BLOCKED' ? blocked : active,
  )
}

describe('Face Analysis expiry / Blob-first retention', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    process.env.BLOB_READ_WRITE_TOKEN = 'public-token'
    process.env.RPIVATE_BLOB_READ_WRITE_TOKEN = 'private-token'
    process.env.FACE_ANALYSIS_BLOB_ACCESS_MODE = 'private'
    mockedDel.mockResolvedValue(undefined)
    mockUpdate.mockResolvedValue({})
    mockDelete.mockResolvedValue({})
  })
  afterEach(() => {
    delete process.env.BLOB_READ_WRITE_TOKEN
    delete process.env.RPIVATE_BLOB_READ_WRITE_TOKEN
    delete process.env.FACE_ANALYSIS_BLOB_ACCESS_MODE
  })

  it('deletes expired historical public photo with public token, then DB row', async () => {
    queue([faceTask()])
    const result = await cleanupExpiredFaceAnalysis({ maxRounds: 1 })
    expect(result).toMatchObject({ deleted: 1, failed: 0, deletedUserIds: ['user-1'] })
    expect(mockedDel).toHaveBeenCalledWith(faceTask().userImageUrl, { token: 'public-token' })
    expect(mockDelete).toHaveBeenCalledWith({ where: { id: 'face-1' } })
    expect(mockedDel.mock.invocationCallOrder[0]).toBeLessThan(mockDelete.mock.invocationCallOrder[0])
  })

  it('uses private token for private photo regardless of current or historical access mode', async () => {
    const task = faceTask({ userImageUrl: 'https://store.private.blob.vercel-storage.com/face-analysis/u/a.jpg' })
    queue([task])
    const result = await cleanupExpiredFaceAnalysis({ maxRounds: 1 })
    expect(result.deleted).toBe(1)
    expect(mockedDel).toHaveBeenCalledWith(task.userImageUrl, { token: 'private-token' })
  })

  it('leaves DB row retryable after Blob failure, then recovers on blocked retry', async () => {
    mockedDel.mockRejectedValue(new Error('Access denied'))
    queue([faceTask({ deleteFailCount: 9 })])
    const result = await cleanupExpiredFaceAnalysis({ maxRounds: 1 })
    expect(result).toMatchObject({ deleted: 0, failed: 1 })
    expect(mockDelete).not.toHaveBeenCalled()
    expect(mockUpdate).toHaveBeenLastCalledWith(expect.objectContaining({
      data: expect.objectContaining({ retentionStatus: 'DELETE_BLOCKED', deleteFailCount: 10 }),
    }))

    mockedDel.mockResolvedValue(undefined)
    queue([], [faceTask({ retentionStatus: 'DELETE_BLOCKED', deleteFailCount: 10 })])
    const recovered = await cleanupExpiredFaceAnalysis({ maxRounds: 1 })
    expect(recovered).toMatchObject({ deleted: 1, blockedRetried: 1 })
  })

  it('treats already missing blobs as deleted', async () => {
    mockedDel.mockRejectedValue(new Error('Blob not found'))
    queue([faceTask()])
    const result = await cleanupExpiredFaceAnalysis({ maxRounds: 1 })
    expect(result.deleted).toBe(1)
  })

  it('does not delete an unrecognized media URL or any DB record', async () => {
    await expect(deleteFaceAnalysisBlobFirst(faceTask({
      userImageUrl: 'https://cdn.example.com/face-analysis/u/photo.jpg', metadata: {},
    }))).rejects.toThrow('Unrecognized Face Analysis media')
    expect(mockedDel).not.toHaveBeenCalled()
    expect(mockDelete).not.toHaveBeenCalled()
  })

  it('fails closed without the appropriate token', async () => {
    delete process.env.BLOB_READ_WRITE_TOKEN
    queue([faceTask()])
    const result = await cleanupExpiredFaceAnalysis({ maxRounds: 1 })
    expect(result.failed).toBe(1)
    expect(mockedDel).not.toHaveBeenCalled()
    expect(mockDelete).not.toHaveBeenCalled()
  })

  it('selects only expired tasks and respects retry backoff', async () => {
    queue()
    const now = new Date('2026-10-31T10:00:00Z')
    await cleanupExpiredFaceAnalysis({ now, maxRounds: 1 })
    expect(mockFindMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ expiresAt: { lte: now }, retentionStatus: { in: ['ACTIVE', 'PENDING_DELETE'] } }),
    }))
  })
})
