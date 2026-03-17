import { submitTryOnTask, getTryOnResult } from '@/lib/tryon-service'
import { prisma } from '@/lib/prisma'
import { submitAsyncTask, pollTaskResult } from '@/lib/grsai'
import { put } from '@vercel/blob'
// Remove import { TaskStatus } from '@prisma/client' to avoid issues
// Define mock enum
const TaskStatus = {
  PENDING: 'PENDING',
  PROCESSING: 'PROCESSING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED'
}

// Mock dependencies
jest.mock('@prisma/client', () => ({
  TaskStatus: {
    PENDING: 'PENDING',
    PROCESSING: 'PROCESSING',
    COMPLETED: 'COMPLETED',
    FAILED: 'FAILED'
  },
  TryOnType: {
    GLASSES: 'GLASSES'
  }
}))

jest.mock('@/lib/prisma', () => ({
  prisma: {
    tryOnTask: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
  },
}))

jest.mock('@vercel/blob', () => ({
  put: jest.fn(),
}))

jest.mock('@/lib/grsai', () => ({
  submitAsyncTask: jest.fn(),
  pollTaskResult: jest.fn(),
}))

jest.mock('@/lib/gemini', () => ({
  generateTryOnImage: jest.fn(),
}))

jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}))

// Mock File object if not available in environment (Jest JSDOM usually has it, but just in case)
if (typeof File === 'undefined') {
  global.File = class {
    name: string
    type: string
    constructor(bits: any[], name: string, options: any) {
      this.name = name
      this.type = options?.type || ''
    }
    arrayBuffer() {
      return Promise.resolve(new ArrayBuffer(8))
    }
  } as any
}

