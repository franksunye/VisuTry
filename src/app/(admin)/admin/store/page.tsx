import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export const dynamic = 'force-dynamic'

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
