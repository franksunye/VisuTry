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
  const [error, setError] = useState<string | null>(null)

  const fetchDebugData = async () => {
    setLoading(true)
    setError(null)
    
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
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900">User Data Debug</h1>
            <button
              onClick={fetchDebugData}
              disabled={loading}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center">
                <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
                <span className="text-red-700">Error: {error}</span>
              </div>
            </div>
          )}

          {debugData && (
            <div className="space-y-6">
              {/* Consistency Check */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h2 className="text-lg font-semibold mb-3 flex items-center">
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
              <div className="bg-blue-50 rounded-lg p-4">
                <h2 className="text-lg font-semibold mb-3 flex items-center">
                  <Database className="w-5 h-5 mr-2" />
                  Database Data (Source of Truth)
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-medium mb-2">User Status</h3>
                    <pre className="text-sm bg-white p-3 rounded border overflow-auto">
{JSON.stringify({
  isPremium: debugData.database.user?.isPremium,
  isPremiumActive: debugData.database.isPremiumActive,
  premiumExpiresAt: debugData.database.user?.premiumExpiresAt,
  freeTrialsUsed: debugData.database.user?.freeTrialsUsed,
}, null, 2)}
                    </pre>
                  </div>
                  <div>
                    <h3 className="font-medium mb-2">Recent Payments</h3>
                    <pre className="text-sm bg-white p-3 rounded border overflow-auto max-h-40">
{JSON.stringify(debugData.database.payments, null, 2)}
                    </pre>
                  </div>
                </div>
              </div>

              {/* Cache Data */}
              <div className="bg-yellow-50 rounded-lg p-4">
                <h2 className="text-lg font-semibold mb-3 flex items-center">
                  <HardDrive className="w-5 h-5 mr-2" />
                  Cache Data (What App Uses)
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-medium mb-2">Cached User Data</h3>
                    <pre className="text-sm bg-white p-3 rounded border overflow-auto">
{JSON.stringify(debugData.cache.user, null, 2)}
                    </pre>
                  </div>
                  <div>
                    <h3 className="font-medium mb-2">Cached Payment Data</h3>
                    <pre className="text-sm bg-white p-3 rounded border overflow-auto">
{JSON.stringify(debugData.cache.payment, null, 2)}
                    </pre>
                  </div>
                </div>
              </div>

              {/* Session Data */}
              <div className="bg-green-50 rounded-lg p-4">
                <h2 className="text-lg font-semibold mb-3 flex items-center">
                  <User className="w-5 h-5 mr-2" />
                  Session Data
                </h2>
                <pre className="text-sm bg-white p-3 rounded border overflow-auto">
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
