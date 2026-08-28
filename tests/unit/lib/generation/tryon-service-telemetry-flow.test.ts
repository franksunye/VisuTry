/** @jest-environment node */

const TaskStatus = {
  PENDING: 'PENDING',
  PROCESSING: 'PROCESSING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
}

jest.mock('@prisma/client', () => ({
  TaskStatus: {
    PENDING: 'PENDING',
    PROCESSING: 'PROCESSING',
    COMPLETED: 'COMPLETED',
    FAILED: 'FAILED',
  },
  TryOnType: { GLASSES: 'GLASSES' },
  GenerationRequestFinalStatus: { STARTED: 'STARTED', COMPLETED: 'COMPLETED', FAILED: 'FAILED' },
  GenerationAttemptStatus: {
    STARTED: 'STARTED',
    SUBMITTED: 'SUBMITTED',
    COMPLETED: 'COMPLETED',
    FAILED: 'FAILED',
    TIMEOUT: 'TIMEOUT',
  },
  GenerationFailureStage: {
    SUBMIT: 'SUBMIT',
    PROVIDER_PROCESSING: 'PROVIDER_PROCESSING',
    POLL_NETWORK: 'POLL_NETWORK',
    STALE_DISPATCH: 'STALE_DISPATCH',
    ASSET_UPLOAD: 'ASSET_UPLOAD',
    INTERNAL: 'INTERNAL',
    UNKNOWN: 'UNKNOWN',
  },
  GenerationTelemetryOrigin: { CONSUMER: 'CONSUMER', STORE: 'STORE', CAMPAIGN: 'CAMPAIGN' },
  Prisma: { PrismaClientKnownRequestError: class PrismaClientKnownRequestError extends Error { code = '' } },
}))

jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}))

jest.mock('@vercel/blob', () => ({
  head: jest.fn(),
  put: jest.fn(async (path: string) => ({ url: `http://blob/${path}` })),
}))

jest.mock('@/lib/grsai', () => ({
  submitAsyncTask: jest.fn(),
  pollTaskResult: jest.fn(),
}))

jest.mock('@/lib/gemini', () => ({
  generateTryOnImage: jest.fn(),
}))

jest.mock('@/lib/prisma', () => {
  const { createInMemoryGenerationPrisma } = require('./in-memory-generation-prisma')
  const gen = createInMemoryGenerationPrisma()
  const tasks = new Map<string, any>()
  return {
    prisma: {
      ...gen,
      tryOnTask: {
        create: jest.fn(async ({ data }: any) => {
          const task = { id: 'task-flow-1', createdAt: new Date(), updatedAt: new Date(), ...data }
          tasks.set(task.id, task)
          return task
        }),
        findUnique: jest.fn(async ({ where }: any) => tasks.get(where.id) ?? null),
        update: jest.fn(async ({ where, data }: any) => {
          const current = tasks.get(where.id) ?? { id: where.id }
          const next = { ...current, ...data }
          tasks.set(where.id, next)
          return next
        }),
        updateMany: jest.fn(async ({ where, data }: any) => {
          const current = tasks.get(where.id)
          if (!current) return { count: 0 }
          if (where.status?.not && current.status === where.status.not) return { count: 0 }
          tasks.set(where.id, { ...current, ...data })
          return { count: 1 }
        }),
      },
    },
  }
})

import { submitTryOnTask } from '@/lib/tryon-service'
import { prisma } from '@/lib/prisma'
import { submitAsyncTask } from '@/lib/grsai'
import { put } from '@vercel/blob'

const db = prisma as any

describe('tryon-service generation telemetry flow', () => {
  const mockUser = { id: 'user-1', isPremium: false, premiumExpiresAt: null }
  const mockFile = {
    name: 'test.jpg',
    type: 'image/jpeg',
    arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(8)),
  } as unknown as File

  beforeEach(() => {
    jest.clearAllMocks()
    db._requests.splice(0, db._requests.length)
    db._attempts.splice(0, db._attempts.length)
    ;(put as jest.Mock).mockImplementation(async (path: string) => ({ url: `http://blob/${path}` }))
  })

  it('writes one request and one attempt for a successful first GrsAi attempt', async () => {
    ;(submitAsyncTask as jest.Mock).mockResolvedValue('ext-success')
    const submitted = await submitTryOnTask(mockUser as any, mockFile, mockFile, 'GLASSES', undefined, {
      clientSubmissionId: 'sub-flow-1',
    })

    expect(submitted.taskId).toBe('task-flow-1')
    expect(db._requests).toHaveLength(1)
    expect(db._attempts).toHaveLength(1)
    expect(db._attempts[0].status).toBe('SUBMITTED')
    expect(db._attempts[0].providerTaskId).toBe('ext-success')
    expect(db._requests[0].origin).toBe('CONSUMER')
    expect(db._requests[0].attemptCount).toBe(1)
  })
})
