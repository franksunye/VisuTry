/** @jest-environment node */
import { randomUUID } from 'node:crypto'
import { appendFileSync } from 'node:fs'
import { Readable } from 'node:stream'
import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { prisma } from '@/lib/prisma'
import { GET as tryRead } from '@/app/api/try-on/[id]/media/[kind]/route'
import { GET as tryShare } from '@/app/api/share/try-on/[id]/result/route'
import { DELETE as tryDelete } from '@/app/api/try-on/[id]/route'
import { POST as trySubmit } from '@/app/api/try-on/submit/route'
import { POST as tryPoll } from '@/app/api/try-on/poll/route'
import { GET as faceRead } from '@/app/api/face-analysis/[id]/photo/route'
import { DELETE as faceDelete } from '@/app/api/face-analysis/[id]/route'
import { POST as faceSubmit } from '@/app/api/face-analysis/submit/route'
import { GET as tryAdmin } from '@/app/api/admin/try-on/[id]/media/[kind]/route'
import { GET as faceAdmin } from '@/app/api/admin/face-analysis/[id]/photo/route'
import { ConsumerMediaNotFound, deleteR2Media, readR2Media } from '@/lib/consumer-r2-media'
import { submitAsyncTask, pollTaskResult } from '@/lib/grsai'
import { del, get, put } from '@vercel/blob'

jest.mock('next-auth/next', () => ({ getServerSession: jest.fn() }))
jest.mock('@/lib/auth', () => ({ authOptions: {} }))
jest.mock('next/cache', () => ({ revalidateTag: jest.fn() }))
jest.mock('@/lib/mocks', () => ({ isMockMode: false }))
jest.mock('@/lib/function-observability', () => ({ withFunctionObservation: (_name, _domain, fn) => fn }))
jest.mock('@/lib/logger', () => ({
  logger: { debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() },
  getRequestContext: () => ({}),
  getRequestLanguageContext: () => ({}),
}))
jest.mock('@/lib/generation/ai-provider-routing', () => ({
  selectNewTryOnProvider: () => 'grsai', selectFaceAnalysisProvider: () => 'grsai',
}))
jest.mock('@/lib/grsai', () => ({ submitAsyncTask: jest.fn(), pollTaskResult: jest.fn() }))
jest.mock('@/lib/kie', () => ({ submitKieTask: jest.fn(), pollKieTask: jest.fn() }))
jest.mock('@/lib/gemini', () => ({ generateTryOnImage: jest.fn() }))
jest.mock('@/lib/grsai-face-analysis', () => ({
  analyzeFaceWithGrsAi: jest.fn(async () => JSON.stringify({ faceShape: 'oval', confidence: 0.95 })),
}))
jest.mock('@/lib/kie-face-analysis', () => ({ analyzeFaceWithKie: jest.fn(), KIE_FACE_ANALYSIS_MODEL: 'synthetic' }))
jest.mock('@vercel/blob', () => ({ put: jest.fn(), get: jest.fn(), del: jest.fn(), head: jest.fn(),
  BlobNotFoundError: class extends Error {} }))
jest.mock('@/lib/consumer-r2-media', () => {
  const actual = jest.requireActual('@/lib/consumer-r2-media')
  return {
    ...actual,
    writeR2Media: (ref: string, data: Blob, kind: Kind) => {
      recordReference(ref, kind)
      return actual.writeR2Media(ref, data, kind)
    },
  }
})
jest.mock('@/lib/consumer-media-staging', () => {
  const actual = jest.requireActual('@/lib/consumer-media-staging')
  return {
    ...actual,
    trackConsumerMedia: (refs: string[], db?: unknown) => {
      for (const ref of refs) recordReference(ref, ref.startsWith('r2:face-analysis/') ? 'face' : ref.split('/')[1] as Kind)
      return actual.trackConsumerMedia(refs, db)
    },
  }
})
jest.mock('@aws-sdk/client-s3', () => {
  const actual = jest.requireActual('@aws-sdk/client-s3')
  if (process.env.VISUTRY_WORKFLOW_MODE !== 'local') return actual
  return { ...actual, S3Client: class extends actual.S3Client {
    constructor(config: object) { super({ ...config, maxAttempts: 1, requestHandler: { handle: mockS3 } }) }
  } }
})

