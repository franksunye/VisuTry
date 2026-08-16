import { getCloudflareSql } from './neon-cloudflare'

type Row = Record<string, unknown>

function dateValue(value: unknown): Date {
  return value instanceof Date ? value : new Date(String(value))
}

function nullableString(value: unknown): string | null {
  return value == null ? null : String(value)
}

export async function getAdminDashboardStats() {
  const sql = getCloudflareSql()
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  const [totalUsersRows, todayUsersRows, totalFaceShapeDetectionsRows, todayFaceShapeDetectionsRows, totalFaceAnalysesRows, todayFaceAnalysesRows, recentOrdersRows, recentUsersRows, recentFaceAnalysesRows] = await Promise.all([
    sql`SELECT count(*)::int AS "count" FROM "User"`,
    sql`SELECT count(*)::int AS "count" FROM "User" WHERE "createdAt" >= ${todayStart}`,
    sql`SELECT count(*)::int AS "count" FROM "FaceShapeDetection"`,
    sql`SELECT count(*)::int AS "count" FROM "FaceShapeDetection" WHERE "createdAt" >= ${todayStart}`,
    sql`SELECT count(*)::int AS "count" FROM "FaceAnalysisTask"`,
    sql`SELECT count(*)::int AS "count" FROM "FaceAnalysisTask" WHERE "createdAt" >= ${todayStart}`,
    sql`SELECT p."id", p."userId", p."amount", p."status", u."name" AS "userName", u."email" AS "userEmail" FROM "Payment" p JOIN "User" u ON u."id" = p."userId" ORDER BY p."createdAt" DESC LIMIT 5`,
    sql`SELECT "id", "image", "name", "email", "createdAt" FROM "User" ORDER BY "createdAt" DESC LIMIT 5`,
    sql`SELECT f."id", f."userId", f."detectedShape", f."confidence", f."status", f."createdAt", u."name" AS "userName", u."email" AS "userEmail" FROM "FaceAnalysisTask" f JOIN "User" u ON u."id" = f."userId" ORDER BY f."createdAt" DESC LIMIT 5`,
  ])

  const count = (rows: Row[]) => Number(rows[0]?.count ?? 0)
  return {
    totalUsers: count(totalUsersRows),
    todayUsers: count(todayUsersRows),
    totalFaceShapeDetections: count(totalFaceShapeDetectionsRows),
    todayFaceShapeDetections: count(todayFaceShapeDetectionsRows),
    totalFaceAnalyses: count(totalFaceAnalysesRows),
    todayFaceAnalyses: count(todayFaceAnalysesRows),
    recentOrders: recentOrdersRows.map((row) => ({ id: String(row.id), userId: String(row.userId), amount: Number(row.amount), status: String(row.status), user: { name: nullableString(row.userName), email: nullableString(row.userEmail) } })),
    recentUsers: recentUsersRows.map((row) => ({ id: String(row.id), image: nullableString(row.image), name: nullableString(row.name), email: nullableString(row.email), createdAt: dateValue(row.createdAt) })),
    recentFaceAnalyses: recentFaceAnalysesRows.map((row) => ({ id: String(row.id), userId: String(row.userId), detectedShape: nullableString(row.detectedShape), confidence: row.confidence == null ? null : Number(row.confidence), status: String(row.status), createdAt: dateValue(row.createdAt), user: { name: nullableString(row.userName), email: nullableString(row.userEmail) } })),
  }
}