describe('TryOnService', () => {
  const mockUser = {
    id: 'user-1',
    isPremium: false,
    premiumExpiresAt: null,
  }

  const mockFile = {
    name: 'test.jpg',
    type: 'image/jpeg',
    arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(8))
  } as unknown as File

  beforeEach(() => {
    jest.clearAllMocks()
    ;(put as jest.Mock).mockImplementation((path: string) => ({
      url: `http://blob/${path}`,
    }))
  })

  describe('submitTryOnTask', () => {
    it('should use GrsAi for free users and keep user/item URLs distinct', async () => {
      ;(submitAsyncTask as jest.Mock).mockResolvedValue('grsai-task-id')
      ;(prisma.tryOnTask.create as jest.Mock).mockResolvedValue({
        id: 'task-1',
        status: TaskStatus.PENDING,
      })
      ;(prisma.tryOnTask.update as jest.Mock).mockResolvedValue({})

      const result = await submitTryOnTask(
        mockUser as any,
        mockFile,
        mockFile,
        'GLASSES'
      )

      expect(submitAsyncTask).toHaveBeenCalled()
      expect(prisma.tryOnTask.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userImageUrl: expect.stringContaining('tryon/user/user-1/'),
          itemImageUrl: expect.stringContaining('tryon/item/user-1/'),
          metadata: expect.objectContaining({
            inputDiagnostics: expect.objectContaining({
              userFile: expect.objectContaining({
                name: 'test.jpg',
                type: 'image/jpeg',
              }),
              itemFile: expect.objectContaining({
                name: 'test.jpg',
                type: 'image/jpeg',
              }),
              sameContentSha256: undefined,
              hashEnabled: false,
            }),
            uploadDiagnostics: expect.objectContaining({
              userImageUrl: expect.stringContaining('tryon/user/user-1/'),
              itemImageUrl: expect.stringContaining('tryon/item/user-1/'),
              identicalUploadUrls: false,
            }),
          }),
        }),
      })
      expect(result.serviceType).toBe('grsai')
      expect(result.isAsync).toBe(true)
      expect(result.status).toBe('submitted')
    })

    it('should use Gemini for premium users and upload result to blob', async () => {
      const premiumUser = { ...mockUser, isPremium: true, premiumExpiresAt: new Date(Date.now() + 10000) }
      const mockGenerate = require('@/lib/gemini').generateTryOnImage
      
      mockGenerate.mockResolvedValue({
        success: true,
        imageUrl: 'data:image/png;base64,fake',
        metadata: { text: 'some text' }
      })

      ;(prisma.tryOnTask.create as jest.Mock).mockResolvedValue({
        id: 'task-gemini',
        userId: 'user-1',
        metadata: {}
      })

      // Mock fetch for blob upload
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        blob: jest.fn().mockResolvedValue(new Blob(['fake'], { type: 'image/png' }))
      })

      const result = await submitTryOnTask(
        premiumUser as any,
        mockFile,
        mockFile,
        'GLASSES'
      )

      expect(result.serviceType).toBe('gemini')
      expect(result.isAsync).toBe(false)
      expect(result.status).toBe('completed')
      
      // Verify Blob upload for result
      expect(put).toHaveBeenCalledWith(
        expect.stringContaining('tryon/result/user-1/task-gemini.png'),
        expect.any(File),
        expect.objectContaining({ access: 'public' })
      )

      // Verify DB update
      expect(prisma.tryOnTask.update).toHaveBeenCalledWith({
        where: { id: 'task-gemini' },
        data: expect.objectContaining({
            status: TaskStatus.COMPLETED,
            resultImageUrl: expect.stringContaining('tryon/result/user-1/task-gemini.png'),
            metadata: expect.objectContaining({
                originalResultUrl: 'data:image/png;base64,fake'
            })
        })
      })
    })
  })

  describe('getTryOnResult', () => {
    it('should poll GrsAi and return isNewCompletion=true when task completes', async () => {
      const mockTask = {
        id: 'task-1',
        userId: 'user-1',
        status: TaskStatus.PENDING,
        metadata: {
          serviceType: 'grsai',
          externalTaskId: 'grsai-task-id',
        },
      }

      ;(prisma.tryOnTask.findUnique as jest.Mock).mockResolvedValue(mockTask)
      ;(pollTaskResult as jest.Mock).mockResolvedValue({
        status: 'succeeded',
        imageUrl: 'http://result.jpg',
        metadata: { description: 'Test Description' }
      })
      
      // Mock fetch for image upload
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        blob: jest.fn().mockResolvedValue(new Blob(['fake-image'], { type: 'image/png' }))
      })
      
      // Mock updateMany to return count: 1
      ;(prisma.tryOnTask.updateMany as jest.Mock).mockResolvedValue({ count: 1 })

      const result = await getTryOnResult('task-1')

      expect(pollTaskResult).toHaveBeenCalledWith('grsai-task-id')
      // Expect upload to be called
      expect(put).toHaveBeenCalledWith(
        expect.stringContaining('tryon/result/user-1/task-1.png'),
        expect.any(File),
        expect.objectContaining({ access: 'public' })
      )
      
      expect(prisma.tryOnTask.updateMany).toHaveBeenCalledWith({
        where: {
            id: 'task-1',
            status: { not: TaskStatus.COMPLETED }
        },
        data: expect.objectContaining({
          status: TaskStatus.COMPLETED,
          resultImageUrl: 'http://blob/test.jpg', // From put mock
          metadata: expect.objectContaining({
             serviceType: 'grsai',
             externalTaskId: 'grsai-task-id',
             description: 'Test Description',
             originalResultUrl: 'http://result.jpg'
          })
        })
      })
      expect(result.status).toBe(TaskStatus.COMPLETED)
      expect(result.isNewCompletion).toBe(true)
    })

    it('should return isNewCompletion=false/undefined if task was already completed', async () => {
       const mockTask = {
        id: 'task-1',
        status: TaskStatus.COMPLETED,
      }
      ;(prisma.tryOnTask.findUnique as jest.Mock).mockResolvedValue(mockTask)

      const result = await getTryOnResult('task-1')

      expect(pollTaskResult).not.toHaveBeenCalled()
      expect(result.status).toBe(TaskStatus.COMPLETED)
      expect(result.isNewCompletion).toBeFalsy() 
    })

    it('should keep task processing when GrsAi polling fails with a transient network error', async () => {
      const mockTask = {
        id: 'task-transient',
        status: TaskStatus.PROCESSING,
        metadata: {
          serviceType: 'grsai',
          externalTaskId: 'grsai-task-id',
          retryCount: 0,
        },
      }

      ;(prisma.tryOnTask.findUnique as jest.Mock).mockResolvedValue(mockTask)
      ;(pollTaskResult as jest.Mock).mockResolvedValue({
        status: 'failed',
        progress: 0,
        error: 'Network error',
      })
      ;(prisma.tryOnTask.update as jest.Mock).mockResolvedValue({})

      const result = await getTryOnResult('task-transient')

      expect(prisma.tryOnTask.update).toHaveBeenCalledWith({
        where: { id: 'task-transient' },
        data: expect.objectContaining({
          status: TaskStatus.PROCESSING,
          errorMessage: null,
          metadata: expect.objectContaining({
            externalTaskId: 'grsai-task-id',
            lastExternalStatus: 'failed',
            lastExternalError: 'Network error',
          }),
        }),
      })
      expect(result.status).toBe(TaskStatus.PROCESSING)
      expect(result.progress).toBe(0)
    })

    it('should mark task as failed when GrsAi succeeds without image URL', async () => {
      const mockTask = {
        id: 'task-2',
        userId: 'user-1',
        status: TaskStatus.PROCESSING,
        metadata: {
          serviceType: 'grsai',
          externalTaskId: 'grsai-task-id',
        },
      }

      ;(prisma.tryOnTask.findUnique as jest.Mock).mockResolvedValue(mockTask)
      ;(pollTaskResult as jest.Mock).mockResolvedValue({
        status: 'succeeded',
        progress: 100,
        diagnostics: {
          code: 0,
          message: 'success',
          rawStatus: 'succeeded',
        },
      })
      ;(prisma.tryOnTask.update as jest.Mock).mockResolvedValue({})

      const result = await getTryOnResult('task-2')

      expect(prisma.tryOnTask.update).toHaveBeenCalledWith({
        where: { id: 'task-2' },
        data: expect.objectContaining({
          status: TaskStatus.FAILED,
          errorMessage: 'GrsAi task succeeded without a result image URL',
          metadata: expect.objectContaining({
            serviceType: 'grsai',
            externalTaskId: 'grsai-task-id',
            lastExternalStatus: 'succeeded',
          }),
        }),
      })
      expect(result.status).toBe(TaskStatus.FAILED)
      expect(result.error).toBe('GrsAi task succeeded without a result image URL')
    })

    it('should retry once when GrsAi fails with timeout', async () => {
      const mockTask = {
        id: 'task-3',
        userId: 'user-1',
        userImageUrl: 'http://blob/user.jpg',
        itemImageUrl: 'http://blob/item.jpg',
        type: 'GLASSES',
        status: TaskStatus.PROCESSING,
        metadata: {
          serviceType: 'grsai',
          externalTaskId: 'grsai-task-id-1',
          retryCount: 0,
          effectivePrompt: 'retry prompt',
        },
      }

      ;(prisma.tryOnTask.findUnique as jest.Mock).mockResolvedValue(mockTask)
      ;(pollTaskResult as jest.Mock).mockResolvedValue({
        status: 'failed',
        error: 'google gemini timeout...',
        diagnostics: {
          code: 0,
          message: 'success',
          rawStatus: 'failed',
          failureReason: 'error',
        },
      })
      ;(submitAsyncTask as jest.Mock).mockResolvedValue('grsai-task-id-2')
      ;(prisma.tryOnTask.update as jest.Mock).mockResolvedValue({})

      const result = await getTryOnResult('task-3')

      expect(submitAsyncTask).toHaveBeenCalledWith(
        'http://blob/user.jpg',
        'http://blob/item.jpg',
        'retry prompt'
      )
      expect(prisma.tryOnTask.update).toHaveBeenCalledWith({
        where: { id: 'task-3' },
        data: expect.objectContaining({
          status: TaskStatus.PROCESSING,
          errorMessage: null,
          metadata: expect.objectContaining({
            externalTaskId: 'grsai-task-id-2',
            previousExternalTaskId: 'grsai-task-id-1',
            retryCount: 1,
            lastRetryReason: 'google gemini timeout...',
          }),
        }),
      })
      expect(result.status).toBe(TaskStatus.PROCESSING)
      expect(result.progress).toBe(0)
    })

    it('should recover a failed task if it still has an external task ID and GrsAi later succeeds', async () => {
      const mockTask = {
        id: 'task-recover',
        userId: 'user-1',
        status: TaskStatus.FAILED,
        errorMessage: 'Network error',
        metadata: {
          serviceType: 'grsai',
          externalTaskId: 'grsai-task-id-recover',
          retryCount: 0,
        },
      }

      ;(prisma.tryOnTask.findUnique as jest.Mock).mockResolvedValue(mockTask)
      ;(pollTaskResult as jest.Mock).mockResolvedValue({
        status: 'succeeded',
        imageUrl: 'http://result-recover.jpg',
      })
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        blob: jest.fn().mockResolvedValue(new Blob(['fake-image'], { type: 'image/png' }))
      })
      ;(prisma.tryOnTask.updateMany as jest.Mock).mockResolvedValue({ count: 1 })

      const result = await getTryOnResult('task-recover')

      expect(pollTaskResult).toHaveBeenCalledWith('grsai-task-id-recover')
      expect(prisma.tryOnTask.updateMany).toHaveBeenCalledWith({
        where: {
          id: 'task-recover',
          status: { not: TaskStatus.COMPLETED }
        },
        data: expect.objectContaining({
          status: TaskStatus.COMPLETED,
          resultImageUrl: 'http://blob/test.jpg',
        }),
      })
      expect(result.status).toBe(TaskStatus.COMPLETED)
      expect(result.isNewCompletion).toBe(true)
    })
  })
})
