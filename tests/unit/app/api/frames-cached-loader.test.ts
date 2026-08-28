/** @jest-environment node */

jest.mock('next/cache', () => ({
  unstable_cache: (fn: () => Promise<unknown>) => fn,
  revalidateTag: jest.fn(),
}))
jest.mock('@/lib/mocks', () => ({
  isMockMode: false,
  mockGlassesFrames: [],
}))
jest.mock('@/data/glasses', () => ({
  getActiveFrames: jest.fn(),
}))

import { getActiveFrames } from '@/data/glasses'
import { PUBLIC_CATALOG_CACHE_CONTROL } from '@/lib/public-http-cache'
import { GET } from '@/app/api/frames/route'

describe('legacy GET /api/frames cached loader', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('reuses getActiveFrames and keeps the public DTO contract', async () => {
    ;(getActiveFrames as jest.Mock).mockResolvedValue([
      {
        id: 'frame-1',
        name: 'Soft Square',
        imageUrl: '/frame.jpg',
        category: 'optical',
        brand: 'Warby Parker',
        faceShapes: [{ id: 'join-1' }],
        categories: [{ id: 'join-2' }],
      },
    ])

    const response = await GET()
    const body = await response.json()

    expect(getActiveFrames).toHaveBeenCalledTimes(1)
    expect(response.headers.get('Cache-Control')).toBe(PUBLIC_CATALOG_CACHE_CONTROL)
    expect(body).toEqual({
      success: true,
      data: [{
        id: 'frame-1',
        name: 'Soft Square',
        imageUrl: '/frame.jpg',
        category: 'optical',
        brand: 'Warby Parker',
      }],
    })
  })
})
