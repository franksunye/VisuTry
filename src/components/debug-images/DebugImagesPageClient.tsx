'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Image as ImageIcon, ChevronLeft } from 'lucide-react'
import { localizedPath } from '@/lib/localized-path'

interface DebugImage {
  id: string
  type: string
  status: string
  errorMessage: string | null
  createdAt: string
  userImageUrl: string | null
  itemImageUrl: string | null
  glassesImageUrl: string | null
  resultImageUrl: string | null
}

interface DebugImagesPageClientProps {
  locale: string
}

/**
 * Client-side debug-images page.
 *
 * Replaces the previous server-side getServerSession + prisma queries to avoid
 * Neon HTTP driver timeouts during SSR.
 */
export function DebugImagesPageClient({ locale }: DebugImagesPageClientProps) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [tasks, setTasks] = useState<DebugImage[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push(localizedPath(locale, '/auth/signin'))
    }
  }, [status, router, locale])

  useEffect(() => {
    if (status !== 'authenticated') return
    let cancelled = false
    fetch('/api/try-on/history?page=1&limit=100')
      .then(async (res) => {
        if (!res.ok) throw new Error('Failed to fetch')
        const json = await res.json()
        if (!cancelled && json.success) {
          setTasks(json.data.tasks)
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Failed to load')
      })
    return () => { cancelled = true }
  }, [status])

  if (status === 'loading' || (status === 'authenticated' && tasks === null && !error)) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link
            href={localizedPath(locale, '/dashboard')}
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
          >
            <ChevronLeft className="w-4 h-4 mr-1" /> Back to Dashboard
          </Link>
          <h1 className="mt-2 text-2xl font-bold">Debug: Image Records</h1>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-48 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
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

  if (!tasks) return null

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link
          href={localizedPath(locale, '/dashboard')}
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
        >
          <ChevronLeft className="w-4 h-4 mr-1" /> Back to Dashboard
        </Link>
        <h1 className="mt-2 text-2xl font-bold">Debug: Image Records</h1>
        <p className="mt-1 text-sm text-gray-600">
          {tasks.length} records total
        </p>
      </div>

      {tasks.length === 0 ? (
        <div className="text-center py-12">
          <ImageIcon className="w-16 h-16 mx-auto text-gray-300" />
          <p className="mt-4 text-gray-500">No records found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tasks.map((task) => (
            <div
              key={task.id}
              className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm"
            >
              <div className="p-4 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900">{task.type}</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      task.status === 'COMPLETED'
                        ? 'bg-green-100 text-green-700'
                        : task.status === 'FAILED'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}
                  >
                    {task.status}
                  </span>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  {new Date(task.createdAt).toLocaleString()}
                </p>
                {task.errorMessage && (
                  <p className="mt-1 text-xs text-red-600">{task.errorMessage}</p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2 p-4">
                {[
                  { label: 'Input', url: task.userImageUrl },
                  { label: 'Glasses', url: task.itemImageUrl || task.glassesImageUrl },
                  { label: 'Result', url: task.resultImageUrl },
                ].map((img) => (
                  <div key={img.label} className="aspect-square rounded overflow-hidden bg-gray-100">
                    {img.url ? (
                      <img
                        src={img.url}
                        alt={img.label}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          ;(e.target as HTMLImageElement).style.display = 'none'
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-xs text-gray-400">{img.label}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