type Kind = 'user' | 'item' | 'result' | 'face'
const run = process.env.VISUTRY_WORKFLOW_RUN ?? randomUUID()
const journal = process.env.VISUTRY_WORKFLOW_JOURNAL
if (!/^[a-f0-9-]{36}$/.test(run)) throw new Error('Invalid synthetic run')
const [owner, other, admin] = ['owner', 'other', 'admin'].map(role => 'qa-workflow-' + role + '-' + run)
const identities = [owner, other, admin]
const first = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVR4nGNgcPgPAAGDAUDj26nXAAAAAElFTkSuQmCC', 'base64')
const second = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVR4nGP4xeAIAAMzATxzUHivAAAAAElFTkSuQmCC', 'base64')
const providerUrl = 'https://file.grsai.com/qa/synthetic.png'
const blobHost = 'https://synthetic.private.blob.vercel-storage.com/'
const references = new Map<string, Kind>()
const wire = new Map<string, { bytes: Buffer; headers: Record<string, string> }>()
const blobs = new Map<string, { bytes: ArrayBuffer; contentType: string }>()
let prepared = false

function recordReference(ref: string, kind: Kind) {
  if (!/^r2:(?:(?:tryon\/(?:user|item)|face-analysis)\/[a-f0-9-]{36}|tryon\/result\/[a-z0-9]{20,32})$/.test(ref)) {
    throw new Error('Unexpected fixture reference')
  }
  if (references.has(ref)) return
  if (journal) appendFileSync(journal, ref + '\n', { mode: 0o600 })
  references.set(ref, kind)
}

function checkpoint(value: string) {
  if (journal) appendFileSync(journal + '.progress', value + '\n', { mode: 0o600 })
}

function mockS3(req: { path: string; method: string; body: Buffer; headers: Record<string, string> }) {
  const saved = wire.get(req.path)
  const respond = (statusCode: number, headers = {}, bytes?: Buffer | string) => ({
    response: { statusCode, headers, body: bytes === undefined ? undefined : Readable.from([Buffer.from(bytes)]) },
  })
  if (req.method === 'PUT') {
    if (saved) return respond(412, { 'content-type': 'application/xml' }, '<Error><Code>PreconditionFailed</Code></Error>')
    wire.set(req.path, { bytes: req.body, headers: req.headers })
    return respond(200)
  }
  if (req.method === 'DELETE') { wire.delete(req.path); return respond(204) }
  if (!saved) return req.method === 'HEAD' ? respond(404) :
    respond(404, { 'content-type': 'application/xml' }, '<Error><Code>NoSuchKey</Code></Error>')
  return respond(200, saved.headers, req.method === 'HEAD' ? undefined : saved.bytes)
}

function session(id?: string, role = 'USER') {
  jest.mocked(getServerSession).mockResolvedValue(id ? { user: { id, role } } as never : null)
}
function request(path: string, body?: BodyInit) {
  return new NextRequest('http://127.0.0.1:3199' + path, body ? {
    method: 'POST', body, ...(typeof body === 'string' ? { headers: { 'content-type': 'application/json' } } : {}),
  } : undefined)
}
function upload(two: boolean, key = 'initial') {
  const form = new FormData()
  form.set('userImage', new File([new Uint8Array(first)], 'synthetic.png', { type: 'image/png' }))
  if (two) form.set('itemImage', new File([new Uint8Array(second)], 'synthetic-frame.png', { type: 'image/png' }))
  form.set('clientSubmissionId', run + '-' + key)
  return form
}
async function submitted(response: Response) {
  const body = await response.json()
  expect(response.status).toBe(200)
  expect(JSON.stringify(body)).not.toMatch(/r2:|cloudflarestorage\.com|private\.blob\.vercel-storage\.com/)
  expect(body.data?.taskId).toBeTruthy()
  return body.data.taskId as string
}
async function image(response: Response) {
  expect(response.status).toBe(200)
  expect(response.headers.get('location')).toBeNull()
  expect(response.headers.get('cache-control')).toBe('private, no-store')
  expect(response.headers.get('content-type')).toBe('image/png')
  expect(Buffer.from(await response.arrayBuffer())).toEqual(first)
}
const fixtureCounts = () => Promise.all([prisma.user.count(), prisma.tryOnTask.count(), prisma.faceAnalysisTask.count(),
  prisma.consumerMediaStaging.count(), prisma.generationRequest.count(), prisma.generationAttempt.count()])

