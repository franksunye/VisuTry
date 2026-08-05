import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  createStoreRuntime,
  getMerchantInsights,
} from '@/modules/store/application'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: { id: string }
}

export default async function AdminMerchantInsightsPage({ params }: PageProps) {
  const runtime = createStoreRuntime()
  let insights
  try {
    insights = await getMerchantInsights({
      merchants: runtime.merchants,
      events: runtime.events,
      merchantId: params.id,
      recordInsightsViewed: true,
    })
  } catch {
    notFound()
  }

  const { merchant, metrics, topFrames, recentSessions } = insights

  const metricCards = [
    { label: 'Sessions', value: metrics.sessions },
    { label: 'Photos uploaded', value: metrics.photosUploaded },
    { label: 'Recommendations', value: metrics.recommendations },
    { label: 'Try-ons', value: metrics.tryOns },
    { label: 'Try-on failures', value: metrics.tryOnFailures },
    { label: 'Compare starts', value: metrics.compareStarts },
    { label: 'Favorites', value: metrics.favorites },
    { label: 'Product clicks', value: metrics.productClicks },
    { label: 'Inquiries', value: metrics.inquiries },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Link href="/admin/store" className="text-sm text-blue-600 hover:underline">
            ← All merchants
          </Link>
          <h2 className="mt-2 text-3xl font-bold tracking-tight">{merchant.name}</h2>
          <p className="text-muted-foreground">
            {merchant.slug} · {merchant.status} · shopper photos are never shown
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Demo URL: <code>/en/store/{merchant.slug}</code>
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {metricCards.map((card) => (
          <Card key={card.label}>
            <CardHeader className="pb-2">
              <CardDescription>{card.label}</CardDescription>
              <CardTitle className="text-3xl">{card.value}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Top frames</CardTitle>
          <CardDescription>
            Ranked by try-ons, favorites, product clicks, and selections.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {topFrames.length === 0 ? (
            <p className="text-sm text-muted-foreground">No frame activity yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="py-2 pr-4">Frame</th>
                    <th className="py-2 pr-4">Shape</th>
                    <th className="py-2 pr-4">Selected</th>
                    <th className="py-2 pr-4">Try-ons</th>
                    <th className="py-2 pr-4">Favorites</th>
                    <th className="py-2">Clicks</th>
                  </tr>
                </thead>
                <tbody>
                  {topFrames.map((frame) => (
                    <tr key={frame.frameId} className="border-b last:border-0">
                      <td className="py-3 pr-4 font-medium">{frame.name}</td>
                      <td className="py-3 pr-4 capitalize">{frame.shape}</td>
                      <td className="py-3 pr-4">{frame.recommendations}</td>
                      <td className="py-3 pr-4">{frame.tryOns}</td>
                      <td className="py-3 pr-4">{frame.favorites}</td>
                      <td className="py-3">{frame.productClicks}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent sessions</CardTitle>
          <CardDescription>
            Anonymous session activity without shopper face images.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recentSessions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No sessions yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="py-2 pr-4">Session</th>
                    <th className="py-2 pr-4">Created</th>
                    <th className="py-2 pr-4">Selected</th>
                    <th className="py-2 pr-4">Tried</th>
                    <th className="py-2 pr-4">Compare</th>
                    <th className="py-2 pr-4">Favorite</th>
                    <th className="py-2 pr-4">Click</th>
                    <th className="py-2">Inquiry</th>
                  </tr>
                </thead>
                <tbody>
                  {recentSessions.map((session) => (
                    <tr key={session.sessionId} className="border-b last:border-0">
                      <td className="py-3 pr-4 font-medium">{session.shortLabel}</td>
                      <td className="py-3 pr-4">
                        {new Date(session.createdAt).toLocaleString()}
                      </td>
                      <td className="py-3 pr-4">{session.recommendedCount}</td>
                      <td className="py-3 pr-4">{session.triedCount}</td>
                      <td className="py-3 pr-4">{session.compared ? 'Yes' : '—'}</td>
                      <td className="py-3 pr-4">{session.favorited ? 'Yes' : '—'}</td>
                      <td className="py-3 pr-4">{session.productClicked ? 'Yes' : '—'}</td>
                      <td className="py-3">{session.inquired ? 'Yes' : '—'}</td>
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
