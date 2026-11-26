/** @jest-environment node */
import { Readable } from 'node:stream'
import { NextRequest } from 'next/server'
import { GET as getTryOnMedia } from '@/app/api/try-on/[id]/media/[kind]/route'
import { GET as getShareResult } from '@/app/api/share/try-on/[id]/result/route'
import { GET as getFacePhoto } from '@/app/api/face-analysis/[id]/photo/route'
import { DELETE as deleteTryOn } from '@/app/api/try-on/[id]/route'
import { DELETE as deleteFace } from '@/app/api/face-analysis/[id]/route'
import { requireAuth } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma'
import { consumerMediaProvider, consumerMediaWriteProvider, pinnedTryOnResultStorage } from '@/lib/consumer-media-reference'
import { writeR2Media } from '@/lib/consumer-r2-media'
import { calculateExpiresAt } from '@/config/retention'
import { tryOnProviderMediaInput } from '@/lib/tryon-media-loader'

const mockS3Request = jest.fn()
jest.mock('@aws-sdk/client-s3', () => {
  const actual = jest.requireActual('@aws-sdk/client-s3')
  return {
    ...actual,
    S3Client: class extends actual.S3Client {
      constructor(config: object) {
        super({ ...config, maxAttempts: 1, requestHandler: { handle: mockS3Request } })
      }
    },
  }
})
jest.mock('@/lib/api-auth', () => ({ requireAuth: jest.fn() }))
jest.mock('@/lib/prisma', () => ({
  prisma: {
    tryOnTask: { findUnique: jest.fn(), updateMany: jest.fn(), delete: jest.fn() },
    faceAnalysisTask: { findFirst: jest.fn(), updateMany: jest.fn(), delete: jest.fn() },
  },
}))
jest.mock('@/lib/mocks', () => ({ isMockMode: false }))
jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
  getRequestContext: jest.fn(),
}))

type WireRequest = { hostname: string; path: string; method: string; headers: Record<string, string>; body: Buffer }
const objects = new Map<string, { body: Buffer; headers: Record<string, string> }>()
let deny = false
let puts = 0
const png = new Blob([new Uint8Array([1, 2, 3])], { type: 'image/png' })
const userRef = 'r2:tryon/user/synthetic-user'
const resultRef = 'r2:tryon/result/synthetic'
const faceRef = 'r2:face-analysis/synthetic-face'
const future = () => new Date(Date.now() + 60_000)

function response(statusCode: number, headers: Record<string, string> = {}, body?: Buffer | string) {
  return { response: { statusCode, headers, body: body === undefined ? undefined : Readable.from([Buffer.from(body)]) } }
}

function fixtureRouter(request: WireRequest) {
  if (deny) return response(403, { 'content-type': 'application/xml' }, '<Error><Code>AccessDenied</Code></Error>')
  const saved = objects.get(request.path)
  if (request.method === 'PUT') {
    expect(request.hostname).toBe('a'.repeat(32) + '.r2.cloudflarestorage.com')
    expect(request.path.startsWith('/visutry-test/')).toBe(true)
    expect(request.headers.authorization).toMatch(/^AWS4-HMAC-SHA256 /)
    expect(request.headers['if-none-match']).toBe('*')
    expect(request.headers['x-amz-storage-class']).toBe('STANDARD')
    if (saved) return response(412, { 'content-type': 'application/xml' }, '<Error><Code>PreconditionFailed</Code></Error>')
    puts++
    objects.set(request.path, { body: request.body, headers: request.headers })
    return response(200)
  }
  if (request.method === 'DELETE') {
    objects.delete(request.path)
    return response(204)
  }
  if (!saved) {
    return request.method === 'HEAD' ? response(404) :
      response(404, { 'content-type': 'application/xml' }, '<Error><Code>NoSuchKey</Code></Error>')
  }
  return response(200, saved.headers, request.method === 'HEAD' ? undefined : saved.body)
}

beforeAll(() => {
  process.env.CONSUMER_MEDIA_R2_ACCOUNT_ID = 'a'.repeat(32)
  process.env.CONSUMER_MEDIA_R2_BUCKET = 'visutry-test'
  process.env.CONSUMER_MEDIA_R2_ACCESS_KEY_ID = 'non-production-test-id'
  process.env.CONSUMER_MEDIA_R2_SECRET_ACCESS_KEY = 'non-production-test-secret'
})

afterAll(() => {
  for (const key of ['ACCOUNT_ID', 'BUCKET', 'ACCESS_KEY_ID', 'SECRET_ACCESS_KEY']) {
    delete process.env['CONSUMER_MEDIA_R2_' + key]
  }
})

