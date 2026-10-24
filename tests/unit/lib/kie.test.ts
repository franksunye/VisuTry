import { pollKieTask, submitKieTask } from '@/lib/kie'

function envelope(body: unknown, status = 200) {
  return { ok: status === 200, status, json: jest.fn().mockResolvedValue(body) } as unknown as Response
}

const upload = (name: string) => envelope({
  success: true,
  code: 200,
  data: { downloadUrl: `https://tempfile.redpandaai.co/visutry/${name}.jpg` },
})
const accepted = envelope({ code: 200, data: { taskId: 'kie-123' } })
const media = 'data:image/jpeg;base64,YWJj'

describe('Kie async adapter — no real provider requests', () => {
  const originalFetch = global.fetch

  beforeEach(() => {
    process.env.KIE_API_KEY = 'synthetic-test-key'
    global.fetch = jest.fn()
  })
  afterEach(() => {
    global.fetch = originalFetch
    delete process.env.KIE_API_KEY
  })

  it('uploads both references privately before creating one exact-model async task', async () => {
    ;(global.fetch as jest.Mock)
      .mockResolvedValueOnce(upload('person'))
      .mockResolvedValueOnce(upload('frame'))
      .mockResolvedValueOnce(accepted)
    await expect(submitKieTask(media, media, 'test instruction', 'tryon-v1')).resolves.toBe('kie-123')
    const calls = (global.fetch as jest.Mock).mock.calls
    expect(calls).toHaveLength(3)
    expect(calls[0][0]).toBe('https://kieai.redpandaai.co/api/file-stream-upload')
    expect(calls[1][0]).toBe('https://kieai.redpandaai.co/api/file-stream-upload')
    expect(calls[0][1]).toMatchObject({ method: 'POST', headers: { Authorization: 'Bearer synthetic-test-key' } })
    expect(calls[2][0]).toBe('https://api.kie.ai/api/v1/jobs/createTask')
    const created = JSON.parse(calls[2][1].body)
    expect(created.model).toBe('nano-banana-2-lite')
    expect(created.input.image_urls).toEqual([
      'https://tempfile.redpandaai.co/visutry/person.jpg',
      'https://tempfile.redpandaai.co/visutry/frame.jpg',
    ])
    expect(created.input).toMatchObject({ aspect_ratio: 'auto', prompt: expect.stringContaining('test instruction') })
    expect(JSON.stringify(created)).not.toContain('YWJj')
  })

  it('rejects absent Kie credentials before sending any media', async () => {
    delete process.env.KIE_API_KEY
    await expect(submitKieTask(media, media, 'prompt')).rejects.toThrow('not configured')
    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('fails closed on an invalid upload host, without submitting a billable image', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue(envelope({
      success: true, code: 200, data: { downloadUrl: 'http://localhost/private' },
    }))
    await expect(submitKieTask(media, media, 'prompt')).rejects.toThrow('upload rejected')
    expect((global.fetch as jest.Mock).mock.calls.every(([url]) => url === 'https://kieai.redpandaai.co/api/file-stream-upload')).toBe(true)
  })

  it('never retries an ambiguously acknowledged createTask 503 body', async () => {
    ;(global.fetch as jest.Mock)
      .mockResolvedValueOnce(upload('person'))
      .mockResolvedValueOnce(upload('frame'))
      .mockResolvedValueOnce(envelope({ code: 503, msg: 'busy' }))
    await expect(submitKieTask(media, media, 'prompt')).rejects.toThrow('admission')
    expect(global.fetch).toHaveBeenCalledTimes(3)
  })

  it('never sends even reference photos when the Consumer route budget is exhausted', async () => {
    await expect(submitKieTask(media, media, 'prompt', 'tryon-v1', Date.now() - 1))
      .rejects.toMatchObject({ stage: 'upload', acceptance: 'not-sent' })
    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('never creates a paid task if the route deadline expires during reference upload', async () => {
    let clockMs = Date.now()
    const dateSpy = jest.spyOn(Date, 'now').mockImplementation(() => clockMs)
    try {
      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce(upload('person'))
        .mockImplementationOnce(() => {
          clockMs += 8_000
          return Promise.resolve(upload('frame'))
        })
      await expect(submitKieTask(media, media, 'prompt', 'tryon-v1', clockMs + 6_000))
        .rejects.toMatchObject({ stage: 'submit', acceptance: 'not-sent' })
      expect(global.fetch).toHaveBeenCalledTimes(2)
      expect((global.fetch as jest.Mock).mock.calls.every(([url]) => String(url).includes('file-stream-upload'))).toBe(true)
    } finally {
      dateSpy.mockRestore()
    }
  })

  it('preserves an accepted external ID when the task is waiting', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue(envelope({
      code: 200, data: { taskId: 'kie-123', state: 'waiting' },
    }))
    expect(await pollKieTask('kie-123')).toMatchObject({ status: 'processing' })
    const url = (global.fetch as jest.Mock).mock.calls[0][0] as URL
    expect(url.searchParams.get('taskId')).toBe('kie-123')
  })

  it('returns a single allowlisted HTTPS JPEG output as usable success', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue(envelope({
      code: 200, data: {
        taskId: 'kie-123', state: 'success',
        resultJson: JSON.stringify({ resultUrls: ['https://tempfile.redpandaai.co/generation/result.jpg'] }),
      },
    }))
    expect(await pollKieTask('kie-123')).toMatchObject({
      status: 'succeeded', imageUrl: 'https://tempfile.redpandaai.co/generation/result.jpg', progress: 100,
    })
  })

  it('accepts the exact Kie output hostname confirmed by a synthetic live task', async () => {
    const imageUrl = 'https://tempfile.aiquickdraw.com/generation/synthetic-result.jpg'
    ;(global.fetch as jest.Mock).mockResolvedValue(envelope({
      code: 200, data: {
        taskId: 'kie-123', state: 'success',
        resultJson: JSON.stringify({ resultUrls: [imageUrl] }),
      },
    }))
    expect(await pollKieTask('kie-123')).toMatchObject({
      status: 'succeeded', progress: 100, imageUrl,
    })
    expect(global.fetch).toHaveBeenCalledTimes(1)
    const [url] = (global.fetch as jest.Mock).mock.calls[0]
    expect(url.toString()).toContain('/api/v1/jobs/recordInfo?taskId=kie-123')
  })

  it.each([
    'http://tempfile.aiquickdraw.com/result.jpg',
    'https://tempfile.aiquickdraw.com:8443/result.jpg',
    'https://user:password@tempfile.aiquickdraw.com/result.jpg',
    'https://tempfile.aiquickdraw.com.evil.example/result.jpg',
    'https://sub.tempfile.aiquickdraw.com/result.jpg',
    'https://fake-tempfile.aiquickdraw.com/result.jpg',
    'https://tempfile.aiquickdraw.com@127.0.0.1/admin',
    'https://127.0.0.1/admin',
  ])('rejects unsafe Kie success media URL: %s', async (untrustedUrl) => {
    ;(global.fetch as jest.Mock).mockResolvedValue(envelope({
      code: 200, data: {
        taskId: 'kie-123', state: 'success',
        resultJson: JSON.stringify({ resultUrls: [untrustedUrl] }),
      },
    }))
    expect(await pollKieTask('kie-123')).toMatchObject({
      status: 'failed', diagnostics: { code: 503 },
    })
    expect(global.fetch).toHaveBeenCalledTimes(1)
  })

  it('does not allow the output-only host in the reference-upload response', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue(envelope({
      success: true, code: 200,
      data: { downloadUrl: 'https://tempfile.aiquickdraw.com/references/synthetic.jpg' },
    }))
    await expect(submitKieTask(media, media, 'prompt')).rejects.toThrow('upload rejected')
    expect((global.fetch as jest.Mock).mock.calls.every(([url]) =>
      url === 'https://kieai.redpandaai.co/api/file-stream-upload')).toBe(true)
  })

  it('never returns an attacker-supplied internal/private result URL', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue(envelope({
      code: 200, data: {
        taskId: 'kie-123', state: 'success',
        resultJson: JSON.stringify({ resultUrls: ['https://127.0.0.1/admin'] }),
      },
    }))
    expect(await pollKieTask('kie-123')).toMatchObject({ status: 'failed', diagnostics: { code: 503 } })
  })

  it('treats malformed/unknown poll responses as nonterminal, never as a successful result', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue(envelope({ code: 503, msg: 'busy' }))
    expect(await pollKieTask('kie-123')).toMatchObject({ status: 'failed', diagnostics: { code: 503 } })
    ;(global.fetch as jest.Mock).mockResolvedValue(envelope({
      code: 200, data: { taskId: 'wrong-id', state: 'success', resultJson: '{}' },
    }))
    expect(await pollKieTask('kie-123')).toMatchObject({ status: 'failed', diagnostics: { code: 503 } })
  })

  it('treats an explicit Kie terminal fail as failed and never returns media', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue(envelope({
      code: 200, data: { taskId: 'kie-123', state: 'fail', failCode: 'UPSTREAM_FAILED' },
    }))
    expect(await pollKieTask('kie-123')).toEqual({
      status: 'failed', progress: 0, error: 'Kie task failed (UPSTREAM_FAILED)',
    })
  })
})
