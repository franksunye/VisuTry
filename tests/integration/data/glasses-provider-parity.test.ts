/** @jest-environment node */

import * as prismaProvider from '@/data/glasses-prisma'
import * as neonProvider from '@/data/glasses-cloudflare'

function stable(value: unknown): unknown {
  if (value instanceof Date) return value.toISOString()
  if (Array.isArray(value)) return value.map(stable)
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, item]) => [key, stable(item)]),
    )
  }
  return value
}

const liveParity = process.env.RUN_CLOUDFLARE_PARITY === '1'

const testSuite = liveParity ? describe : describe.skip

testSuite('Prisma/direct-Neon glasses provider parity', () => {
  it('matches public lookup results on the same Neon database', async () => {
    const [prismaBrands, neonBrands] = await Promise.all([
      prismaProvider.getActiveBrands(),
      neonProvider.getActiveBrands(),
    ])
    expect(neonBrands).toEqual(prismaBrands)

    const [prismaCategories, neonCategories] = await Promise.all([
      prismaProvider.getCategories(),
      neonProvider.getCategories(),
    ])
    expect(stable(neonCategories)).toEqual(stable(prismaCategories))

    const [prismaFaceShapes, neonFaceShapes] = await Promise.all([
      prismaProvider.getFaceShapes(),
      neonProvider.getFaceShapes(),
    ])
    expect(stable(neonFaceShapes)).toEqual(stable(prismaFaceShapes))

    const [prismaFrames, neonFrames] = await Promise.all([
      prismaProvider.getActiveFrames(),
      neonProvider.getActiveFrames(),
    ])
    expect(stable(neonFrames)).toEqual(stable(prismaFrames))

    const firstFrameId = prismaFrames[0]?.id
    if (firstFrameId) {
      const [prismaFrame, neonFrame] = await Promise.all([
        prismaProvider.getFrameById(firstFrameId),
        neonProvider.getFrameById(firstFrameId),
      ])
      expect(stable(neonFrame)).toEqual(stable(prismaFrame))
    }
  })
})