beforeEach(() => {
  jest.clearAllMocks()
  objects.clear()
  puts = 0
  deny = false
  mockS3Request.mockImplementation(fixtureRouter)
  jest.mocked(requireAuth).mockResolvedValue({ ok: true, userId: 'owner' } as never)
})

const request = new NextRequest('http://localhost:3001/api/try-on/synthetic/media/result')

it('uses signed S3 commands, reconciles concurrent create-only writes, and delivers the first image after authorization', async () => {
  await Promise.all([
    writeR2Media(resultRef, png, 'result'),
    writeR2Media(resultRef, new Blob(['other'], { type: 'image/png' }), 'result'),
  ])
  expect(puts).toBe(1)
  expect(mockS3Request.mock.calls.map(([input]) => input.method)).toEqual(['PUT', 'PUT', 'HEAD'])
  jest.mocked(prisma.tryOnTask.findUnique).mockResolvedValue({
    resultImageUrl: resultRef, userId: 'owner', status: 'COMPLETED', expiresAt: future(),
  } as never)

  const result = await getTryOnMedia(request, { params: { id: 'synthetic', kind: 'result' } })
  expect(result.status).toBe(200)
  expect(result.headers.get('cache-control')).toBe('private, no-store')
  expect(result.headers.get('content-type')).toBe('image/png')
  expect(result.headers.get('x-content-type-options')).toBe('nosniff')
  expect(result.headers.get('location')).toBeNull()
  const saved = objects.get('/visutry-test/tryon/result/synthetic')!
  expect(Buffer.from(await result.arrayBuffer())).toEqual(saved.body)
  expect((await getShareResult(request, { params: { id: 'synthetic' } })).status).toBe(200)
})

it('denies cross-user reads before S3 and distinguishes missing objects from storage permission failures', async () => {
  const params = { params: { id: 'synthetic', kind: 'result' } }
  const row = { userId: 'other-user', resultImageUrl: resultRef, expiresAt: future() }
  jest.mocked(prisma.tryOnTask.findUnique).mockResolvedValue(row as never)
  expect((await getTryOnMedia(request, params)).status).toBe(403)
  expect(mockS3Request).not.toHaveBeenCalled()
  row.userId = 'owner'
  expect((await getTryOnMedia(request, params)).status).toBe(404)
  deny = true
  expect((await getTryOnMedia(request, params)).status).toBe(502)
  row.expiresAt = new Date(0)
  mockS3Request.mockClear()
  expect((await getTryOnMedia(request, params)).status).toBe(404)
  expect(mockS3Request).not.toHaveBeenCalled()
})

it('serves an unlocked owner Face Analysis photo as same-origin bytes and reads selected retry source files inline', async () => {
  await writeR2Media(faceRef, png, 'face')
  await writeR2Media(userRef, png, 'user')
  jest.mocked(prisma.faceAnalysisTask.findFirst).mockResolvedValue({
    userImageUrl: faceRef, metadata: { mediaProvider: 'r2' }, expiresAt: future(),
  } as never)
  const result = await getFacePhoto(request, { params: { id: 'face' } })
  expect(result.status).toBe(200)
  expect(result.headers.get('location')).toBeNull()
  expect(Buffer.from(await result.arrayBuffer())).toEqual(Buffer.from([1, 2, 3]))
  expect(prisma.faceAnalysisTask.findFirst).toHaveBeenCalledWith(expect.objectContaining({
    where: { id: 'face', userId: 'owner', reportUnlocked: true, status: 'COMPLETED' },
  }))
  expect(await tryOnProviderMediaInput(userRef, 'user')).toBe('data:image/png;base64,AQID')
  await expect(tryOnProviderMediaInput(userRef, 'item')).rejects.toThrow('Invalid consumer R2 media reference')
  await expect(tryOnProviderMediaInput('https://example.com/photo.jpg', 'user')).rejects.toThrow('Unrecognized')
})

it('deletes both user features object-first and retains the record if deletion is denied', async () => {
  await writeR2Media(resultRef, png, 'result')
  await writeR2Media(userRef, png, 'user')
  await writeR2Media(faceRef, png, 'face')
  jest.mocked(prisma.tryOnTask.findUnique).mockResolvedValue({
    id: 'synthetic', origin: 'CONSUMER', userId: 'owner', userImageUrl: userRef, itemImageUrl: '',
    resultImageUrl: resultRef, metadata: { consumerResultStorage: 'r2' },
  } as never)
  jest.mocked(prisma.faceAnalysisTask.findFirst).mockResolvedValue({
    id: 'face', userId: 'owner', userImageUrl: faceRef, metadata: { mediaProvider: 'r2' },
  } as never)
  ;(prisma.tryOnTask.delete as jest.Mock).mockImplementation(async () => {
    expect(objects.has('/visutry-test/tryon/result/synthetic')).toBe(false)
    expect(objects.has('/visutry-test/tryon/user/synthetic-user')).toBe(false)
    return {} as never
  })
  ;(prisma.faceAnalysisTask.delete as jest.Mock).mockImplementation(async () => {
    expect(objects.size).toBe(0)
    return {} as never
  })
  deny = true
  expect((await deleteTryOn(request, { params: { id: 'synthetic' } })).status).toBe(500)
  expect(prisma.tryOnTask.delete).not.toHaveBeenCalled()
  expect((await deleteFace(request, { params: { id: 'face' } })).status).toBe(500)
  expect(prisma.faceAnalysisTask.delete).not.toHaveBeenCalled()
  deny = false
  expect((await deleteTryOn(request, { params: { id: 'synthetic' } })).status).toBe(200)
  expect((await deleteFace(request, { params: { id: 'face' } })).status).toBe(200)
  expect(objects.size).toBe(0)
})

