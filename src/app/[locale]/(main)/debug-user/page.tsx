'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { RefreshCw, Database, HardDrive, User, AlertTriangle, CheckCircle } from 'lucide-react'

interface DebugData {
  timestamp: string
  userId: string
  database: {
    user: any
    payments: any[]
    isPremiumActive: boolean
    tryOnStats: {
      total: number
      completed: number
    }
  }
  cache: {
    user: any
    payment: any
  }
  session: {
    user: any
  }
  consistency: {
    userDataMatch: boolean
    paymentDataMatch: boolean
  }
}

export default function DebugUserPage() {
  const { data: session, status } = useSession()
  const [debugData, setDebugData] = useState<DebugData | null>(null)
  const [loading, setLoading] = useState(false)
  const [clearingCache, setClearingCache] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const fetchDebugData = async () => {
    setLoading(true)
    setError(null)
    setMessage(null)

    try {
      const response = await fetch('/api/debug/user-data')
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      setDebugData(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const clearCache = async () => {
    setClearingCache(true)
    setError(null)
    setMessage(null)

    try {
      const response = await fetch('/api/debug/clear-cache', { method: 'POST' })
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      setMessage('Cache cleared successfully! Refreshing data...')

      // 等待一秒后自动刷新数据
      setTimeout(() => {
        fetchDebugData()
      }, 1000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setClearingCache(false)
    }
  }

  useEffect(() => {
    if (session) {
      fetchDebugData()
    }
  }, [session])

  if (status === 'loading') {
    return <div className="p-8">Loading session...</div>
  }

  if (!session) {
    return <div className="p-8">Please sign in to view debug information.</div>
  }

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <div className="p-6 bg-white rounded-lg shadow-lg">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900">User Data Debug</h1>
            <div className="flex space-x-3">
              <button
                onClick={clearCache}
                disabled={clearingCache || loading}
                className="flex items-center px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                <HardDrive className={`w-4 h-4 mr-2 ${clearingCache ? 'animate-pulse' : ''}`} />
                Clear Cache
              </button>
              <button
                onClick={fetchDebugData}
                disabled={loading || clearingCache}
                className="flex items-center px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>

          {error && (
            <div className="p-4 mb-6 border border-red-200 rounded-lg bg-red-50">
              <div className="flex items-center">
                <AlertTriangle className="w-5 h-5 mr-2 text-red-500" />
                <span className="text-red-700">Error: {error}</span>
              </div>
            </div>
          )}

          {message && (
            <div className="p-4 mb-6 border border-green-200 rounded-lg bg-green-50">
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 mr-2 text-green-500" />
                <span className="text-green-700">{message}</span>
              </div>
            </div>
          )}

          {debugData && (
            <div className="space-y-6">
              {/* Consistency Check */}
              <div className="p-4 rounded-lg bg-gray-50">
                <h2 className="flex items-center mb-3 text-lg font-semibold">
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Data Consistency Check
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  <div className={`p-3 rounded ${debugData.consistency.userDataMatch ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    <div className="font-medium">User Data Match</div>
                    <div className="text-sm">{debugData.consistency.userDataMatch ? 'Cache matches DB' : 'Cache differs from DB'}</div>
                  </div>
                  <div className={`p-3 rounded ${debugData.consistency.paymentDataMatch ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    <div className="font-medium">Payment Data Match</div>
                    <div className="text-sm">{debugData.consistency.paymentDataMatch ? 'Cache matches DB' : 'Cache differs from DB'}</div>
                  </div>
                </div>
              </div>

              {/* Database Data */}
              <div className="p-4 rounded-lg bg-blue-50">
                <h2 className="flex items-center mb-3 text-lg font-semibold">
                  <Database className="w-5 h-5 mr-2" />
                  Database Data (Source of Truth)
                </h2>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <h3 className="mb-2 font-medium">User Status</h3>
                    <pre className="p-3 overflow-auto text-sm bg-white border rounded">
{JSON.stringify({
  isPremium: debugData.database.user?.isPremium,
  isPremiumActive: debugData.database.isPremiumActive,
  premiumExpiresAt: debugData.database.user?.premiumExpiresAt,
  freeTrialsUsed: debugData.database.user?.freeTrialsUsed,
}, null, 2)}
                    </pre>
                  </div>
                  <div>
                    <h3 className="mb-2 font-medium">Recent Payments</h3>
                    <pre className="p-3 overflow-auto text-sm bg-white border rounded max-h-40">
{JSON.stringify(debugData.database.payments, null, 2)}
                    </pre>
                  </div>
                </div>
              </div>

              {/* Cache Data */}
              <div className="p-4 rounded-lg bg-yellow-50">
                <h2 className="flex items-center mb-3 text-lg font-semibold">
                  <HardDrive className="w-5 h-5 mr-2" />
                  Cache Data (What App Uses)
                </h2>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <h3 className="mb-2 font-medium">Cached User Data</h3>
                    <pre className="p-3 overflow-auto text-sm bg-white border rounded">
{JSON.stringify(debugData.cache.user, null, 2)}
                    </pre>
                  </div>
                  <div>
                    <h3 className="mb-2 font-medium">Cached Payment Data</h3>
                    <pre className="p-3 overflow-auto text-sm bg-white border rounded">
{JSON.stringify(debugData.cache.payment, null, 2)}
                    </pre>
                  </div>
                </div>
              </div>

              {/* Session Data */}
              <div className="p-4 rounded-lg bg-green-50">
                <h2 className="flex items-center mb-3 text-lg font-semibold">
                  <User className="w-5 h-5 mr-2" />
                  Session Data
                </h2>
                <pre className="p-3 overflow-auto text-sm bg-white border rounded">
{JSON.stringify(debugData.session.user, null, 2)}
                </pre>
              </div>

              {/* Metadata */}
              <div className="text-sm text-gray-500">
                <p>Last updated: {new Date(debugData.timestamp).toLocaleString()}</p>
                <p>User ID: {debugData.userId}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
