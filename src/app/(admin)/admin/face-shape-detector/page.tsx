import Link from 'next/link'
import { TaskStatus } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  FACE_SHAPE_FAILURE_REASONS,
  FACE_SHAPE_FAILURE_REASON_LABELS,
  FACE_SHAPE_FAILURE_REASON_GROUPS,
  isFaceShapeFailureReason,
  type FaceShapeFailureReason,
} from '@/config/face-analysis'

export const dynamic = 'force-dynamic'

const ITEMS_PER_PAGE = 20

interface FaceShapeDetectorPageProps {
  searchParams: {
    page?: string
    status?: string
    reason?: string
  }
}

function buildFilterUrl(page: number, status?: string, reason?: string) {
  const params = new URLSearchParams()
  if (page > 1) params.set('page', String(page))
  if (status) params.set('status', status)
  if (reason) params.set('reason', reason)
  const query = params.toString()
  return query ? `/admin/face-shape-detector?${query}` : '/admin/face-shape-detector'
}

function filterPillClass(active: boolean) {
  return active
    ? 'rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold text-white'
    : 'rounded-full border border-gray-300 px-3 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50'
}

export default async function FaceShapeDetectorPage({ searchParams }: FaceShapeDetectorPageProps) {
  const requestedPage = Number.parseInt(searchParams.page ?? '1', 10)
  const currentPage = Number.isFinite(requestedPage) ? Math.max(requestedPage, 1) : 1

  const statusFilter =
    searchParams.status === 'COMPLETED' || searchParams.status === 'FAILED'
      ? (searchParams.status as TaskStatus)
      : undefined

  const reasonFilter =
    typeof searchParams.reason === 'string' && isFaceShapeFailureReason(searchParams.reason)
      ? (searchParams.reason as FaceShapeFailureReason)
      : undefined

  const where = {
    ...(statusFilter ? { status: statusFilter } : {}),
    ...(reasonFilter ? { failureReason: reasonFilter } : {}),
  }

  const [detections, totalDetections, statusCounts, reasonCounts] = await Promise.all([
    prisma.faceShapeDetection.findMany({
      where,
      take: ITEMS_PER_PAGE,
      skip: (currentPage - 1) * ITEMS_PER_PAGE,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.faceShapeDetection.count({ where }),
    prisma.faceShapeDetection.groupBy({
      by: ['status'],
      _count: true,
    }),
    prisma.faceShapeDetection.groupBy({
      by: ['failureReason'],
      _count: true,
      where: { status: 'FAILED' },
    }),
  ])

  const totalPages = Math.max(1, Math.ceil(totalDetections / ITEMS_PER_PAGE))

  const completedCount = statusCounts.find((s) => s.status === 'COMPLETED')?._count ?? 0
  const failedCount = statusCounts.find((s) => s.status === 'FAILED')?._count ?? 0
  const totalCount = completedCount + failedCount
  const completionRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  const reasonCountMap = new Map<string, number>()
  for (const entry of reasonCounts) {
    if (entry.failureReason) {
      reasonCountMap.set(entry.failureReason, entry._count)
    }
  }

  const topFailure = Array.from(reasonCountMap.entries()).sort((a, b) => b[1] - a[1])[0]
  const topFailureLabel = topFailure
    ? FACE_SHAPE_FAILURE_REASON_LABELS[topFailure[0] as FaceShapeFailureReason]
    : null
  const topFailureCount = topFailure?.[1] ?? 0

  const photoQualityCount = FACE_SHAPE_FAILURE_REASON_GROUPS.photo_quality.reduce(
    (sum, reason) => sum + (reasonCountMap.get(reason) ?? 0),
    0,
  )
  const infrastructureCount = FACE_SHAPE_FAILURE_REASON_GROUPS.infrastructure.reduce(
    (sum, reason) => sum + (reasonCountMap.get(reason) ?? 0),
    0,
  )

  const activeReasons = FACE_SHAPE_FAILURE_REASONS.filter(
    (reason) => (reasonCountMap.get(reason) ?? 0) > 0,
  )

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Face Shape Detector</h2>
        <p className="text-muted-foreground">Anonymous on-device detection activity</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Detections</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCount}</div>
            <p className="text-xs text-muted-foreground">
              {completedCount} completed · {failedCount} failed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completionRate}%</div>
            <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-gray-200">
              <div
                className="h-full rounded-full bg-green-500"
                style={{ width: `${completionRate}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Failure Reason</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{topFailureLabel ?? '—'}</div>
            <p className="text-xs text-muted-foreground">
              {topFailureCount > 0
                ? `${topFailureCount} of ${failedCount} failures`
                : 'No failures recorded'}
            </p>
          </CardContent>
        </Card>
      </div>

      {failedCount > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Failure Breakdown</CardTitle>
            <CardDescription>
              {photoQualityCount} photo-quality · {infrastructureCount} infrastructure
              {failedCount - photoQualityCount - infrastructureCount > 0 &&
                ` · ${failedCount - photoQualityCount - infrastructureCount} unspecified`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {FACE_SHAPE_FAILURE_REASONS.filter(
                (reason) => (reasonCountMap.get(reason) ?? 0) > 0,
              ).map((reason) => {
                const count = reasonCountMap.get(reason) ?? 0
                const isInfra = FACE_SHAPE_FAILURE_REASON_GROUPS.infrastructure.includes(reason)
                return (
                  <span
                    key={reason}
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
                      isInfra
                        ? 'bg-orange-100 text-orange-800'
                        : 'bg-blue-50 text-blue-800'
                    }`}
                  >
                    {FACE_SHAPE_FAILURE_REASON_LABELS[reason]}
                    <span className="font-bold">{count}</span>
                  </span>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Detection Records</CardTitle>
          <CardDescription>
            Only completion status, failure reason, and time are stored. Photos and detection
            results remain on device.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-gray-500">Status:</span>
            <Link href={buildFilterUrl(1, undefined, reasonFilter)} className={filterPillClass(!statusFilter)}>
              All
            </Link>
            <Link href={buildFilterUrl(1, 'COMPLETED', reasonFilter)} className={filterPillClass(statusFilter === 'COMPLETED')}>
              Completed
            </Link>
            <Link href={buildFilterUrl(1, 'FAILED', reasonFilter)} className={filterPillClass(statusFilter === 'FAILED')}>
              Failed
            </Link>
          </div>

          {activeReasons.length > 0 && (
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-gray-500">Reason:</span>
              <Link
                href={buildFilterUrl(1, statusFilter, undefined)}
                className={filterPillClass(!reasonFilter)}
              >
                All
              </Link>
              {activeReasons.map((reason) => (
                <Link
                  key={reason}
                  href={buildFilterUrl(1, statusFilter, reason)}
                  className={filterPillClass(reasonFilter === reason)}
                >
                  {FACE_SHAPE_FAILURE_REASON_LABELS[reason]}
                </Link>
              ))}
            </div>
          )}

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Reason</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {detections.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="py-8 text-center text-muted-foreground">
                      No face shape detection records match the current filters
                    </TableCell>
                  </TableRow>
                ) : (
                  detections.map((detection) => (
                    <TableRow key={detection.id}>
                      <TableCell>{detection.createdAt.toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge variant={detection.status === 'COMPLETED' ? 'default' : 'destructive'}>
                          {detection.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {detection.failureReason ? (
                          <span
                            className={`text-sm font-medium ${
                              FACE_SHAPE_FAILURE_REASON_GROUPS.infrastructure.includes(
                                detection.failureReason as FaceShapeFailureReason,
                              )
                                ? 'text-orange-600'
                                : 'text-gray-600'
                            }`}
                          >
                            {FACE_SHAPE_FAILURE_REASON_LABELS[
                              detection.failureReason as FaceShapeFailureReason
                            ] ?? detection.failureReason}
                          </span>
                        ) : detection.status === 'FAILED' ? (
                          <span className="text-sm text-gray-400">Unspecified</span>
                        ) : (
                          <span className="text-sm text-gray-400">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="mt-6 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
              {totalDetections !== totalCount && ` · ${totalDetections} matching records`}
            </span>
            <div className="flex gap-2">
              {currentPage > 1 ? (
                <Link
                  href={buildFilterUrl(currentPage - 1, statusFilter, reasonFilter)}
                  className="rounded border px-4 py-2 text-sm font-medium hover:bg-gray-50"
                >
                  Previous
                </Link>
              ) : (
                <span className="cursor-not-allowed rounded border bg-gray-100 px-4 py-2 text-sm font-medium text-gray-400">
                  Previous
                </span>
              )}
              {currentPage < totalPages ? (
                <Link
                  href={buildFilterUrl(currentPage + 1, statusFilter, reasonFilter)}
                  className="rounded border px-4 py-2 text-sm font-medium hover:bg-gray-50"
                >
                  Next
                </Link>
              ) : (
                <span className="cursor-not-allowed rounded border bg-gray-100 px-4 py-2 text-sm font-medium text-gray-400">
                  Next
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
