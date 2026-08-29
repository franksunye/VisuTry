import {
  parseMerchantRuntimeContinuationState,
  parseMerchantRuntimeTryOnTasks,
  serializeMerchantRuntimeContinuationState,
} from '@/lib/commerce-handoff/merchant-runtime-state'

const now = Date.parse('2026-08-29T12:00:00.000Z')

const validState = {
  merchantId: 'merchant-1',
  merchantSessionId: 'session-1',
  expiresAt: '2026-08-30T12:00:00.000Z',
  photoPreview: 'https://cdn.example/photo.webp',
  recommendations: [{ id: 'frame-a', name: 'Aviator' }],
  selectedIds: ['frame-a'],
  selectionSaved: true as const,
  batchId: 'batch-1',
  tryOnTasks: [{ merchantFrameId: 'frame-a', taskId: 'task-a' }],
}

describe('Merchant runtime continuation state', () => {
  it('persists durable task identifiers without result blobs or data URLs', () => {
    const serialized = serializeMerchantRuntimeContinuationState(validState)
    expect(serialized).toContain('task-a')
    expect(serialized).not.toContain('data:')
    expect(serialized).not.toContain('resultImageUrl')

    const parsed = parseMerchantRuntimeContinuationState(JSON.parse(serialized), now)
    expect(parsed).toMatchObject({
      merchantSessionId: 'session-1',
      batchId: 'batch-1',
      tryOnTasks: [{ merchantFrameId: 'frame-a', taskId: 'task-a' }],
    })
  })

  it('rejects private data-URL photos and expired sessions', () => {
    expect(parseMerchantRuntimeContinuationState({
      ...validState,
      photoPreview: 'data:image/jpeg;base64,abc',
    }, now)).toBeNull()

    expect(parseMerchantRuntimeContinuationState({
      ...validState,
      expiresAt: '2026-08-28T12:00:00.000Z',
    }, now)).toBeNull()
  })

  it('drops malformed task refs and extra result fields', () => {
    expect(parseMerchantRuntimeTryOnTasks([
      { merchantFrameId: 'frame-a', taskId: 'task-a', resultImageUrl: 'https://cdn.example/secret.webp' },
      { merchantFrameId: '', taskId: 'nope' },
      { merchantFrameId: 'frame-a', taskId: 'task-a' },
    ])).toEqual([{ merchantFrameId: 'frame-a', taskId: 'task-a' }])
  })
})