it('rejects unknown selectors, preserves the default Blob writer, and never serves source keys through Share', async () => {
  expect(consumerMediaProvider('')).toBe('vercel-blob')
  expect(pinnedTryOnResultStorage({ consumerResultStorage: 'r2' })).toBe('r2')
  expect(() => consumerMediaProvider('anything')).toThrow()
  expect(() => pinnedTryOnResultStorage({ consumerResultStorage: 'anything' })).toThrow()
  jest.mocked(prisma.tryOnTask.findUnique).mockResolvedValue({
    status: 'COMPLETED', resultImageUrl: userRef, expiresAt: future(),
  } as never)
  const result = await getShareResult(request, { params: { id: 'synthetic' } })
  expect(result.status).toBe(502)
  expect(mockS3Request).not.toHaveBeenCalled()
})


it.each([
  [7, { isPremium: false, creditsPurchased: 0 }],
  [90, { isPremium: false, creditsPurchased: 1 }],
  [365, { isPremium: true }],
])('enforces the %i-day boundary for both Consumer workflows', async (days, plan) => {
  await writeR2Media(resultRef, png, 'result')
  await writeR2Media(faceRef, png, 'face')
  const before = new Date()
  before.setDate(before.getDate() + days)
  const expiresAt = calculateExpiresAt(plan)
  expect(Math.abs(expiresAt.getTime() - before.getTime())).toBeLessThan(1000)
  jest.mocked(prisma.tryOnTask.findUnique).mockResolvedValue({
    userId: 'owner', status: 'COMPLETED', resultImageUrl: resultRef, expiresAt,
  } as never)
  jest.mocked(prisma.faceAnalysisTask.findFirst).mockResolvedValue({
    userImageUrl: faceRef, metadata: { mediaProvider: 'r2' }, expiresAt,
  } as never)
  const clock = jest.spyOn(Date, 'now').mockReturnValue(expiresAt.getTime() - 1)
  try {
    expect((await getShareResult(request, { params: { id: 'synthetic' } })).status).toBe(200)
    expect((await getFacePhoto(request, { params: { id: 'face' } })).status).toBe(200)
    clock.mockReturnValue(expiresAt.getTime())
    expect((await getShareResult(request, { params: { id: 'synthetic' } })).status).toBe(404)
    expect((await getFacePhoto(request, { params: { id: 'face' } })).status).toBe(404)
  } finally {
    clock.mockRestore()
  }
})

it('limits the canary to explicit user IDs and keeps Blob writes on rollback', () => {
  const selector = process.env.CONSUMER_MEDIA_WRITE_PROVIDER
  const canary = process.env.CONSUMER_MEDIA_R2_CANARY_USER_IDS
  try {
    process.env.CONSUMER_MEDIA_WRITE_PROVIDER = 'r2'
    process.env.CONSUMER_MEDIA_R2_CANARY_USER_IDS = 'fixture-1, fixture-2'
    expect(consumerMediaWriteProvider('fixture-1')).toBe('r2')
    expect(consumerMediaWriteProvider('another-user')).toBe('vercel-blob')
    process.env.CONSUMER_MEDIA_R2_CANARY_USER_IDS = ','
    expect(() => consumerMediaWriteProvider('fixture-1')).toThrow()
    process.env.CONSUMER_MEDIA_WRITE_PROVIDER = 'vercel-blob'
    expect(consumerMediaWriteProvider('fixture-1')).toBe('vercel-blob')
  } finally {
    if (selector === undefined) delete process.env.CONSUMER_MEDIA_WRITE_PROVIDER
    else process.env.CONSUMER_MEDIA_WRITE_PROVIDER = selector
    if (canary === undefined) delete process.env.CONSUMER_MEDIA_R2_CANARY_USER_IDS
    else process.env.CONSUMER_MEDIA_R2_CANARY_USER_IDS = canary
  }
})
