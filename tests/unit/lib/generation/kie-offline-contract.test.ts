import {
  KIE_CREATE_PATH,
  KIE_MODELS,
  KIE_RECORD_PATH,
  SYNTHETIC_CASES,
  OfflineKieHarness,
  buildOfflineKieCreateBody,
  buildOfflineKieRecordQuery,
  decodeKieCreate,
  decodeKieRecord,
  type HttpEnvelope,
  type OfflineKieTransport,
} from '../../../support/kie-offline-contract'

const accepted = (taskId = 'task_offline_001'): HttpEnvelope => ({
  httpStatus: 200,
  body: { code: 200, msg: 'success', data: { taskId } },
})

const recorded = (
  state: string,
  fields: Record<string, unknown> = {},
  taskId = 'task_offline_001'
): HttpEnvelope => ({
  httpStatus: 200,
  body: { code: 200, msg: 'success', data: { taskId, state, ...fields } },
})

function transport(overrides: Partial<OfflineKieTransport> = {}): OfflineKieTransport {
  return {
    createTask: jest.fn().mockResolvedValue(accepted()),
    recordInfo: jest.fn().mockResolvedValue(recorded('waiting')),
    ...overrides,
  }
}

describe('G1-R1-B: zero-spend Kie offline contract', () => {
  it('uses the eight exact synthetic case IDs from Draft PR #432 without importing images', () => {
    expect(SYNTHETIC_CASES).toHaveLength(8)
    expect(SYNTHETIC_CASES.map(item => item.fixtureId)).toEqual(
      Array.from({ length: 8 }, (_, n) => 'G1-TRYON-' + String(n + 1).padStart(2, '0'))
    )
    SYNTHETIC_CASES.forEach(sample => {
      expect(sample.faceUrl).toMatch(/^https:\/\/g1-fixtures\.invalid\/media\/face-\d\d\.jpg$/)
      expect(sample.frameUrl).toMatch(/^https:\/\/g1-fixtures\.invalid\/media\/frame-\d\d\.jpg$/)
    })
  })

  it('serializes the documented two-image Nano Banana 2 Lite shape exactly', () => {
    const sample = SYNTHETIC_CASES[0]
    expect(buildOfflineKieCreateBody('nano-banana-2-lite', sample)).toStrictEqual({
      model: 'nano-banana-2-lite',
      input: {
        prompt: sample.prompt,
        image_urls: [sample.faceUrl, sample.frameUrl],
        aspect_ratio: 'auto',
      },
    })
    expect(buildOfflineKieCreateBody('nano-banana-2-lite', sample).input).not.toHaveProperty('input_urls')
  })

  it('serializes the documented FLUX.2 Pro image-to-image shape exactly', () => {
    const sample = SYNTHETIC_CASES[0]
    expect(buildOfflineKieCreateBody('flux-2/pro-image-to-image', sample)).toStrictEqual({
      model: 'flux-2/pro-image-to-image',
      input: {
        prompt: sample.prompt,
        input_urls: [sample.faceUrl, sample.frameUrl],
        aspect_ratio: '1:1',
        resolution: '1K',
        nsfw_checker: false,
      },
    })
    expect(buildOfflineKieCreateBody('flux-2/pro-image-to-image', sample).input).not.toHaveProperty('image_urls')
  })

  it('rejects real or even public routable media URLs before mock dispatch', () => {
    const sample = SYNTHETIC_CASES[0]
    const badUrls = [
      'https://www.visutry.com/avatar.jpg',
      'https://example.com/face.jpg',
      'http://g1-fixtures.invalid/face.jpg',
      'data:image/jpeg;base64,ZmFrZQ==',
      'https://g1-fixtures.invalid@evil.example/face.jpg',
      'https://g1-fixtures.invalid/face.jpg?token=secret',
    ]
    for (const faceUrl of badUrls) {
      expect(() => buildOfflineKieCreateBody('nano-banana-2-lite', { ...sample, faceUrl })).toThrow()
    }
    expect(() => buildOfflineKieCreateBody('nano-banana-2-lite', {
      ...sample, frameUrl: sample.faceUrl,
    })).toThrow('distinct')
    expect(() => buildOfflineKieCreateBody('nano-banana-2-lite', {
      ...sample, fixtureId: 'G1-TRYON-99',
    })).toThrow('fixture')
    expect(() => buildOfflineKieCreateBody('not-a-kie-model' as never, sample)).toThrow('model')
  })

  it('does not confuse HTTP 200 with business acceptance or with taskId persistence', () => {
    expect(decodeKieCreate(accepted())).toStrictEqual({ kind: 'accepted', taskId: 'task_offline_001' })
    expect(decodeKieCreate({ httpStatus: 200, body: { code: 422, msg: 'bad input' } })).toStrictEqual({
      kind: 'rejected', code: 422, message: 'bad input',
    })
    expect(decodeKieCreate({ httpStatus: 200, body: { code: 200, data: {} } })).toMatchObject({
      kind: 'unknown',
    })
    expect(decodeKieCreate({ httpStatus: 200, body: { code: 200 } })).toMatchObject({ kind: 'unknown' })
    expect(decodeKieCreate({ httpStatus: 200, body: 'success' })).toMatchObject({ kind: 'unknown' })
  })

  it.each([408, 409, 429, 500, 503, 504])('preserves unknown acceptance on HTTP %s', httpStatus => {
    expect(decodeKieCreate({ httpStatus, body: { code: httpStatus } })).toMatchObject({
      kind: 'unknown',
    })
  })

  it('records definitive 401/422 but never authorizes auto-fallback', () => {
    expect(decodeKieCreate({ httpStatus: 401, body: { msg: 'invalid API key' } })).toEqual({
      kind: 'rejected', code: 401, message: 'invalid API key',
    })
    expect(decodeKieCreate({ httpStatus: 200, body: { code: 503, msg: 'busy' } })).toMatchObject({
      kind: 'unknown',
    })
  })

  it.each(['waiting', 'queuing', 'generating'] as const)('keeps a %s task pending', state => {
    expect(decodeKieRecord(recorded(state), 'task_offline_001')).toEqual({
      kind: 'pending', state, creditsConsumed: null,
    })
  })

  it('recognizes failed tasks with preserved remote failure and spend metadata', () => {
    expect(decodeKieRecord(recorded('fail', {
      failCode: 'UPSTREAM_FAILURE', failMsg: 'synthetic failure', creditsConsumed: 4,
    }), 'task_offline_001')).toEqual({
      kind: 'failed', failCode: 'UPSTREAM_FAILURE', failMessage: 'synthetic failure', creditsConsumed: 4,
    })
  })

  it('accepts a successful one-URL result without inferring MIME from extension', () => {
    const resultUrl = 'https://synthetic-output.invalid/signed-output?token=fake'
    expect(decodeKieRecord(recorded('success', {
      resultJson: JSON.stringify({ resultUrls: [resultUrl] }), creditsConsumed: 8,
    }), 'task_offline_001')).toEqual({
      kind: 'completed', resultUrl, creditsConsumed: 8,
    })
  })

  it.each([
    ['missing JSON', null],
    ['malformed JSON', '{broken'],
    ['zero images', JSON.stringify({ resultUrls: [] })],
    ['multiple images', JSON.stringify({ resultUrls: ['https://fake.invalid/a', 'https://fake.invalid/b'] })],
    ['not HTTPS', JSON.stringify({ resultUrls: ['http://fake.invalid/a'] })],
    ['wrong schema', JSON.stringify({ resultUrl: 'https://fake.invalid/a' })],
  ])('does not mark %s as usable completion', (_name, resultJson) => {
    expect(decodeKieRecord(recorded('success', { resultJson }), 'task_offline_001')).toMatchObject({
      kind: 'unknown',
    })
  })

  it('rejects a mismatched task id, unknown status, or invalid charge value', () => {
    expect(decodeKieRecord(recorded('success', {}, 'foreign_task'), 'task_offline_001')).toMatchObject({
      kind: 'unknown',
    })
    expect(decodeKieRecord(recorded('not-a-state'), 'task_offline_001')).toMatchObject({
      kind: 'unknown',
    })
    expect(decodeKieRecord(recorded('waiting', { creditsConsumed: -1 }), 'task_offline_001')).toMatchObject({
      kind: 'unknown',
    })
    expect(decodeKieRecord({ httpStatus: 200, body: { code: 422 } }, 'task_offline_001')).toMatchObject({
      kind: 'unknown',
    })
  })

  it('uses a separate, validated recordInfo query (no URL or token interpolations)', () => {
    expect(buildOfflineKieRecordQuery('task_123')).toEqual({
      path: KIE_RECORD_PATH, query: { taskId: 'task_123' },
    })
    expect(() => buildOfflineKieRecordQuery('https://provider.example/task')).toThrow()
    expect(() => buildOfflineKieRecordQuery('')).toThrow()
  })

  it('executes eight matched synthetic cases against both models with 16 offline calls', async () => {
    const client = transport()
    const harness = new OfflineKieHarness(client)
    for (const sample of SYNTHETIC_CASES) {
      for (const model of KIE_MODELS) {
        const result = await harness.submit(model, sample)
        expect(result.kind).toBe('accepted')
      }
    }
    expect(client.createTask).toHaveBeenCalledTimes(16)
    expect(harness.getUniqueSubmitCount()).toBe(16)
    expect((client.createTask as jest.Mock).mock.calls.every(([path]) => path === KIE_CREATE_PATH)).toBe(true)
    for (const sample of SYNTHETIC_CASES) {
      for (const model of KIE_MODELS) await harness.submit(model, sample)
    }
    expect(client.createTask).toHaveBeenCalledTimes(16)
  })

  it('fences simultaneous same-key submit requests before the fake network promise resolves', async () => {
    let release!: (response: HttpEnvelope) => void
    const fake = jest.fn().mockImplementation(() => new Promise<HttpEnvelope>(resolve => {
      release = resolve
    }))
    const harness = new OfflineKieHarness(transport({ createTask: fake }))
    const a = harness.submit('nano-banana-2-lite', SYNTHETIC_CASES[0])
    const b = harness.submit('nano-banana-2-lite', SYNTHETIC_CASES[0])
    await Promise.resolve()
    expect(fake).toHaveBeenCalledTimes(1)
    release(accepted())
    expect(await Promise.all([a, b])).toEqual([
      { kind: 'accepted', taskId: 'task_offline_001' },
      { kind: 'accepted', taskId: 'task_offline_001' },
    ])
    expect(fake).toHaveBeenCalledTimes(1)
  })

  it('does not auto-resubmit after a possibly billed ambiguous timeout', async () => {
    const fake = jest.fn().mockRejectedValue(new Error('simulated socket reset'))
    const harness = new OfflineKieHarness(transport({ createTask: fake }))
    const first = await harness.submit('flux-2/pro-image-to-image', SYNTHETIC_CASES[0])
    const replay = await harness.submit('flux-2/pro-image-to-image', SYNTHETIC_CASES[0])
    expect(first.kind).toBe('unknown')
    expect(replay).toEqual(first)
    expect(fake).toHaveBeenCalledTimes(1)
  })

  it('prevents conflicting data reusing the same offline logical key', async () => {
    const harness = new OfflineKieHarness(transport())
    await harness.submit('nano-banana-2-lite', SYNTHETIC_CASES[0])
    expect(() => harness.submit('nano-banana-2-lite', {
      ...SYNTHETIC_CASES[0], prompt: 'A changed prompt in the same fake batch',
    })).toThrow('changed request')
  })

  it('polls the fake client only, and never uses a failure to dispatch a second generation', async () => {
    const fake = transport({
      recordInfo: jest.fn().mockResolvedValue(recorded('fail', { failCode: 'BAD_UPSTREAM' })),
    })
    const harness = new OfflineKieHarness(fake)
    await harness.submit('nano-banana-2-lite', SYNTHETIC_CASES[0])
    const outcome = await harness.poll('task_offline_001')
    expect(outcome).toMatchObject({ kind: 'failed', failCode: 'BAD_UPSTREAM' })
    expect(fake.recordInfo).toHaveBeenCalledWith(KIE_RECORD_PATH, { taskId: 'task_offline_001' })
    expect(fake.createTask).toHaveBeenCalledTimes(1)
  })

  it('preserves unknown on polling transport exceptions without new generation', async () => {
    const fake = transport({ recordInfo: jest.fn().mockRejectedValue(new Error('503')) })
    const harness = new OfflineKieHarness(fake)
    await harness.submit('nano-banana-2-lite', SYNTHETIC_CASES[0])
    expect(await harness.poll('task_offline_001')).toMatchObject({ kind: 'unknown' })
    expect(fake.createTask).toHaveBeenCalledTimes(1)
  })
})
