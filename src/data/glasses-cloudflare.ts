import { getCloudflareSql } from './neon-cloudflare'
import type {
  FaceShapeRecord,
  GlassesCategoryRecord,
  GlassesFrameRecord,
} from './glasses-types'

type Row = Record<string, unknown>

function date(value: unknown): Date {
  return value instanceof Date ? value : new Date(String(value))
}

function nullableString(value: unknown): string | null {
  return value == null ? null : String(value)
}

function category(row: Row): GlassesCategoryRecord {
  return {
    id: String(row.id),
    name: String(row.name),
    displayName: String(row.displayName),
    description: nullableString(row.description),
    createdAt: date(row.createdAt),
    updatedAt: date(row.updatedAt),
  }
}

function faceShape(row: Row): FaceShapeRecord {
  return {
    id: String(row.id),
    name: String(row.name),
    displayName: String(row.displayName),
    description: nullableString(row.description),
    characteristics: nullableString(row.characteristics),
    createdAt: date(row.createdAt),
    updatedAt: date(row.updatedAt),
  }
}

function frame(row: Row): GlassesFrameRecord {
  return {
    id: String(row.id),
    name: String(row.name),
    description: nullableString(row.description),
    imageUrl: String(row.imageUrl),
    category: nullableString(row.category),
    brand: nullableString(row.brand),
    model: nullableString(row.model),
    price: row.price == null ? null : Number(row.price),
    style: nullableString(row.style),
    material: nullableString(row.material),
    color: nullableString(row.color),
    isActive: Boolean(row.isActive),
    createdAt: date(row.createdAt),
    updatedAt: date(row.updatedAt),
    faceShapes: [],
    categories: [],
  }
}

export async function getActiveBrands(): Promise<string[]> {
  const sql = getCloudflareSql()
  const rows = await sql`
    SELECT DISTINCT "brand"
    FROM "GlassesFrame"
    WHERE "isActive" = true
    ORDER BY "brand" ASC
  `
  return rows.map((row) => row.brand).filter((brand): brand is string => brand != null)
}

export async function getCategories(): Promise<GlassesCategoryRecord[]> {
  const sql = getCloudflareSql()
  const rows = await sql`
    SELECT "id", "name", "displayName", "description", "createdAt", "updatedAt"
    FROM "GlassesCategory"
    ORDER BY "name" ASC
  `
  return rows.map(category)
}

export async function getFaceShapes(): Promise<FaceShapeRecord[]> {
  const sql = getCloudflareSql()
  const rows = await sql`
    SELECT "id", "name", "displayName", "description", "characteristics", "createdAt", "updatedAt"
    FROM "FaceShape"
    ORDER BY "name" ASC
  `
  return rows.map(faceShape)
}

async function getFrameRelations(frameIds: string[]): Promise<{
  faceShapes: GlassesFrameRecord['faceShapes']
  categories: GlassesFrameRecord['categories']
}> {
  if (frameIds.length === 0) return { faceShapes: [], categories: [] }
  const sql = getCloudflareSql()
  const faceShapeRows = await sql`
    SELECT
      rec."id",
      rec."frameId",
      rec."faceShapeId",
      rec."reason",
      fs."id" AS "fsId",
      fs."name" AS "fsName",
      fs."displayName" AS "fsDisplayName",
      fs."description" AS "fsDescription",
      fs."characteristics" AS "fsCharacteristics",
      fs."createdAt" AS "fsCreatedAt",
      fs."updatedAt" AS "fsUpdatedAt"
    FROM "FrameFaceShapeRecommendation" rec
    JOIN "FaceShape" fs ON fs."id" = rec."faceShapeId"
    WHERE rec."frameId" = ANY(${frameIds})
  `
  const categoryRows = await sql`
    SELECT
      assoc."id",
      assoc."frameId",
      assoc."categoryId",
      c."id" AS "categoryIdValue",
      c."name" AS "categoryName",
      c."displayName" AS "categoryDisplayName",
      c."description" AS "categoryDescription",
      c."createdAt" AS "categoryCreatedAt",
      c."updatedAt" AS "categoryUpdatedAt"
    FROM "FrameCategoryAssociation" assoc
    JOIN "GlassesCategory" c ON c."id" = assoc."categoryId"
    WHERE assoc."frameId" = ANY(${frameIds})
  `
  return {
    faceShapes: faceShapeRows.map((row) => ({
      id: String(row.id),
      frameId: String(row.frameId),
      faceShapeId: String(row.faceShapeId),
      reason: nullableString(row.reason),
      faceShape: {
        id: String(row.fsId),
        name: String(row.fsName),
        displayName: String(row.fsDisplayName),
        description: nullableString(row.fsDescription),
        characteristics: nullableString(row.fsCharacteristics),
        createdAt: date(row.fsCreatedAt),
        updatedAt: date(row.fsUpdatedAt),
      },
    })),
    categories: categoryRows.map((row) => ({
      id: String(row.id),
      frameId: String(row.frameId),
      categoryId: String(row.categoryId),
      category: {
        id: String(row.categoryIdValue),
        name: String(row.categoryName),
        displayName: String(row.categoryDisplayName),
        description: nullableString(row.categoryDescription),
        createdAt: date(row.categoryCreatedAt),
        updatedAt: date(row.categoryUpdatedAt),
      },
    })),
  }
}

