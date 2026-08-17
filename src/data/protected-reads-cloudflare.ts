import { getCloudflareSql } from './neon-cloudflare'

type Row = Record<string, unknown>

function dateValue(value: unknown): Date | null {
  return value == null ? null : value instanceof Date ? value : new Date(String(value))
}

function requiredDate(value: unknown): Date {
  return dateValue(value) ?? new Date(0)
}

function nullableString(value: unknown): string | null {
  return value == null ? null : String(value)
}

export type ConsumerTryOnHistoryPage = {
  tasks: Array<{
    id: string
    type: string
    status: string
    userImageUrl: string
    itemImageUrl: string
    glassesImageUrl: string | null
    resultImageUrl: string | null
    errorMessage: string | null
    createdAt: Date
    updatedAt: Date
    metadata: unknown
  }>
  total: number
}

export async function getConsumerTryOnHistory(input: {
  userId: string
  page: number
  limit: number
  status?: string | null
}): Promise<ConsumerTryOnHistoryPage> {
  const sql = getCloudflareSql()
  const offset = (input.page - 1) * input.limit
  const rows = input.status
    ? await sql`
        SELECT "id", "type", "status", "userImageUrl", "itemImageUrl", "glassesImageUrl",
          "resultImageUrl", "errorMessage", "createdAt", "updatedAt", "metadata"
        FROM "TryOnTask"
        WHERE "userId" = ${input.userId} AND "status" = ${input.status}
        ORDER BY "createdAt" DESC
        OFFSET ${offset} LIMIT ${input.limit}
      `
    : await sql`
        SELECT "id", "type", "status", "userImageUrl", "itemImageUrl", "glassesImageUrl",
          "resultImageUrl", "errorMessage", "createdAt", "updatedAt", "metadata"
        FROM "TryOnTask"
        WHERE "userId" = ${input.userId}
        ORDER BY "createdAt" DESC
        OFFSET ${offset} LIMIT ${input.limit}
      `
  const countRows = input.status
    ? await sql`SELECT count(*)::int AS "count" FROM "TryOnTask" WHERE "userId" = ${input.userId} AND "status" = ${input.status}`
    : await sql`SELECT count(*)::int AS "count" FROM "TryOnTask" WHERE "userId" = ${input.userId}`

  return {
    tasks: rows.map((row) => ({
      id: String(row.id),
      type: String(row.type),
      status: String(row.status),
      userImageUrl: String(row.userImageUrl),
      itemImageUrl: String(row.itemImageUrl),
      glassesImageUrl: nullableString(row.glassesImageUrl),
      resultImageUrl: nullableString(row.resultImageUrl),
      errorMessage: nullableString(row.errorMessage),
      createdAt: requiredDate(row.createdAt),
      updatedAt: requiredDate(row.updatedAt),
      metadata: row.metadata ?? null,
    })),
    total: Number(countRows[0]?.count ?? 0),
  }
}

export type FaceAnalysisHistoryPage = {
  tasks: Array<{
    id: string
    status: string
    userImageUrl: string
    detectedShape: string | null
    confidence: number | null
    basicResult: unknown
    fullResult: unknown
    reportUnlocked: boolean
    errorMessage: string | null
    createdAt: Date
  }>
  total: number
}

export async function getFaceAnalysisHistory(input: {
  userId: string
  page: number
  limit: number
}): Promise<FaceAnalysisHistoryPage> {
  const sql = getCloudflareSql()
  const rows = await sql`
    SELECT "id", "status", "userImageUrl", "detectedShape", "confidence", "basicResult",
      "fullResult", "reportUnlocked", "errorMessage", "createdAt"
    FROM "FaceAnalysisTask"
    WHERE "userId" = ${input.userId}
    ORDER BY "createdAt" DESC
    OFFSET ${(input.page - 1) * input.limit} LIMIT ${input.limit}
  `
  const countRows = await sql`SELECT count(*)::int AS "count" FROM "FaceAnalysisTask" WHERE "userId" = ${input.userId}`
  return {
    tasks: rows.map((row) => ({
      id: String(row.id),
      status: String(row.status),
      userImageUrl: String(row.userImageUrl),
      detectedShape: nullableString(row.detectedShape),
      confidence: row.confidence == null ? null : Number(row.confidence),
      basicResult: row.basicResult ?? null,
      fullResult: row.fullResult ?? null,
      reportUnlocked: Boolean(row.reportUnlocked),
      errorMessage: nullableString(row.errorMessage),
      createdAt: requiredDate(row.createdAt),
    })),
    total: Number(countRows[0]?.count ?? 0),
  }
}

export type PaymentHistoryPage = {
  payments: Array<{
    id: string
    productType: string
    description: string | null
    createdAt: Date
    stripePaymentId: string | null
    amount: number
    currency: string
    status: string
  }>
  total: number
}

export async function getPaymentHistory(input: {
  userId: string
  page: number
  limit: number
}): Promise<PaymentHistoryPage> {
  const sql = getCloudflareSql()
  const rows = await sql`
    SELECT "id", "productType", "description", "createdAt", "stripePaymentId", "amount", "currency", "status"
    FROM "Payment"
    WHERE "userId" = ${input.userId} AND "status" IN ('COMPLETED', 'REFUNDED')
    ORDER BY "createdAt" DESC
    OFFSET ${(input.page - 1) * input.limit} LIMIT ${input.limit}
  `
  const countRows = await sql`
    SELECT count(*)::int AS "count"
    FROM "Payment"
    WHERE "userId" = ${input.userId} AND "status" IN ('COMPLETED', 'REFUNDED')
  `
  return {
    payments: rows.map((row) => ({
      id: String(row.id),
      productType: String(row.productType),
      description: nullableString(row.description),
      createdAt: requiredDate(row.createdAt),
      stripePaymentId: nullableString(row.stripePaymentId),
      amount: Number(row.amount),
      currency: String(row.currency),
      status: String(row.status),
    })),
    total: Number(countRows[0]?.count ?? 0),
  }
}
