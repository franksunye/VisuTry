/** @jest-environment node */

import { readFile } from 'node:fs/promises'
import { submitCompareFrameTask } from '@/lib/compare-tryon-server'
import { submitTryOnTask } from '@/lib/tryon-service'

jest.mock('node:fs/promises', () => ({ readFile: jest.fn() }))
jest.mock('@/lib/tryon-service', () => ({ submitTryOnTask: jest.fn() }))
jest.mock('@/lib/logger', () => ({ logger: { error: jest.fn() } }))

describe('batch Try-On provider routing', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.mocked(readFile).mockResolvedValue(Buffer.from([1, 2, 3]))
    jest.mocked(submitTryOnTask).mockResolvedValue({
      taskId: 'new-kie-task', status: 'submitted', serviceType: 'kie', isAsync: true,
    })
  })

  it.each(['frame-compare', 'style-explorer'])('%s forwards async-only routing without forcing Grsai', async (source) => {
    const preset = {
      id: 'rectangle-classic', name: 'Rectangle', style: 'classic',
      promptHint: 'classic rectangular glasses', assetPath: '/test-frame.jpg',
    }
    const result = await submitCompareFrameTask({
      user: { id: 'consumer-1' } as never,
      userImageFile: new File([new Uint8Array([4])], 'face.jpg', { type: 'image/jpeg' }),
      preset: preset as never,
      index: 0,
      batchMetadata: { batchId: 'new-batch', source, batchSize: 4 },
    })

    expect(result).toMatchObject({ taskId: 'new-kie-task', status: 'processing' })
    expect(submitTryOnTask).toHaveBeenCalledTimes(1)
    expect(submitTryOnTask).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'consumer-1' }),
      expect.any(File), expect.any(File), 'GLASSES', expect.any(String),
      expect.objectContaining({
        clientSubmissionId: 'new-batch:rectangle-classic',
        requireAsyncProvider: true,
        metadata: expect.objectContaining({ source, framePresetId: 'rectangle-classic' }),
      }),
    )
    const options = jest.mocked(submitTryOnTask).mock.calls[0][5]
    expect(options?.metadata).not.toHaveProperty('serviceType')
    expect(options).not.toHaveProperty('forceServiceType')
  })
})
