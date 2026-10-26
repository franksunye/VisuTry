import { getOrCreateConsumerSubmission } from '@/lib/try-on/consumer-replay-key'

describe('Consumer Try-On client submission replay', () => {
  const face = { name: 'synthetic-face.jpg' } as File
  const frame = { name: 'synthetic-frame.jpg' } as File
  const anotherFrame = { name: 'synthetic-frame-2.jpg' } as File
  const anotherFace = { name: 'synthetic-face-2.jpg' } as File

  it('reuses the exact submission ID after an ambiguous response', () => {
    const nextId = jest.fn().mockReturnValue('logical-request-1')
    const first = getOrCreateConsumerSubmission(null, {
      type: 'GLASSES', userImageFile: face, itemImageFile: frame,
    }, nextId)
    const replay = getOrCreateConsumerSubmission(first, {
      type: 'GLASSES', userImageFile: face, itemImageFile: frame,
    }, nextId)
    expect(replay).toBe(first)
    expect(replay.clientSubmissionId).toBe('logical-request-1')
    expect(nextId).toHaveBeenCalledTimes(1)
  })

  it('creates a new logical request only after an explicit file change', () => {
    let next = 0
    const createId = () => `logical-request-${++next}`
    const first = getOrCreateConsumerSubmission(null, {
      type: 'GLASSES', userImageFile: face, itemImageFile: frame,
    }, createId)
    const changedFrame = getOrCreateConsumerSubmission(first, {
      type: 'GLASSES', userImageFile: face, itemImageFile: anotherFrame,
    }, createId)
    const changedFace = getOrCreateConsumerSubmission(changedFrame, {
      type: 'GLASSES', userImageFile: anotherFace, itemImageFile: anotherFrame,
    }, createId)
    expect([first.clientSubmissionId, changedFrame.clientSubmissionId, changedFace.clientSubmissionId])
      .toEqual(['logical-request-1', 'logical-request-2', 'logical-request-3'])
  })

  it('never reuses a key across Try-On types', () => {
    const prior = getOrCreateConsumerSubmission(null, {
      type: 'GLASSES', userImageFile: face, itemImageFile: frame,
    }, () => 'glasses-1')
    const changed = getOrCreateConsumerSubmission(prior, {
      type: 'ACCESSORIES', userImageFile: face, itemImageFile: frame,
    }, () => 'accessories-1')
    expect(changed.clientSubmissionId).toBe('accessories-1')
  })
})
