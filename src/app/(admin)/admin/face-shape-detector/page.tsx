import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

export const dynamic = 'force-dynamic'

const ITEMS_PER_PAGE = 20

interface FaceShapeDetectorPageProps {
  searchParams: {
    page?: string
  }
}

export default async function FaceShapeDetectorPage({ searchParams }: FaceShapeDetectorPageProps) {
  const requestedPage = Number.parseInt(searchParams.page ?? '1', 10)
  const currentPage = Number.isFinite(requestedPage) ? Math.max(requestedPage, 1) : 1
  const [detections, totalDetections] = await Promise.all([
    prisma.faceShapeDetection.findMany({
      take: ITEMS_PER_PAGE,
      skip: (currentPage - 1) * ITEMS_PER_PAGE,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.faceShapeDetection.count(),
  ])
  const totalPages = Math.max(1, Math.ceil(totalDetections / ITEMS_PER_PAGE))

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Face Shape Detector</h2>
        <p className="text-muted-foreground">Anonymous on-device detection activity</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Detection Records</CardTitle>
          <CardDescription>
            Only completion status and time are stored. Photos and detection results remain on device.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {detections.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={2} className="py-8 text-center text-muted-foreground">
                      No face shape detection records yet
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
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="mt-6 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </span>
            <div className="flex gap-2">
              {currentPage > 1 ? (
                <Link href={`/admin/face-shape-detector?page=${currentPage - 1}`} className="rounded border px-4 py-2 text-sm font-medium hover:bg-gray-50">
                  Previous
                </Link>
              ) : (
                <span className="cursor-not-allowed rounded border bg-gray-100 px-4 py-2 text-sm font-medium text-gray-400">Previous</span>
              )}
              {currentPage < totalPages ? (
                <Link href={`/admin/face-shape-detector?page=${currentPage + 1}`} className="rounded border px-4 py-2 text-sm font-medium hover:bg-gray-50">
                  Next
                </Link>
              ) : (
                <span className="cursor-not-allowed rounded border bg-gray-100 px-4 py-2 text-sm font-medium text-gray-400">Next</span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
