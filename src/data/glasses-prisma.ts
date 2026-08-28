import { prisma } from '@/lib/prisma'
import {
  cacheGlassesCatalogRead,
  GLASSES_CATALOG_CACHE_KEYS,
} from '@/lib/glasses-catalog-cache'
import type { FaceShapeRecord, GlassesCategoryRecord, GlassesFrameRecord } from './glasses-types'

const frameInclude = {
  faceShapes: { include: { faceShape: true } },
  categories: { include: { category: true } },
} as const

function asDate(value: Date | string): Date {
  return value instanceof Date ? value : new Date(value)
}

function reviveCategory(category: GlassesCategoryRecord): GlassesCategoryRecord {
  return {
    ...category,
    createdAt: asDate(category.createdAt),
    updatedAt: asDate(category.updatedAt),
  }
}

function reviveFaceShape(shape: FaceShapeRecord): FaceShapeRecord {
  return {
    ...shape,
    createdAt: asDate(shape.createdAt),
    updatedAt: asDate(shape.updatedAt),
  }
}

function reviveFrame(frame: GlassesFrameRecord): GlassesFrameRecord {
  return {
    ...frame,
    createdAt: asDate(frame.createdAt),
    updatedAt: asDate(frame.updatedAt),
    faceShapes: (frame.faceShapes ?? []).map((join) => ({
      ...join,
      faceShape: reviveFaceShape(join.faceShape),
    })),
    categories: (frame.categories ?? []).map((join) => ({
      ...join,
      category: reviveCategory(join.category),
    })),
  }
}

function reviveFrames(frames: GlassesFrameRecord[]): GlassesFrameRecord[] {
  return frames.map(reviveFrame)
}

export function getActiveBrands(): Promise<string[]> {
  return cacheGlassesCatalogRead(GLASSES_CATALOG_CACHE_KEYS.activeBrands, () =>
    prisma.glassesFrame.findMany({
      where: { isActive: true },
      distinct: ['brand'],
      select: { brand: true },
      orderBy: { brand: 'asc' },
    }).then((rows) => rows.map((row) => row.brand).filter((brand): brand is string => brand != null)),
  )
}

export function getCategories(): Promise<GlassesCategoryRecord[]> {
  return cacheGlassesCatalogRead(GLASSES_CATALOG_CACHE_KEYS.categories, () =>
    prisma.glassesCategory.findMany({ orderBy: { name: 'asc' } }) as Promise<GlassesCategoryRecord[]>,
  ).then((rows) => rows.map(reviveCategory))
}

export function getFaceShapes(): Promise<FaceShapeRecord[]> {
  return cacheGlassesCatalogRead(GLASSES_CATALOG_CACHE_KEYS.faceShapes, () =>
    prisma.faceShape.findMany({ orderBy: { name: 'asc' } }) as Promise<FaceShapeRecord[]>,
  ).then((rows) => rows.map(reviveFaceShape))
}

export function getActiveFrames(): Promise<GlassesFrameRecord[]> {
  return cacheGlassesCatalogRead(GLASSES_CATALOG_CACHE_KEYS.activeFrames, () =>
    prisma.glassesFrame.findMany({
      where: { isActive: true },
      include: frameInclude,
      orderBy: { createdAt: 'desc' },
    }) as Promise<GlassesFrameRecord[]>,
  ).then(reviveFrames)
}

export function getFrameById(id: string): Promise<GlassesFrameRecord | null> {
  return cacheGlassesCatalogRead(GLASSES_CATALOG_CACHE_KEYS.frameById(id), () =>
    prisma.glassesFrame.findUnique({
      where: { id },
      include: frameInclude,
    }) as Promise<GlassesFrameRecord | null>,
  ).then((frame) => (frame ? reviveFrame(frame) : null))
}

export function getFramesByBrand(brand: string): Promise<GlassesFrameRecord[]> {
  return cacheGlassesCatalogRead(GLASSES_CATALOG_CACHE_KEYS.framesByBrand(brand), () =>
    prisma.glassesFrame.findMany({
      where: { isActive: true, brand: { equals: brand, mode: 'insensitive' } },
      include: frameInclude,
      orderBy: { createdAt: 'desc' },
    }) as Promise<GlassesFrameRecord[]>,
  ).then(reviveFrames)
}

export function getCategoryByName(name: string): Promise<GlassesCategoryRecord | null> {
  return cacheGlassesCatalogRead(GLASSES_CATALOG_CACHE_KEYS.categoryByName(name), () =>
    prisma.glassesCategory.findFirst({
      where: { name: { equals: name, mode: 'insensitive' } },
    }) as Promise<GlassesCategoryRecord | null>,
  ).then((category) => (category ? reviveCategory(category) : null))
}

export function getFramesByCategory(categoryName: string): Promise<GlassesFrameRecord[]> {
  return cacheGlassesCatalogRead(GLASSES_CATALOG_CACHE_KEYS.framesByCategory(categoryName), () =>
    prisma.glassesFrame.findMany({
      where: { isActive: true, category: { equals: categoryName, mode: 'insensitive' } },
      include: frameInclude,
      orderBy: { createdAt: 'desc' },
    }) as Promise<GlassesFrameRecord[]>,
  ).then(reviveFrames)
}

export function getFrameIds(): Promise<string[]> {
  return cacheGlassesCatalogRead(GLASSES_CATALOG_CACHE_KEYS.frameIds, () =>
    prisma.glassesFrame.findMany({
      where: { isActive: true },
      select: { id: true },
      orderBy: { createdAt: 'desc' },
    }).then((rows) => rows.map((row) => row.id)),
  )
}
