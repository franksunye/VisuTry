/** @jest-environment node */

import { analyzeFaceWithKie, KIE_FACE_ANALYSIS_MODEL } from '@/lib/kie-face-analysis'
import { uploadKieFaceAnalysisImage } from '@/lib/kie'

jest.mock('@/lib/kie', () => ({ uploadKieFaceAnalysisImage: jest.fn() }))
jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}))

const photo = `data:image/jpeg;base64,${Buffer.from('synthetic-face-image').toString('base64')}`
const temporaryUrl = 'https://tempfile.redpandaai.co/synthetic-input.jpg'

describe('Kie Face Analysis documented JSON interface (no supplier calls)', () => {
  const original = process.env.KIE_API_KEY
  const originalFetch = global.fetch

  beforeEach(() => {
    jest.resetAllMocks()
    process.env.KIE_API_KEY = 'test-only-secret'
    jest.mocked(uploadKieFaceAnalysisImage).mockResolvedValue(temporaryUrl)
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ choices: [{ message: { content: '{"faceShape":"oval"}' } }] }),
    })
  })

  afterAll(() => {
    global.fetch = originalFetch
    if (original === undefined) delete process.env.KIE_API_KEY
    else process.env.KIE_API_KEY = original
  })

  it('submits one documented multimodal vision-chat request using only a staged HTTPS URL', async () => {
    const result = await analyzeFaceWithKie(photo, 'Analyze the face geometry')

    expect(KIE_FACE_ANALYSIS_MODEL).toBe('gemini-3-8-flash-openai')
    expect(result).toBe('{"faceShape":"oval"}')
    expect(uploadKieFaceAnalysisImage).toHaveBeenCalledWith(photo, expect.any(Number))
    expect(global.fetch).toHaveBeenCalledTimes(1)
    const [url, options] = jest.mocked(global.fetch).mock.calls[0]
    expect(url).toBe('https://api.kie.ai/gemini-3-8-flash-openai/v1/chat/completions')
    expect(options?.method).toBe('POST')
    expect(options?.redirect).toBe('error')
    expect(options?.headers).toMatchObject({ Authorization: 'Bearer test-only-secret' })
    expect(JSON.parse(String(options?.body))).toMatchObject({
      stream: false,
      include_thoughts: false,
      reasoning_effort: 'low',
      messages: [{ role: 'user', content: [
        { type: 'text', text: 'Analyze the face geometry' },
        { type: 'image_url', image_url: { url: temporaryUrl } },
      ] }],
    })
    expect(String(options?.body)).not.toContain('data:image/')
  })

  it('never submits an external chat call without a configured secret or valid source image', async () => {
    delete process.env.KIE_API_KEY
    await expect(analyzeFaceWithKie(photo, 'Analyze')).rejects.toThrow('KIE_API_KEY')
    process.env.KIE_API_KEY = 'test-only-secret'
    await expect(analyzeFaceWithKie('https://untrusted.example/portrait.jpg', 'Analyze')).rejects.toThrow('Unsupported')
    expect(uploadKieFaceAnalysisImage).not.toHaveBeenCalled()
    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('does not send chat when provider upload fails', async () => {
    jest.mocked(uploadKieFaceAnalysisImage).mockRejectedValue(new Error('synthetic upload failure'))
    await expect(analyzeFaceWithKie(photo, 'Analyze')).rejects.toThrow('synthetic upload failure')
    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('never retries after an ambiguous provider response', async () => {
    jest.mocked(global.fetch).mockRejectedValue(new Error('network timeout after send'))
    await expect(analyzeFaceWithKie(photo, 'Analyze')).rejects.toThrow('response unavailable')
    expect(global.fetch).toHaveBeenCalledTimes(1)
    expect(uploadKieFaceAnalysisImage).toHaveBeenCalledTimes(1)
  })

  it('rejects non-usable provider content and business failures', async () => {
    jest.mocked(global.fetch).mockResolvedValueOnce({
      ok: true, status: 200, json: async () => ({ choices: [{ message: { content: '' } }] }),
    } as Response)
    await expect(analyzeFaceWithKie(photo, 'Analyze')).rejects.toThrow('no usable content')
    jest.mocked(global.fetch).mockResolvedValueOnce({
      ok: false, status: 429, json: async () => ({ error: 'synthetic rejected' }),
    } as Response)
    await expect(analyzeFaceWithKie(photo, 'Analyze')).rejects.toThrow('request failed')
    expect(global.fetch).toHaveBeenCalledTimes(2) // two separate caller invocations, never an internal retry
  })
})
