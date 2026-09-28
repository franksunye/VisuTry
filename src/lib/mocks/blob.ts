// Filesystem-backed Local mock Blob adapter. Runtime data stays under ignored
// .local/mock-blob so Local Store media remains readable across app restarts.
import { promises as fs } from 'node:fs'
import path from 'node:path'
import { randomUUID } from 'node:crypto'
import { isMockMode } from './index'

const MOCK_BLOB_ORIGIN = 'https://mock-blob-storage.vercel.app'
const LOCAL_ROOT = path.resolve(process.cwd(), '.local')
const DEFAULT_ROOT = path.join(LOCAL_ROOT, 'mock-blob')

export interface MockBlobResult {
  url: string
  downloadUrl: string
  pathname: string
  size: number
  uploadedAt: Date
}

type MockBlobMetadata = {
  pathname: string
  size: number
  contentType: string
  uploadedAt: string
}

function isWithin(parent: string, candidate: string): boolean {
  return candidate.startsWith(`${parent}${path.sep}`)
}

function normalizeKey(value: string): string {
  if (!value || value.includes('\\') || value.includes('\0') || path.isAbsolute(value)) {
    throw new Error('Invalid Local mock Blob pathname')
  }

  const segments = value.split('/').map((part) => {
    let decoded: string
    try {
      decoded = decodeURIComponent(part)
    } catch {
      throw new Error('Invalid Local mock Blob pathname encoding')
    }
    if (
      !decoded || decoded === '.' || decoded === '..' ||
      decoded.includes('/') || decoded.includes('\\') || decoded.includes('\0') ||
      decoded.includes(':') || /[\u0000-\u001f\u007f]/.test(decoded)
    ) {
      throw new Error('Invalid Local mock Blob pathname')
    }
    return decoded
  })

  return segments.join('/')
}

