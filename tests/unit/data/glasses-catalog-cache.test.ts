/** @jest-environment node */

type CacheState = {
  store: Map<string, unknown>
  tagged: Map<string, Set<string>>
}

function cacheState(): CacheState {
  const globalState = globalThis as { __GLASSES_CATALOG_TEST_CACHE__?: CacheState }
  if (!globalState.__GLASSES_CATALOG_TEST_CACHE__) {
    globalState.__GLASSES_CATALOG_TEST_CACHE__ = {
      store: new Map(),
      tagged: new Map(),
    }
  }
  return globalState.__GLASSES_CATALOG_TEST_CACHE__
}

jest.mock('next/cache', () => ({
  unstable_cache: (
    fn: () => Promise<unknown>,
    keys: string[],
    opts?: { tags?: string[] },
  ) => {
    return async () => {
      const state = (globalThis as unknown as { __GLASSES_CATALOG_TEST_CACHE__: CacheState }).__GLASSES_CATALOG_TEST_CACHE__
      const cacheKey = JSON.stringify(keys)
      if (state.store.has(cacheKey)) return state.store.get(cacheKey)
      const value = await fn()
      state.store.set(cacheKey, value)
      for (const tag of opts?.tags ?? []) {
        const set = state.tagged.get(tag) ?? new Set<string>()
        set.add(cacheKey)
        state.tagged.set(tag, set)
      }
      return value
    }
  },
  revalidateTag: (tag: string) => {
    const state = (globalThis as unknown as { __GLASSES_CATALOG_TEST_CACHE__: CacheState }).__GLASSES_CATALOG_TEST_CACHE__
    const keys = state.tagged.get(tag)
    if (!keys) return
    for (const key of keys) state.store.delete(key)
    state.tagged.delete(tag)
  },
}))

jest.mock('@/lib/prisma', () => ({
  prisma: {
    glassesFrame: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
  },
}))

import { prisma } from '@/lib/prisma'
import {
  getActiveBrands,
  getActiveFrames,
  getFrameById,
} from '@/data/glasses-prisma'
import {
  getGlassesCatalogOriginLoadCount,
  GLASSES_CATALOG_CACHE_KEYS,
  GLASSES_CATALOG_TAG,
  revalidateGlassesCatalog,
  resetGlassesCatalogOriginLoadCount,
} from '@/lib/glasses-catalog-cache'

const frame = {
  id: 'frame-1',
  name: 'Soft Square',
  description: 'Everyday optical',
  imageUrl: '/frame.jpg',
  category: 'optical',
  brand: 'Warby Parker',
  model: null,
  price: null,
  style: null,
  material: null,
  color: null,
  isActive: true,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-02T00:00:00.000Z'),
  faceShapes: [{
    id: 'join-1',
    frameId: 'frame-1',
    faceShapeId: 'shape-1',
    reason: null,
    faceShape: {
      id: 'shape-1',
      name: 'round',
      displayName: 'Round',
      description: null,
      characteristics: null,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-02T00:00:00.000Z'),
    },
  }],
  categories: [],
}

describe('glasses catalog application cache', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    const state = cacheState()
    state.store.clear()
    state.tagged.clear()
    resetGlassesCatalogOriginLoadCount()
  })

  it('loads active frames from the database once within the cache window', async () => {
    ;(prisma.glassesFrame.findMany as jest.Mock).mockResolvedValue([frame])

    const first = await getActiveFrames()
    const second = await getActiveFrames()

    expect(prisma.glassesFrame.findMany).toHaveBeenCalledTimes(1)
    expect(prisma.glassesFrame.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { isActive: true },
      include: {
        faceShapes: { include: { faceShape: true } },
        categories: { include: { category: true } },
      },
    }))
    expect(second).toEqual(first)
    expect(first[0]?.createdAt).toBeInstanceOf(Date)
    expect(getGlassesCatalogOriginLoadCount()).toBe(1)
  })

  it('loads active brands from the database once within the cache window', async () => {
    ;(prisma.glassesFrame.findMany as jest.Mock).mockResolvedValue([{ brand: 'Warby Parker' }])

    await getActiveBrands()
    await getActiveBrands()

    expect(prisma.glassesFrame.findMany).toHaveBeenCalledTimes(1)
    expect(await getActiveBrands()).toEqual(['Warby Parker'])
    expect(getGlassesCatalogOriginLoadCount()).toBe(1)
  })

  it('caches getFrameById per id and isolates different ids', async () => {
    const other = { ...frame, id: 'frame-2', name: 'Aviator' }
    ;(prisma.glassesFrame.findUnique as jest.Mock).mockImplementation(async ({ where }: { where: { id: string } }) => {
      if (where.id === 'frame-1') return frame
      if (where.id === 'frame-2') return other
      return null
    })

    await getFrameById('frame-1')
    await getFrameById('frame-1')
    await getFrameById('frame-2')
    const again = await getFrameById('frame-1')

    expect(prisma.glassesFrame.findUnique).toHaveBeenCalledTimes(2)
    expect(again?.id).toBe('frame-1')
    expect(again?.name).toBe('Soft Square')
    expect(cacheState().store.has(JSON.stringify([GLASSES_CATALOG_CACHE_KEYS.frameById('frame-1')]))).toBe(true)
    expect(cacheState().store.has(JSON.stringify([GLASSES_CATALOG_CACHE_KEYS.frameById('frame-2')]))).toBe(true)
  })

  it('dedupes in-flight getFrameById reads for the same id', async () => {
    let resolveFind: ((value: typeof frame) => void) | undefined
    ;(prisma.glassesFrame.findUnique as jest.Mock).mockImplementation(
      () => new Promise((resolve) => {
        resolveFind = resolve
      }),
    )

    const first = getFrameById('frame-1')
    const second = getFrameById('frame-1')
    expect(prisma.glassesFrame.findUnique).toHaveBeenCalledTimes(1)
    resolveFind?.(frame)

    expect((await first)?.id).toBe('frame-1')
    expect((await second)?.id).toBe('frame-1')
  })

  it('returns updated data after catalog tag invalidation', async () => {
    const updated = { ...frame, name: 'Soft Square Updated' }
    ;(prisma.glassesFrame.findUnique as jest.Mock)
      .mockResolvedValueOnce(frame)
      .mockResolvedValueOnce(updated)

    const before = await getFrameById('frame-1')
    expect(before?.name).toBe('Soft Square')

    revalidateGlassesCatalog()
    const after = await getFrameById('frame-1')

    expect(after?.name).toBe('Soft Square Updated')
    expect(prisma.glassesFrame.findUnique).toHaveBeenCalledTimes(2)
    expect(cacheState().tagged.has(GLASSES_CATALOG_TAG)).toBe(true)
  })
})
