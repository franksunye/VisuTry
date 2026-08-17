/** @jest-environment node */

jest.mock('@/lib/prisma', () => ({
  prisma: {
    glassesFrame: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    glassesCategory: {
      findMany: jest.fn(),
    },
    faceShape: {
      findMany: jest.fn(),
    },
  },
}))

import { prisma } from '@/lib/prisma'
import { PUBLIC_CATALOG_CACHE_CONTROL } from '@/lib/public-http-cache'
import { GET as getBrands } from '@/app/api/glasses/brands/route'
import { GET as getCategories } from '@/app/api/glasses/categories/route'
import { GET as getFaceShapes } from '@/app/api/glasses/face-shapes/route'
import { GET as getFrames } from '@/app/api/glasses/frames/route'
import { GET as getFrameById } from '@/app/api/glasses/frames/[id]/route'

describe('public catalog GET caching', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('exposes a shared CDN cache policy for anonymous catalog reads', () => {
    expect(PUBLIC_CATALOG_CACHE_CONTROL).toBe(
      'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400',
    )
  })

  it('caches brand, category, and face-shape list responses', async () => {
    ;(prisma.glassesFrame.findMany as jest.Mock).mockResolvedValue([{ brand: 'Warby Parker' }])
    ;(prisma.glassesCategory.findMany as jest.Mock).mockResolvedValue([
      { id: 'cat-1', name: 'optical', displayName: 'Optical', description: null },
    ])
    ;(prisma.faceShape.findMany as jest.Mock).mockResolvedValue([
      { id: 'shape-1', name: 'oval', displayName: 'Oval', description: null, characteristics: null },
    ])

    const brands = await getBrands()
    const categories = await getCategories()
    const shapes = await getFaceShapes()

    expect(brands.headers.get('Cache-Control')).toBe(PUBLIC_CATALOG_CACHE_CONTROL)
    expect(categories.headers.get('Cache-Control')).toBe(PUBLIC_CATALOG_CACHE_CONTROL)
    expect(shapes.headers.get('Cache-Control')).toBe(PUBLIC_CATALOG_CACHE_CONTROL)
    expect(await brands.json()).toEqual({ success: true, data: ['Warby Parker'] })
  })

  it('returns a slim public frames payload without timestamps or join-table ids', async () => {
    ;(prisma.glassesFrame.findMany as jest.Mock).mockResolvedValue([
      {
        id: 'frame-1',
        name: 'Soft Square',
        imageUrl: '/frame.jpg',
        category: 'optical',
        brand: 'Warby Parker',
        model: 'Percey',
        style: 'square',
        material: 'acetate',
        color: 'clear',
        faceShapes: [{ faceShape: { name: 'round', displayName: 'Round' } }],
        categories: [{ category: { name: 'optical', displayName: 'Optical' } }],
      },
    ])

    const response = await getFrames()
    const body = await response.json()

    expect(response.headers.get('Cache-Control')).toBe(PUBLIC_CATALOG_CACHE_CONTROL)
    expect(body).toEqual({
      success: true,
      data: [
        {
          id: 'frame-1',
          name: 'Soft Square',
          imageUrl: '/frame.jpg',
          category: 'optical',
          brand: 'Warby Parker',
          model: 'Percey',
          style: 'square',
          material: 'acetate',
          color: 'clear',
          faceShapes: [{ name: 'round', displayName: 'Round' }],
          categories: [{ name: 'optical', displayName: 'Optical' }],
        },
      ],
    })
    expect(JSON.stringify(body)).not.toContain('createdAt')
    expect(JSON.stringify(body)).not.toContain('updatedAt')
  })

  it('caches individual public frame reads', async () => {
    ;(prisma.glassesFrame.findUnique as jest.Mock).mockResolvedValue({
      id: 'frame-1',
      name: 'Soft Square',
      description: 'Everyday optical',
      imageUrl: '/frame.jpg',
      category: 'optical',
      brand: 'Warby Parker',
      model: 'Percey',
      style: 'square',
      material: 'acetate',
      color: 'clear',
      price: 9500,
      isActive: true,
      faceShapes: [{ reason: 'Contrast', faceShape: { name: 'round', displayName: 'Round' } }],
      categories: [{ category: { name: 'optical', displayName: 'Optical' } }],
    })

    const response = await getFrameById(new Request('http://localhost/api/glasses/frames/frame-1'), {
      params: { id: 'frame-1' },
    })

    expect(response.headers.get('Cache-Control')).toBe(PUBLIC_CATALOG_CACHE_CONTROL)
    expect(response.status).toBe(200)
  })
})
