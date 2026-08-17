import { prisma } from '@/lib/prisma'
import type { FaceShapeRecord, GlassesCategoryRecord, GlassesFrameRecord } from './glasses-types'

const frameInclude = {
  faceShapes: { include: { faceShape: true } },
  categories: { include: { category: true } },
} as const

export function getActiveBrands(): Promise<string[]> {
  return prisma.glassesFrame.findMany({
    where: { isActive: true },
    distinct: ['brand'],
    select: { brand: true },
    orderBy: { brand: 'asc' },
  }).then((rows) => rows.map((row) => row.brand).filter((brand): brand is string => brand != null))
}

export function getCategories(): Promise<GlassesCategoryRecord[]> {
  return prisma.glassesCategory.findMany({ orderBy: { name: 'asc' } }) as Promise<GlassesCategoryRecord[]>
}

export function getFaceShapes(): Promise<FaceShapeRecord[]> {
  return prisma.faceShape.findMany({ orderBy: { name: 'asc' } }) as Promise<FaceShapeRecord[]>
}

export function getActiveFrames(): Promise<GlassesFrameRecord[]> {
  return prisma.glassesFrame.findMany({ where: { isActive: true }, include: frameInclude, orderBy: { createdAt: 'desc' } }) as Promise<GlassesFrameRecord[]>
}

export function getFrameById(id: string): Promise<GlassesFrameRecord | null> {
  return prisma.glassesFrame.findUnique({ where: { id }, include: frameInclude }) as Promise<GlassesFrameRecord | null>
}

export function getFramesByBrand(brand: string): Promise<GlassesFrameRecord[]> {
  return prisma.glassesFrame.findMany({ where: { isActive: true, brand: { equals: brand, mode: 'insensitive' } }, include: frameInclude, orderBy: { createdAt: 'desc' } }) as Promise<GlassesFrameRecord[]>
}

export function getCategoryByName(name: string): Promise<GlassesCategoryRecord | null> {
  return prisma.glassesCategory.findFirst({ where: { name: { equals: name, mode: 'insensitive' } } }) as Promise<GlassesCategoryRecord | null>
}

export function getFramesByCategory(categoryName: string): Promise<GlassesFrameRecord[]> {
  return prisma.glassesFrame.findMany({ where: { isActive: true, category: { equals: categoryName, mode: 'insensitive' } }, include: frameInclude, orderBy: { createdAt: 'desc' } }) as Promise<GlassesFrameRecord[]>
}

export function getFrameIds(): Promise<string[]> {
  return prisma.glassesFrame.findMany({ where: { isActive: true }, select: { id: true }, orderBy: { createdAt: 'desc' } }).then((rows) => rows.map((row) => row.id))
}
