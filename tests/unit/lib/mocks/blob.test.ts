import { promises as fs } from 'node:fs'
import path from 'node:path'
import { FileSystemMockBlobStore } from '@/lib/mocks/blob'

const localRoot = path.resolve(process.cwd(), '.local')

async function testRoot() {
  await fs.mkdir(localRoot, { recursive: true })
  return fs.mkdtemp(path.join(localRoot, 'mock-blob-test-'))
}

describe('filesystem-backed Local mock Blob', () => {
  let root: string

  beforeEach(async () => { root = await testRoot() })
  afterEach(async () => { await fs.rm(root, { recursive: true, force: true }) })

  it('keeps shopper/photo bytes and content type across store instance reset', async () => {
    const firstProcess = new FileSystemMockBlobStore(root)
    const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/pS8AAAAASUVORK5CYII=', 'base64')
    const stored = await firstProcess.put('store/session/photo.png', png, { contentType: 'image/png' })

    // A new adapter instance models a new Node/Next process with no shared Map.
    const restartedProcess = new FileSystemMockBlobStore(root)
    await expect(restartedProcess.read(stored.url)).resolves.toEqual({ body: png, contentType: 'image/png' })
    await expect(restartedProcess.list({ prefix: 'store/session' })).resolves.toMatchObject({
      blobs: [{ pathname: 'store/session/photo.png', size: png.byteLength }],
    })
  })

  it('deletes persisted bytes and metadata', async () => {
    const store = new FileSystemMockBlobStore(root)
    const stored = await store.put('tryon/result/task-1.png', Buffer.from([1, 2, 3]), { contentType: 'image/png' })
    await store.del(stored.url)
    await expect(store.read(stored.url)).resolves.toBeNull()
    await expect(store.list()).resolves.toEqual({ blobs: [] })
  })

  it('rejects traversal, encoded traversal, and an injected root outside .local', async () => {
    const store = new FileSystemMockBlobStore(root)
    await expect(store.put('../outside.png', Buffer.from([1]))).rejects.toThrow(/pathname/)
    await expect(store.put('%2e%2e/outside.png', Buffer.from([1]))).rejects.toThrow(/pathname/)
    await expect(store.read('%2e%2e/outside.png')).rejects.toThrow(/pathname/)
    // URL parsing normalizes encoded dot segments, so an already-normalized
    // external-style path is simply an absent object and never escapes root.
    await expect(store.read('https://mock-blob-storage.vercel.app/%2e%2e/outside.png')).resolves.toBeNull()
    await expect(fs.access(path.resolve(process.cwd(), '.local', 'outside.png'))).rejects.toThrow()
    expect(() => new FileSystemMockBlobStore(path.resolve(process.cwd(), 'outside'))).toThrow(/under .local/)
  })
})
