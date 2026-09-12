import { Suspense } from 'react'
import { HistoryPageClient } from '@/components/dashboard/HistoryPageClient'

type HistoryPageProps = {
  params: { locale: string }
}

export default function HistoryPage({ params }: HistoryPageProps) {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Try-On History</h1>
            <p className="text-gray-600 mt-1">View all your AI try-on records</p>
          </div>
          <div className="grid md:grid-cols-4 gap-4 mb-8">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-lg shadow-sm border p-6 animate-pulse">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gray-200 rounded-lg" />
                  <div className="ml-4 space-y-2">
                    <div className="h-3 w-16 bg-gray-200 rounded" />
                    <div className="h-6 w-12 bg-gray-200 rounded" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      }
    >
      <HistoryPageClient locale={params.locale} />
    </Suspense>
  )
}