beforeAll(async () => {
  const mode = process.env.VISUTRY_WORKFLOW_MODE
  const url = new URL(process.env.DATABASE_URL ?? '')
  const local = mode === 'local' && process.env.APP_ENV === 'local' && url.hostname === '127.0.0.1' &&
    /^55\d{3}$/.test(url.port) && url.pathname === '/visutry_workflow_local' &&
    process.env.CONSUMER_MEDIA_R2_BUCKET === 'visutry-workflow-mock'
  const hosted = mode === 'preview' && process.env.VERCEL_ENV === 'preview' && process.env.APP_ENV === 'preview' &&
    url.hostname === 'ep-broad-darkness-ad7lemwv-pooler.c-2.us-east-1.aws.neon.tech' &&
    url.username === 'visutry_r2_qa_owner' && url.pathname === '/visutry_r2_preview_qa' &&
    process.env.CONSUMER_MEDIA_R2_BUCKET === 'visutry-r2-preview-qa' && Boolean(journal && process.env.VISUTRY_WORKFLOW_RUN)
  if (!local && !hosted) throw new Error('Refusing nonisolated workflow target')
  expect(await prisma.environmentMetadata.findUnique({ where: { id: 'primary' }, select: {
    environment: true, databaseIdentity: true,
  } })).toEqual(local ? { environment: 'LOCAL', databaseIdentity: 'local-visutry-workflow-disposable' } :
    { environment: 'PREVIEW', databaseIdentity: 'neon:steep-silence-18355430:br-empty-dew-adt2q51f' })
  expect(await fixtureCounts()).toEqual([0, 0, 0, 0, 0, 0])
  prepared = true
  checkpoint('target-verified')
  await prisma.user.createMany({ data: [{ id: owner, creditsPurchased: 12 }, { id: other }, { id: admin, role: 'ADMIN' }] })
  process.env.TRY_ON_BLOB_ACCESS_MODE = process.env.FACE_ANALYSIS_BLOB_ACCESS_MODE = 'private'
  process.env.TRY_ON_BLOB_STORE_ID = process.env.FACE_ANALYSIS_BLOB_STORE_ID = 'synthetic'
  process.env.RPIVATE_BLOB_READ_WRITE_TOKEN = 'synthetic-memory-adapter-not-a-credential'
  jest.mocked(put).mockImplementation((async (path, body, options) => {
    expect(options?.access).toBe('private')
    if (typeof path !== 'string' || !(body instanceof Blob)) throw new Error('Unexpected Blob operation')
    blobs.set(path, { bytes: await body.arrayBuffer(), contentType: body.type })
    return { url: blobHost + path, pathname: path }
  }) as never)
  jest.mocked(get).mockImplementation(((path: string) => {
    const item = blobs.get(path)
    return item ? { blob: { contentType: item.contentType }, stream: new Response(item.bytes).body } : null
  }) as never)
  jest.mocked(del).mockImplementation((async (ref: string) => { blobs.delete(ref.replace(blobHost, '')) }) as never)
  jest.mocked(submitAsyncTask).mockResolvedValue('synthetic-' + run)
  jest.mocked(pollTaskResult).mockResolvedValue({ status: 'succeeded', imageUrl: providerUrl, progress: 100 })
  jest.spyOn(globalThis, 'fetch').mockImplementation(async resource => {
    if (String(resource) === providerUrl) return new Response(new Uint8Array(first), { headers: { 'content-type': 'image/png' } })
    throw new Error('Unexpected outbound Fetch from workflow')
  })
})

afterAll(async () => {
  try {
    if (!prepared) return
    const cleanup = await Promise.allSettled([...references].map(async ([ref, kind]) => {
      await deleteR2Media(ref)
      await expect(readR2Media(ref, kind)).rejects.toBeInstanceOf(ConsumerMediaNotFound)
    }))
    expect(cleanup.every(result => result.status === 'fulfilled')).toBe(true)
    await prisma.consumerMediaStaging.deleteMany({ where: { reference: { in: [...references.keys()] } } })
    await prisma.generationRequest.deleteMany({ where: { userId: { in: identities } } })
    await prisma.user.deleteMany({ where: { id: { in: identities } } })
    expect(await fixtureCounts()).toEqual([0, 0, 0, 0, 0, 0])
    expect(wire.size).toBe(0)
    checkpoint('objects-and-database-clean')
  } finally {
    jest.restoreAllMocks()
    await prisma.$disconnect()
  }
}, 75_000)

