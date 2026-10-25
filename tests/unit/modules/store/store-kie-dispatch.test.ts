import { submitStoreTryOnTask } from '@/modules/store/infrastructure/generation/submit-store-tryon-task'
import { prisma } from '@/lib/prisma'
import { submitKieTask, KieProviderError } from '@/lib/kie'
import { selectNewTryOnProvider } from '@/lib/generation/kie-routing'
import { mockBlobUpload } from '@/lib/mocks/blob'
import { startGenerationRequest, startGenerationAttempt, markGenerationAttemptSubmitted } from '@/lib/generation/telemetry'
import { resolveStoreAssetAccessPolicy } from '@/modules/store/infrastructure/config/store-asset-access-policy'

jest.mock('@/lib/prisma', () => ({
  prisma: {
    tryOnTask: { create: jest.fn(), findUnique: jest.fn(), findFirst: jest.fn(), updateMany: jest.fn() },
  },
}))
jest.mock('@vercel/blob', () => ({ put: jest.fn(), del: jest.fn() }))
jest.mock('@/lib/grsai', () => ({ submitAsyncTask: jest.fn() }))
jest.mock('@/lib/kie', () => ({
  ...jest.requireActual('@/lib/kie'),
  submitKieTask: jest.fn(),
}))
jest.mock('@/lib/generation/kie-routing', () => ({ selectNewTryOnProvider: jest.fn() }))
jest.mock('@/lib/mocks', () => ({ isMockMode: true }))
jest.mock('@/lib/mocks/blob', () => ({ mockBlobUpload: jest.fn() }))
jest.mock('@/lib/generation/telemetry', () => ({
  startGenerationRequest: jest.fn(),
  startGenerationAttempt: jest.fn(),
  markGenerationAttemptSubmitted: jest.fn(),
  recordGenerationFailure: jest.fn(),
  generationLogFields: jest.fn().mockReturnValue({}),
}))
jest.mock('@/lib/try-on-prompt-registry', () => ({
  resolveTryOnPrompt: jest.fn(() => ({
    detailedInstructions: 'synthetic prompt', renderedPrompt: 'synthetic prompt',
    version: 'tryon-v1', source: 'registry',
  })),
}))
jest.mock('@/modules/store/infrastructure/config/store-asset-access-policy', () => ({
  resolveStoreAssetAccessPolicy: jest.fn(() => ({
    assetAccessMode: 'PUBLIC_TEMPORARY', blobAccess: 'public', publicPoc: true,
  })),
}))
jest.mock('@/lib/logger', () => ({
  logger: { debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}))

const attribution = {
  merchantId: 'merchant-synthetic',
  merchantSessionId: 'session-synthetic',
  merchantFrameId: 'frame-synthetic',
  origin: 'STORE_PILOT' as const,
  idempotencyKey: 'store:session-synthetic:frame-synthetic:request-1',
}

describe('G2-R2 Store Kie dispatch safety (isolated mocks)', () => {
  const created = {
    id: 'task-synthetic',
    status: 'PENDING',
    createdAt: new Date('2026-10-24T01:00:00.000Z'),
    metadata: { serviceType: 'kie' },
    userImageUrl: 'pending://user',
    itemImageUrl: 'pending://item',
  }
  const accepted = jest.mocked(submitKieTask)
  const db = prisma.tryOnTask
  const option = () => ({
    clientSubmissionId: 'submission-synthetic',
    onProviderAccepted: jest.fn().mockResolvedValue(undefined),
  })

  beforeEach(() => {
    jest.clearAllMocks()
    jest.mocked(selectNewTryOnProvider).mockReturnValue('kie')
    jest.mocked(db.create).mockResolvedValue(created as never)
    jest.mocked(db.updateMany).mockResolvedValue({ count: 1 })
    jest.mocked(db.findUnique).mockResolvedValue({
      ...created, userImageUrl: 'mock://user', itemImageUrl: 'mock://frame',
    } as never)
    jest.mocked(mockBlobUpload).mockImplementation(async (path) => ({
      url: `mock://${path}`, pathname: path,
    } as never))
    jest.mocked(startGenerationRequest).mockResolvedValue(undefined as never)
    jest.mocked(startGenerationAttempt).mockResolvedValue({} as never)
    jest.mocked(markGenerationAttemptSubmitted).mockResolvedValue(undefined as never)
  })

  function syntheticImage(contents: string, filename: string): File {
    // The jsdom File lacks arrayBuffer(), but the real Node File supplies it.
    const file = new File([contents], filename, { type: 'image/jpeg' })
    Object.defineProperty(file, 'arrayBuffer', {
      value: async () => Uint8Array.from(Buffer.from(contents)).buffer,
    })
    return file
  }

  async function call(options = option()) {
    return submitStoreTryOnTask(
      attribution,
      syntheticImage('synthetic face', 'face.jpg'),
      syntheticImage('synthetic frame', 'frame.jpg'),
      options,
    )
  }

  it('stores UNKNOWN before one Kie create, then ACCEPTED before sponsored usage', async () => {
    const opts = option()
    accepted.mockResolvedValue('kie-synthetic-1')
    await expect(call(opts)).resolves.toMatchObject({
      taskId: 'task-synthetic', status: 'submitted', serviceType: 'kie',
    })
    expect(accepted).toHaveBeenCalledTimes(1)
    expect(selectNewTryOnProvider).toHaveBeenCalledWith('store')
    expect(jest.mocked(db.updateMany).mock.calls[1][0]?.data).toMatchObject({
      status: 'PROCESSING', metadata: { dispatchOutcome: 'UNKNOWN' },
    })
    // The task is already PROCESSING from the pre-submit UNKNOWN fence.
    // Acceptance only persists the Kie task ID and clears the dispatch lease.
    expect(jest.mocked(db.updateMany).mock.calls[2][0]?.data).toMatchObject({
      dispatchLeaseOwner: null,
      metadata: {
        serviceType: 'kie', externalTaskId: 'kie-synthetic-1',
        dispatchOutcome: 'ACCEPTED',
        inputAssetAccessMode: 'PUBLIC_TEMPORARY', privateBlob: false,
      },
    })
    expect(opts.onProviderAccepted).toHaveBeenCalledTimes(1)
    expect(markGenerationAttemptSubmitted).toHaveBeenCalledTimes(1)
  })

  it('preserves processing UNKNOWN after an ambiguous Kie acceptance (no second request)', async () => {
    const opts = option()
    accepted.mockRejectedValue(new KieProviderError('submit', 'unknown', 'outcome unknown'))
    await expect(call(opts)).rejects.toMatchObject({ acceptance: 'unknown' })
    expect(accepted).toHaveBeenCalledTimes(1)
    expect(opts.onProviderAccepted).not.toHaveBeenCalled()
    const writes = jest.mocked(db.updateMany).mock.calls.map(args => args[0]?.data)
    expect(writes).toContainEqual(expect.objectContaining({
      status: 'PROCESSING',
      metadata: expect.objectContaining({ dispatchOutcome: 'UNKNOWN', privateBlob: false }),
    }))
    expect(writes.some(write => write?.status === 'FAILED')).toBe(false)
  })

  it('keeps private asset metadata when existing Store policy is private', async () => {
    jest.mocked(resolveStoreAssetAccessPolicy).mockReturnValueOnce({
      assetAccessMode: 'PRIVATE_SIGNED', blobAccess: 'private', publicPoc: false,
    })
    accepted.mockResolvedValue('kie-private')
    await expect(call()).resolves.toMatchObject({ serviceType: 'kie', status: 'submitted' })
    const writes = jest.mocked(db.updateMany).mock.calls.map(args => args[0]?.data)
    expect(writes).toContainEqual(expect.objectContaining({
      metadata: expect.objectContaining({ dispatchOutcome: 'ACCEPTED', privateBlob: true }),
    }))
  })

  it('marks provably unsubmitted Kie create as FAILED and does not settle', async () => {
    const opts = option()
    accepted.mockRejectedValue(new KieProviderError('upload', 'not-sent', 'upload rejected'))
    await expect(call(opts)).rejects.toMatchObject({ acceptance: 'not-sent' })
    expect(accepted).toHaveBeenCalledTimes(1)
    expect(opts.onProviderAccepted).not.toHaveBeenCalled()
    const writes = jest.mocked(db.updateMany).mock.calls.map(args => args[0]?.data)
    expect(writes).toContainEqual(expect.objectContaining({
      status: 'FAILED',
      metadata: expect.objectContaining({ dispatchOutcome: 'NOT_SENT' }),
    }))
  })
})