async function withRelations(rows: Row[]): Promise<GlassesFrameRecord[]> {
  const records = rows.map(frame)
  const relations = await getFrameRelations(records.map((item) => item.id))
  const faceShapesByFrame = new Map<string, GlassesFrameRecord['faceShapes']>()
  const categoriesByFrame = new Map<string, GlassesFrameRecord['categories']>()
  for (const item of relations.faceShapes) faceShapesByFrame.set(item.frameId, [...(faceShapesByFrame.get(item.frameId) ?? []), item])
  for (const item of relations.categories) categoriesByFrame.set(item.frameId, [...(categoriesByFrame.get(item.frameId) ?? []), item])
  return records.map((item) => ({
    ...item,
    faceShapes: faceShapesByFrame.get(item.id) ?? [],
    categories: categoriesByFrame.get(item.id) ?? [],
  }))
}

export async function getActiveFrames(): Promise<GlassesFrameRecord[]> {
  const sql = getCloudflareSql()
  const rows = await sql`
    SELECT "id", "name", "description", "imageUrl", "category", "brand", "model", "price", "style", "material", "color", "isActive", "createdAt", "updatedAt"
    FROM "GlassesFrame"
    WHERE "isActive" = true
    ORDER BY "createdAt" DESC
  `
  return withRelations(rows)
}

export async function getFrameById(id: string): Promise<GlassesFrameRecord | null> {
  const sql = getCloudflareSql()
  const rows = await sql`
    SELECT "id", "name", "description", "imageUrl", "category", "brand", "model", "price", "style", "material", "color", "isActive", "createdAt", "updatedAt"
    FROM "GlassesFrame"
    WHERE "id" = ${id}
    LIMIT 1
  `
  const records = await withRelations(rows)
  return records[0] ?? null
}

export async function getFramesByBrand(brand: string): Promise<GlassesFrameRecord[]> {
  const sql = getCloudflareSql()
  const rows = await sql`
    SELECT "id", "name", "description", "imageUrl", "category", "brand", "model", "price", "style", "material", "color", "isActive", "createdAt", "updatedAt"
    FROM "GlassesFrame"
    WHERE "isActive" = true AND lower("brand") = lower(${brand})
    ORDER BY "createdAt" DESC
  `
  return withRelations(rows)
}

export async function getCategoryByName(name: string): Promise<GlassesCategoryRecord | null> {
  const sql = getCloudflareSql()
  const rows = await sql`
    SELECT "id", "name", "displayName", "description", "createdAt", "updatedAt"
    FROM "GlassesCategory"
    WHERE lower("name") = lower(${name})
    LIMIT 1
  `
  return rows[0] ? category(rows[0]) : null
}

export async function getFramesByCategory(categoryName: string): Promise<GlassesFrameRecord[]> {
  const sql = getCloudflareSql()
  const rows = await sql`
    SELECT "id", "name", "description", "imageUrl", "category", "brand", "model", "price", "style", "material", "color", "isActive", "createdAt", "updatedAt"
    FROM "GlassesFrame"
    WHERE "isActive" = true AND lower("category") = lower(${categoryName})
    ORDER BY "createdAt" DESC
  `
  return withRelations(rows)
}

export async function getFrameIds(): Promise<string[]> {
  const sql = getCloudflareSql()
  const rows = await sql`
    SELECT "id"
    FROM "GlassesFrame"
    WHERE "isActive" = true
    ORDER BY "createdAt" DESC
  `
  return rows.map((row) => row.id)
}