test('Consumer submissions, pinned dispatch, role boundaries, rollback and cleanup', async () => {
  process.env.CONSUMER_MEDIA_WRITE_PROVIDER = 'r2'
  session(owner)
  const tryId = await submitted(await trySubmit(request('/api/try-on/submit', upload(true))))
  const faceId = await submitted(await faceSubmit(request('/api/face-analysis/submit', upload(false))))
  const tryParams = { params: { id: tryId, kind: 'result' } }
  const faceParams = { params: { id: faceId } }
  const media = request('/api/consumer-media')
  const pending = await prisma.tryOnTask.findUniqueOrThrow({ where: { id: tryId } })
  expect(pending.userImageUrl).toMatch(/^r2:/)
  expect(pending.itemImageUrl).toMatch(/^r2:/)
  expect(await prisma.consumerMediaStaging.count()).toBe(0)
  expect(jest.mocked(submitAsyncTask).mock.calls[0].slice(0, 2)).toEqual([
    'data:image/png;base64,' + first.toString('base64'), 'data:image/png;base64,' + second.toString('base64'),
  ])
  checkpoint('both-submitted')

  process.env.CONSUMER_MEDIA_WRITE_PROVIDER = 'vercel-blob'
  const poll = (taskId: string) => tryPoll(request('/api/try-on/poll', JSON.stringify({ taskId })))
  expect((await poll(tryId)).status).toBe(200)
  expect((await poll(tryId)).status).toBe(200)
  const completed = await prisma.tryOnTask.findUniqueOrThrow({ where: { id: tryId } })
  expect(completed.status).toBe('COMPLETED')
  expect(completed.resultImageUrl).toBe('r2:tryon/result/' + tryId)
  expect((await prisma.user.findUniqueOrThrow({ where: { id: owner } })).creditsUsed).toBe(2)
  await image(await tryRead(media, tryParams))
  await image(await faceRead(media, faceParams))
  expect(jest.mocked(put)).not.toHaveBeenCalled()
  checkpoint('pinned-result-and-owner-reads')

  session()
  expect((await tryRead(media, tryParams)).status).toBe(401)
  expect((await faceRead(media, faceParams)).status).toBe(401)
  await image(await tryShare(media, { params: { id: tryId } }))
  session(other)
  expect((await tryRead(media, tryParams)).status).toBe(403)
  expect((await faceRead(media, faceParams)).status).toBe(404)
  expect((await tryDelete(media, tryParams)).status).toBe(403)
  expect((await faceDelete(media, faceParams)).status).toBe(404)
  expect((await tryAdmin(media, tryParams)).status).toBe(403)
  expect((await faceAdmin(media, faceParams)).status).toBe(403)
  session(admin, 'ADMIN')
  await image(await tryAdmin(media, tryParams))
  await image(await faceAdmin(media, faceParams))
  checkpoint('role-boundaries')

  session(owner)
  const rollbackTry = await submitted(await trySubmit(request('/api/try-on/submit', upload(true, 'rollback'))))
  const rollbackFace = await submitted(await faceSubmit(request('/api/face-analysis/submit', upload(false, 'rollback'))))
  expect((await poll(rollbackTry)).status).toBe(200)
  expect(jest.mocked(put)).toHaveBeenCalledTimes(4)
  await prisma.tryOnTask.update({ where: { id: rollbackTry }, data: { metadata: {} } })
  await prisma.faceAnalysisTask.update({ where: { id: rollbackFace }, data: { metadata: {} } })
  process.env.CONSUMER_MEDIA_WRITE_PROVIDER = 'r2'
  const oldTry = { params: { id: rollbackTry, kind: 'result' } }
  const oldFace = { params: { id: rollbackFace } }
  await image(await tryRead(media, oldTry))
  await image(await faceRead(media, oldFace))
  expect(jest.mocked(get)).toHaveBeenCalled()
  expect((await tryDelete(media, oldTry)).status).toBe(200)
  expect((await faceDelete(media, oldFace)).status).toBe(200)
  expect(blobs.size).toBe(0)
  checkpoint('rollback-and-legacy-blob')
  expect((await tryDelete(media, tryParams)).status).toBe(200)
  expect((await faceDelete(media, faceParams)).status).toBe(200)
  expect(await prisma.tryOnTask.count()).toBe(0)
  expect(await prisma.faceAnalysisTask.count()).toBe(0)
  expect(references.size).toBe(4)
  for (const [ref, kind] of references) await expect(readR2Media(ref, kind)).rejects.toBeInstanceOf(ConsumerMediaNotFound)
}, 120_000)
