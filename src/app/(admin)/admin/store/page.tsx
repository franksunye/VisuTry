import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export const dynamic = 'force-dynamic'

async function RetentionHealthCard() {
  const now = new Date()
  const [
    blockedAssets,
    blockedTasks,
    oldestBlockedAsset,
    oldestBlockedTask,
    pendingOrphans,
  ] = await Promise.all([
    prisma.storeAsset.count({
      where: { retentionStatus: 'DELETE_BLOCKED', deletedAt: null },
    }),
    prisma.tryOnTask.count({
      where: {
        retentionStatus: 'DELETE_BLOCKED',
        origin: { in: ['STORE_DEMO', 'STORE_PILOT'] },
      },
    }),
    prisma.storeAsset.findFirst({
      where: { retentionStatus: 'DELETE_BLOCKED', deletedAt: null },
      orderBy: { expiresAt: 'asc' },
      select: { expiresAt: true },
    }),
    prisma.tryOnTask.findFirst({
      where: {
        retentionStatus: 'DELETE_BLOCKED',
        origin: { in: ['STORE_DEMO', 'STORE_PILOT'] },
      },
      orderBy: { expiresAt: 'asc' },
      select: { expiresAt: true },
    }),
    prisma.storeOrphanBlob.count({ where: { deletedAt: null } }),
  ])

  const oldestCandidates = [oldestBlockedAsset?.expiresAt, oldestBlockedTask?.expiresAt].filter(
    Boolean,
  ) as Date[]
  const oldest =
    oldestCandidates.length > 0
      ? new Date(Math.min(...oldestCandidates.map((d) => d.getTime())))
      : null

  return (
    <Card>
      <CardHeader>
        <CardTitle>Retention health</CardTitle>
        <CardDescription>
          DELETE_BLOCKED rows keep retrying on a slow schedule — they are never abandoned.
          As of {now.toISOString()}.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-3 text-sm">
        <div>
          <div className="text-muted-foreground">Blocked StoreAssets</div>
          <div className="text-2xl font-semibold">{blockedAssets}</div>
        </div>
        <div>
          <div className="text-muted-foreground">Blocked Store TryOnTasks</div>
          <div className="text-2xl font-semibold">{blockedTasks}</div>
        </div>
        <div>
          <div className="text-muted-foreground">Pending orphan blobs</div>
          <div className="text-2xl font-semibold">{pendingOrphans}</div>
        </div>
        <div className="sm:col-span-3 text-muted-foreground">
          Oldest blocked expiry:{' '}
          {oldest ? oldest.toISOString() : 'none'}
        </div>
      </CardContent>
    </Card>
  )
}

export default async function AdminStoreMerchantsPage() {
  const merchants = await prisma.merchant.findMany({
    orderBy: { updatedAt: 'desc' },
    take: 50,
    select: {
      id: true,
      slug: true,
      name: true,
      status: true,
      updatedAt: true,
      _count: {
        select: {
          sessions: true,
          frames: true,
          intents: true,
        },
      },
    },
  })

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Store Merchants</h2>
        <p className="text-muted-foreground">
          D0 internal insights for merchant demos. Shopper photos are never shown here.
        </p>
      </div>

      <RetentionHealthCard />

      <Card>
        <CardHeader>
          <CardTitle>Merchants</CardTitle>
          <CardDescription>Open a merchant to view purchase-intent signals.</CardDescription>
        </CardHeader>
        <CardContent>
          {merchants.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No merchants yet. Run <code>npm run db:seed:store</code> to seed Luna Optical.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="py-2 pr-4">Name</th>
                    <th className="py-2 pr-4">Slug</th>
                    <th className="py-2 pr-4">Status</th>
                    <th className="py-2 pr-4">Frames</th>
                    <th className="py-2 pr-4">Sessions</th>
                    <th className="py-2 pr-4">Intents</th>
                    <th className="py-2">Insights</th>
                  </tr>
                </thead>
                <tbody>
                  {merchants.map((merchant) => (
                    <tr key={merchant.id} className="border-b last:border-0">
                      <td className="py-3 pr-4 font-medium">{merchant.name}</td>
                      <td className="py-3 pr-4">{merchant.slug}</td>
                      <td className="py-3 pr-4">{merchant.status}</td>
                      <td className="py-3 pr-4">{merchant._count.frames}</td>
                      <td className="py-3 pr-4">{merchant._count.sessions}</td>
                      <td className="py-3 pr-4">{merchant._count.intents}</td>
                      <td className="py-3">
                        <Link
                          href={`/admin/store/merchants/${merchant.id}`}
                          className="text-blue-600 hover:underline"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