function keyFromInput(value: string): string | null {
  if (value.startsWith('http://') || value.startsWith('https://')) {
    let url: URL
    try {
      url = new URL(value)
    } catch {
      return null
    }
    if (url.origin !== MOCK_BLOB_ORIGIN) return null
    return normalizeKey(url.pathname.replace(/^\//, ''))
  }
  return normalizeKey(value.replace(/^\//, ''))
}

function providerUrl(pathname: string, download = false): string {
  const encodedPath = pathname.split('/').map(encodeURIComponent).join('/')
  return `${MOCK_BLOB_ORIGIN}/${encodedPath}${download ? '?download=1' : ''}`
}

async function bytesFor(body: string | Buffer | ReadableStream | File): Promise<Buffer> {
  if (typeof body === 'string') return Buffer.from(body, 'utf8')
  if (Buffer.isBuffer(body)) return body
  if (typeof File !== 'undefined' && body instanceof File) return Buffer.from(await body.arrayBuffer())
  return Buffer.from(await new Response(body).arrayBuffer())
}

/**
 * Small testable filesystem object store. Production/mock Blob entry points
 * always use DEFAULT_ROOT; an injected test root must still be under .local.
 */
export class FileSystemMockBlobStore {
  private readonly root: string

  constructor(root = DEFAULT_ROOT) {
    this.root = path.resolve(root)
    if (!isWithin(LOCAL_ROOT, this.root)) {
      throw new Error('Local mock Blob storage must remain under .local')
    }
  }

  private async ensureRoot(): Promise<void> {
    await fs.mkdir(LOCAL_ROOT, { recursive: true })
    const localStat = await fs.lstat(LOCAL_ROOT)
    if (localStat.isSymbolicLink() || !localStat.isDirectory()) {
      throw new Error('Local mock Blob .local root must be a real directory')
    }
    const relativeRoot = path.relative(LOCAL_ROOT, this.root)
    let current = LOCAL_ROOT
    for (const segment of relativeRoot.split(path.sep)) {
      if (!segment || segment === '.' || segment === '..') {
        throw new Error('Local mock Blob storage must remain under .local')
      }
      current = path.join(current, segment)
      try {
        await fs.mkdir(current)
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error
      }
      const stat = await fs.lstat(current)
      if (stat.isSymbolicLink() || !stat.isDirectory()) {
        throw new Error('Local mock Blob root must be a real directory')
      }
    }
    const realRoot = await fs.realpath(this.root)
    const realLocal = await fs.realpath(LOCAL_ROOT)
    if (!isWithin(realLocal, realRoot)) {
      throw new Error('Local mock Blob root resolved outside .local')
    }
  }

  private async ensureParent(key: string, create = true): Promise<string | null> {
    await this.ensureRoot()
    const segments = key.split('/')
    let current = this.root
    for (const segment of segments.slice(0, -1)) {
      current = path.join(current, segment)
      if (create) {
        try {
          await fs.mkdir(current)
        } catch (error) {
          if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error
        }
      }
      let stat: Awaited<ReturnType<typeof fs.lstat>>
      try {
        stat = await fs.lstat(current)
      } catch (error) {
        if (!create && (error as NodeJS.ErrnoException).code === 'ENOENT') return null
        throw error
      }
      if (stat.isSymbolicLink() || !stat.isDirectory()) {
        throw new Error('Local mock Blob path contains a non-directory segment')
      }
    }
    return current
  }

  private files(key: string) {
    const segments = key.split('/')
    const base = path.join(this.root, ...segments)
    if (!isWithin(this.root, base)) {
      throw new Error('Local mock Blob path must remain under .local/mock-blob')
    }
    return { data: `${base}.data`, metadata: `${base}.meta.json` }
  }

  async put(
    pathname: string,
    body: string | Buffer | ReadableStream | File,
    options?: { access?: 'public' | 'private'; contentType?: string },
  ): Promise<MockBlobResult> {
    const key = normalizeKey(pathname)
    const bytes = await bytesFor(body)
    const parent = await this.ensureParent(key, true)
    if (!parent) throw new Error('Local mock Blob object parent could not be created')
    const files = this.files(key)
    for (const file of [files.data, files.metadata]) {
      try {
        const stat = await fs.lstat(file)
        if (stat.isSymbolicLink() || !stat.isFile()) {
          throw new Error('Local mock Blob target is not a regular file')
        }
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
      }
    }

    const uploadedAt = new Date()
    const contentType = options?.contentType ||
      (typeof File !== 'undefined' && body instanceof File ? body.type : '') ||
      'application/octet-stream'
    const metadata: MockBlobMetadata = {
      pathname: key,
      size: bytes.byteLength,
      contentType,
      uploadedAt: uploadedAt.toISOString(),
    }
    const dataTemp = path.join(parent, `.mock-${randomUUID()}.data.tmp`)
    const metadataTemp = path.join(parent, `.mock-${randomUUID()}.meta.tmp`)
    try {
      await fs.writeFile(dataTemp, bytes, { flag: 'wx' })
      await fs.writeFile(metadataTemp, JSON.stringify(metadata), { flag: 'wx' })
      await fs.rename(dataTemp, files.data)
      await fs.rename(metadataTemp, files.metadata)
    } finally {
      await Promise.all([
        fs.rm(dataTemp, { force: true }),
        fs.rm(metadataTemp, { force: true }),
      ])
    }

    return {
      url: providerUrl(key),
      downloadUrl: providerUrl(key, true),
      pathname: key,
      size: bytes.byteLength,
      uploadedAt,
    }
  }

  async read(input: string): Promise<{ body: Buffer; contentType: string } | null> {
    const key = keyFromInput(input)
    if (!key) return null
    const parent = await this.ensureParent(key, false)
    if (!parent) return null
    const files = this.files(key)
    try {
      const [dataStat, metadataStat] = await Promise.all([
        fs.lstat(files.data),
        fs.lstat(files.metadata),
      ])
      if ([dataStat, metadataStat].some((stat) => stat.isSymbolicLink() || !stat.isFile())) {
        throw new Error('Local mock Blob object is not a regular file')
      }
      const [body, metadataText] = await Promise.all([
        fs.readFile(files.data),
        fs.readFile(files.metadata, 'utf8'),
      ])
      const metadata = JSON.parse(metadataText) as MockBlobMetadata
      if (metadata.pathname !== key) return null
      return { body, contentType: metadata.contentType || 'application/octet-stream' }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null
      throw error
    }
  }

  async del(input: string | string[]): Promise<void> {
    await this.ensureRoot()
    for (const value of Array.isArray(input) ? input : [input]) {
      const key = keyFromInput(value)
      if (!key) continue
      const parent = await this.ensureParent(key, false)
      if (!parent) continue
      const files = this.files(key)
      await Promise.all([
        fs.rm(files.data, { force: true }),
        fs.rm(files.metadata, { force: true }),
      ])
      // Remove empty object directories without crossing the canonical root.
      let directory = parent
      while (directory !== this.root && isWithin(this.root, directory)) {
        try {
          await fs.rmdir(directory)
        } catch {
          break
        }
        directory = path.dirname(directory)
      }
    }
  }

  async list(options?: { prefix?: string; limit?: number }): Promise<{ blobs: MockBlobResult[] }> {
    await this.ensureRoot()
    const output: MockBlobResult[] = []
    const visit = async (directory: string): Promise<void> => {
      for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
        const fullPath = path.join(directory, entry.name)
        if (entry.isSymbolicLink()) continue
        if (entry.isDirectory()) {
          await visit(fullPath)
          continue
        }
        if (!entry.isFile() || !entry.name.endsWith('.meta.json')) continue
        const text = await fs.readFile(fullPath, 'utf8')
        const metadata = JSON.parse(text) as MockBlobMetadata
        const key = normalizeKey(metadata.pathname)
        if (options?.prefix && !key.startsWith(options.prefix)) continue
        const { data } = this.files(key)
        try {
          const stat = await fs.lstat(data)
          if (stat.isSymbolicLink() || !stat.isFile()) continue
          await fs.access(data)
        } catch {
          continue
        }
        const uploadedAt = new Date(metadata.uploadedAt)
        output.push({
          url: providerUrl(key),
          downloadUrl: providerUrl(key, true),
          pathname: key,
          size: metadata.size,
          uploadedAt: Number.isNaN(uploadedAt.getTime()) ? new Date(0) : uploadedAt,
        })
        if (options?.limit && output.length >= options.limit) return
      }
    }
    await visit(this.root)
    return { blobs: output }
  }
}

const localMockBlobStore = new FileSystemMockBlobStore()

export function readMockBlob(providerUrlOrPath: string) {
  return localMockBlobStore.read(providerUrlOrPath)
}

export class MockBlob {
  static async put(
    pathname: string,
    body: string | Buffer | ReadableStream | File,
    options?: { access?: 'public' | 'private'; contentType?: string },
  ): Promise<MockBlobResult> {
    if (!isMockMode) throw new Error('Mock Blob called in non-mock mode')
    return localMockBlobStore.put(pathname, body, options)
  }

  static async del(url: string | string[]): Promise<void> {
    if (!isMockMode) throw new Error('Mock Blob called in non-mock mode')
    await localMockBlobStore.del(url)
  }

  static async list(options?: { prefix?: string; limit?: number }): Promise<{ blobs: MockBlobResult[] }> {
    if (!isMockMode) throw new Error('Mock Blob called in non-mock mode')
    return localMockBlobStore.list(options)
  }
}

// Mock image processing utilities
export function createMockImageUrl(type: 'user' | 'glasses' | 'result', id?: string): string {
  const colors = { user: '87CEEB', glasses: '8B4513', result: '98FB98' }
  const texts = { user: 'User+Photo', glasses: 'Glasses+Frame', result: 'Try-On+Result' }
  const suffix = id ? `+${id}` : ''
  return `https://via.placeholder.com/400x400/${colors[type]}/000000?text=${texts[type]}${suffix}`
}

export function validateMockFile(file: File): { valid: boolean; error?: string } {
  const maxSize = 5 * 1024 * 1024
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
  if (file.size > maxSize) return { valid: false, error: 'File size exceeds 5MB limit' }
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'File type not supported. Please use JPEG, PNG, or WebP.' }
  }
  return { valid: true }
}

export async function mockBlobUpload(
  filename: string,
  file: File,
  options?: { access?: 'public' | 'private'; contentType?: string },
): Promise<MockBlobResult> {
  return MockBlob.put(filename, file, options)
}
