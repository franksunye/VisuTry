'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import { TryOnHistoryList } from '@/components/dashboard/TryOnHistoryList'
import { History } from 'lucide-react'
import Link from 'next/link'

interface Task {
  id: string
  type: string
  status: string
  userImageUrl: string
  itemImageUrl: string
  glassesImageUrl: string
  resultImageUrl: string
  errorMessage: string
  createdAt: string
  updatedAt: string
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

interface HistoryData {
  tasks: Task[]
  pagination: Pagination
}

interface HistoryPageClientProps {
  searchParamsPromise: Promise<{
    page?: string
    status?: string
  }>
  locale: string
}

/**
 * Client-side history page.
 *
 * Replaces the previous server-side getServerSession + prisma queries to avoid
 * Neon HTTP driver timeouts during SSR. Auth and data are fetched on the client.
 */
export function HistoryPageClient({ searchParamsPromise, locale }: HistoryPageClientProps) {
  const { data: session, status: authStatus } = useSession()
  const router = useRouter()
  const searchParams = use(searchParamsPromise)

  const page = parseInt(searchParams.page || '1')
  const statusFilter = searchParams.status || 'all'

  const [data, setData] = useState<HistoryData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Redirect to signin if unauthenticated
  useEffect(() => {
    if (authStatus === 'unauthenticated') {
      router.push(`/${locale}/auth/signin`)
    }
  }, [authStatus, router, locale])

  // Fetch history data
  useEffect(() => {
    if (authStatus !== 'authenticated' || !session?.user?.id) return

    let cancelled = false
    setLoading(true)
    setError(null)

    const statusParam = statusFilter !== 'all' ? `&status=${statusFilter}` : ''
    fetch(`/api/try-on/history?page=${page}&limit=12${statusParam}`)
      .then(async (res) => {
        if (!res.ok) throw new Error('Failed to fetch history')
        const json = await res.json()
        if (cancelled) return
        if (json.success) {
          setData(json.data)
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Failed to load history')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => { cancelled = true }
  }, [session?.user?.id, authStatus, page, statusFilter])

  // Loading state
  if (authStatus === 'loading' || (authStatus === 'authenticated' && loading && !data)) {
    return (
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
        <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
          <div className="h-8 bg-gray-100 rounded animate-pulse" />
        </div>
        <div className="space-y-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="bg-white rounded-lg shadow-sm border p-6 animate-pulse">
              <div className="flex gap-4">
                <div className="w-24 h-24 bg-gray-200 rounded-lg" />
                <div className="flex-1 space-y-3">
                  <div className="h-4 w-32 bg-gray-200 rounded" />
                  <div className="h-3 w-48 bg-gray-200 rounded" />
                  <div className="h-3 w-24 bg-gray-200 rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Try-On History</h1>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-700 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Try-On History</h1>
        <p className="text-gray-600 mt-1">View all your AI try-on records</p>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <History className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Total</p>
              <p className="text-2xl font-semibold text-gray-900">{data.pagination.total}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <div className="w-6 h-6 bg-green-600 rounded-full" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Completed</p>
              <p className="text-2xl font-semibold text-gray-900">-</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <div className="w-6 h-6 bg-yellow-600 rounded-full animate-pulse" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Processing</p>
              <p className="text-2xl font-semibold text-gray-900">-</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <div className="w-6 h-6 bg-red-600 rounded-full" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Failed</p>
              <p className="text-2xl font-semibold text-gray-900">-</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
        <div className="flex items-center space-x-4">
          <span className="text-sm font-medium text-gray-700">Filter by status:</span>
          <div className="flex space-x-2">
            {[
              { value: 'all', label: 'All' },
              { value: 'completed', label: 'Completed' },
              { value: 'processing', label: 'Processing' },
              { value: 'failed', label: 'Failed' },
            ].map((filter) => (
              <Link
                key={filter.value}
                href={`/${locale}/dashboard/history?status=${filter.value}&page=1`}
                className={`px-3 py-1 rounded-full text-sm transition-colors ${
                  statusFilter === filter.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {filter.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* History List */}
      <TryOnHistoryList
        tasks={data.tasks as any}
        currentPage={data.pagination.page}
        totalPages={data.pagination.totalPages}
        currentStatus={statusFilter}
      />
    </div>
  )
}
