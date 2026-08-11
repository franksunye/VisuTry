import { analyzeFaceWithGrsAi } from '@/lib/grsai-face-analysis'
import { logger } from '@/lib/logger'

jest.mock('@/lib/logger', () => ({
  logger: {
    error: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
  },
}))

function failedResponse(errorType: string) {
  return {
    ok: false,
    status: 400,
    statusText: 'Bad Request',
    text: jest.fn().mockResolvedValue(
      JSON.stringify({
        error: {
          message: 'API error response',
          type: errorType,
        },
      })
    ),
  } as unknown as Response
}

function successfulResponse(content = '{"faceShape":"oval"}') {
  return {
    ok: true,
    status: 200,
    statusText: 'OK',
    json: jest.fn().mockResolvedValue({
      choices: [{ message: { content } }],
    }),
  } as unknown as Response
}

describe('analyzeFaceWithGrsAi', () => {
  const originalApiKey = process.env.GRSAI_API_KEY

  beforeEach(() => {
    jest.useFakeTimers()
    jest.clearAllMocks()
    process.env.GRSAI_API_KEY = 'test-api-key'
    global.fetch = jest.fn()
  })

  afterEach(() => {
    jest.useRealTimers()
    if (originalApiKey === undefined) {
      delete process.env.GRSAI_API_KEY
    } else {
      process.env.GRSAI_API_KEY = originalApiKey
    }
  })

  it('retries one transient rix_api_error and returns the recovered result', async () => {
    ;(global.fetch as jest.Mock)
      .mockResolvedValueOnce(failedResponse('rix_api_error'))
      .mockResolvedValueOnce(successfulResponse())

    const analysis = analyzeFaceWithGrsAi('https://example.com/face.jpg', 'Analyze this face')

    await jest.advanceTimersByTimeAsync(1_500)

    await expect(analysis).resolves.toBe('{"faceShape":"oval"}')
    expect(global.fetch).toHaveBeenCalledTimes(2)
    expect(logger.warn).toHaveBeenCalledWith(
      'grsai-face',
      'Chat API transient provider error (attempt 1)',
      expect.objectContaining({ status: 400, errorType: 'rix_api_error' })
    )
    expect(logger.info).toHaveBeenCalledWith(
      'grsai-face',
      'Chat API recovered after retry',
      { attempt: 2, status: 200 }
    )
    expect(logger.error).not.toHaveBeenCalled()
  })

  it('does not retry other HTTP 400 errors', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce(failedResponse('invalid_request_error'))

    await expect(
      analyzeFaceWithGrsAi('https://example.com/face.jpg', 'Analyze this face')
    ).rejects.toThrow('GrsAi face analysis failed: Bad Request')

    expect(global.fetch).toHaveBeenCalledTimes(1)
    expect(logger.warn).not.toHaveBeenCalled()
    expect(logger.error).toHaveBeenCalledTimes(1)
  })

  it('does not retry network errors because the provider may have accepted the request', async () => {
    ;(global.fetch as jest.Mock).mockRejectedValueOnce(new Error('socket closed'))

    await expect(
      analyzeFaceWithGrsAi('https://example.com/face.jpg', 'Analyze this face')
    ).rejects.toThrow('socket closed')

    expect(global.fetch).toHaveBeenCalledTimes(1)
    expect(logger.warn).toHaveBeenCalledWith(
      'grsai-face',
      'Chat API network error (attempt 1)',
      undefined,
      expect.objectContaining({ attempt: 1, isTimeout: false })
    )
  })

  it('fails normally when the single rix_api_error retry is exhausted', async () => {
    ;(global.fetch as jest.Mock)
      .mockResolvedValueOnce(failedResponse('rix_api_error'))
      .mockResolvedValueOnce(failedResponse('rix_api_error'))

    const analysis = analyzeFaceWithGrsAi('https://example.com/face.jpg', 'Analyze this face')
    const rejection = expect(analysis).rejects.toThrow(
      'GrsAi face analysis failed: Bad Request'
    )

    await jest.advanceTimersByTimeAsync(1_500)

    await rejection
    expect(global.fetch).toHaveBeenCalledTimes(2)
    expect(logger.warn).toHaveBeenCalledTimes(1)
    expect(logger.error).toHaveBeenCalledTimes(1)
  })
})
