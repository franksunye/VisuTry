'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'

export default function DebugAuthPage() {
  const { data: session, status } = useSession()
  const [dbUser, setDbUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchDbUser() {
      if (session?.user?.id) {
        try {
          const res = await fetch('/api/user/profile')
          const data = await res.json()
          setDbUser(data)
        } catch (error) {
          console.error('Error fetching user:', error)
        }
      }
      setLoading(false)
    }
    
    if (status !== 'loading') {
      fetchDbUser()
    }
  }, [session, status])

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading session info...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">🔍 Auth Debug Information</h1>

        {/* Session Status */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Session Status</h2>
          <div className="space-y-2">
            <p><span className="font-medium">Status:</span> {status}</p>
            <p><span className="font-medium">Has Session:</span> {session ? '✅ Yes' : '❌ No'}</p>
          </div>
        </div>

        {/* Session Data */}
        {session && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Session Data</h2>
            <div className="space-y-2">
              <p><span className="font-medium">User ID:</span> {session.user?.id || 'N/A'}</p>
              <p><span className="font-medium">Email:</span> {session.user?.email || 'N/A'}</p>
              <p><span className="font-medium">Name:</span> {session.user?.name || 'N/A'}</p>
              <p><span className="font-medium">Role (from session):</span> {(session.user as any)?.role || '❌ undefined'}</p>
              <p><span className="font-medium">Free Trials Used:</span> {session.user?.freeTrialsUsed ?? 'N/A'}</p>
              <p><span className="font-medium">Is Premium:</span> {session.user?.isPremium ? '✅ Yes' : '❌ No'}</p>
            </div>
          </div>
        )}

        {/* Database User Data */}
        {dbUser && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Database User Data</h2>
            {dbUser.success ? (
              <div className="space-y-2">
                <p><span className="font-medium">User ID:</span> {dbUser.data?.id || 'N/A'}</p>
                <p><span className="font-medium">Email:</span> {dbUser.data?.email || 'N/A'}</p>
                <p><span className="font-medium">Name:</span> {dbUser.data?.name || 'N/A'}</p>
                <p><span className="font-medium">Role (from DB):</span> {dbUser.data?.role || '❌ undefined'}</p>
                <p><span className="font-medium">Free Trials Used:</span> {dbUser.data?.freeTrialsUsed ?? 'N/A'}</p>
                <p><span className="font-medium">Is Premium:</span> {dbUser.data?.isPremium ? '✅ Yes' : '❌ No'}</p>
                <p><span className="font-medium">Created At:</span> {dbUser.data?.createdAt ? new Date(dbUser.data.createdAt).toLocaleString() : 'N/A'}</p>
              </div>
            ) : (
              <p className="text-red-600">Error: {dbUser.error}</p>
            )}
          </div>
        )}

        {/* Diagnosis */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-blue-900">🔍 Diagnosis</h2>
          <div className="space-y-3 text-sm">
            {!session && (
              <div className="bg-red-100 border border-red-300 rounded p-3">
                <p className="font-medium text-red-900">❌ Not logged in</p>
                <p className="text-red-700">Please sign in first</p>
              </div>
            )}
            
            {session && !(session.user as any)?.role && (
              <div className="bg-yellow-100 border border-yellow-300 rounded p-3">
                <p className="font-medium text-yellow-900">⚠️ Role missing from session</p>
                <p className="text-yellow-700">JWT token does not contain role information</p>
                <p className="text-yellow-700 mt-2">Solution: Sign out and sign in again to refresh token</p>
              </div>
            )}

            {session && dbUser?.data?.role && (session.user as any)?.role !== dbUser.data.role && (
              <div className="bg-yellow-100 border border-yellow-300 rounded p-3">
                <p className="font-medium text-yellow-900">⚠️ Role mismatch</p>
                <p className="text-yellow-700">Session role: {(session.user as any)?.role || 'undefined'}</p>
                <p className="text-yellow-700">Database role: {dbUser.data.role}</p>
                <p className="text-yellow-700 mt-2">Solution: Sign out and sign in again to sync</p>
              </div>
            )}

            {session && (session.user as any)?.role === 'ADMIN' && (
              <div className="bg-green-100 border border-green-300 rounded p-3">
                <p className="font-medium text-green-900">✅ Admin access granted</p>
                <p className="text-green-700">You should be able to access /admin</p>
              </div>
            )}

            {session && (session.user as any)?.role === 'USER' && (
              <div className="bg-blue-100 border border-blue-300 rounded p-3">
                <p className="font-medium text-blue-900">ℹ️ Regular user</p>
                <p className="text-blue-700">You do not have admin access</p>
                <p className="text-blue-700 mt-2">If you should be an admin, contact support</p>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Actions</h2>
          <div className="space-y-3">
            <a
              href="/api/auth/signout"
              className="block w-full text-center px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            >
              Sign Out
            </a>
            <a
              href="/admin"
              className="block w-full text-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Try Access Admin
            </a>
          </div>
        </div>

        {/* Raw Data */}
        <details className="mt-6">
          <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-900">
            Show Raw Data (for debugging)
          </summary>
          <div className="mt-4 space-y-4">
            <div>
              <h3 className="font-medium mb-2">Session Object:</h3>
              <pre className="bg-gray-100 p-4 rounded text-xs overflow-auto">
                {JSON.stringify(session, null, 2)}
              </pre>
            </div>
            <div>
              <h3 className="font-medium mb-2">Database User Object:</h3>
              <pre className="bg-gray-100 p-4 rounded text-xs overflow-auto">
                {JSON.stringify(dbUser, null, 2)}
              </pre>
            </div>
          </div>
        </details>
      </div>
    </div>
  )
}

