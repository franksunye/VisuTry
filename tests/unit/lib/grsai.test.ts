import { pollTaskResult } from '@/lib/grsai'
import { logger } from '@/lib/logger'

// Mock fetch
global.fetch = jest.fn()

// Mock logger
jest.mock('@/lib/logger', () => ({
  logger: {
    error: jest.fn(),
    info: jest.fn(),
  }
}))

describe('GrsAi Library', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('pollTaskResult', () => {
    it('should parse new response structure correctly', async () => {
      const mockResponse = {
        code: 0,
        data: {
          id: "xxxxx",
          results: [
            {
              url: " `https://example.com/example.png` ",
              content: "这是一只可爱的猫咪在草地上玩耍"
            }
          ],
          progress: 100,
          status: "succeeded",
          failure_reason: "",
          error: ""
        },
        msg: "success"
      }

      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockResponse)
      })

      const result = await pollTaskResult('xxxxx')

      expect(result.status).toBe('succeeded')
      expect(result.imageUrl).toBe('https://example.com/example.png') // Should be cleaned
      expect(result.metadata).toEqual({ description: '这是一只可爱的猫咪在草地上玩耍' })
      expect(result.progress).toBe(100)
    })

    it('should parse legacy imageUrl structure correctly', async () => {
      const mockResponse = {
        code: 0,
        data: {
          status: 'succeeded',
          imageUrl: 'https://example.com/legacy.png',
          progress: 100
        },
        msg: "success"
      }

      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockResponse)
      })

      const result = await pollTaskResult('xxxxx')

      expect(result.status).toBe('succeeded')
      expect(result.imageUrl).toBe('https://example.com/legacy.png')
    })

    it('should parse legacy images array structure correctly', async () => {
      const mockResponse = {
        code: 0,
        data: {
          status: 'succeeded',
          images: ['https://example.com/array.png'],
          progress: 100
        },
        msg: "success"
      }

      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockResponse)
      })

      const result = await pollTaskResult('xxxxx')

      expect(result.status).toBe('succeeded')
      expect(result.imageUrl).toBe('https://example.com/array.png')
    })

    it('should handle failure status correctly', async () => {
        const mockResponse = {
          code: 0,
          data: {
            status: 'failed',
            failure_reason: 'GPU error',
            progress: 0
          },
          msg: "success"
        }
  
        ;(global.fetch as jest.Mock).mockResolvedValue({
          ok: true,
          json: jest.fn().mockResolvedValue(mockResponse)
        })
  
        const result = await pollTaskResult('xxxxx')
  
        expect(result.status).toBe('failed')
        expect(result.error).toBe('GPU error')
      })
  })
})
