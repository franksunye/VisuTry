'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'

export default function TestStripePage() {
  const { data: session, status } = useSession()
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const testCreateSession = async (productType: string) => {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch('/api/payment/create-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productType,
          successUrl: `${window.location.origin}/success`,
          cancelUrl: `${window.location.origin}/cancel`,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setResult({
          status: 'success',
          productType,
          sessionId: data.data?.sessionId,
          url: data.data?.url,
          fullResponse: data,
        })
      } else {
        setError(`Error ${response.status}: ${data.error || 'Unknown error'}`)
      }
    } catch (err: any) {
      setError(`Request failed: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-2xl font-bold text-red-600 mb-4">⚠️ Not Authenticated</h1>
          <p className="text-gray-700 mb-4">
            You need to be logged in to test the Stripe payment functionality.
          </p>
          <a
            href="/api/auth/signin"
            className="block w-full bg-blue-600 text-white text-center py-2 px-4 rounded hover:bg-blue-700 transition"
          >
            Sign In
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🧪 Stripe Payment API Test
          </h1>
          <p className="text-gray-600 mb-6">
            Test the Stripe payment integration functionality
          </p>

          {/* User Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h2 className="font-semibold text-blue-900 mb-2">👤 Current User</h2>
            <p className="text-sm text-blue-800">
              <strong>Name:</strong> {session?.user?.name || 'N/A'}
            </p>
            <p className="text-sm text-blue-800">
              <strong>Email:</strong> {session?.user?.email || 'N/A'}
            </p>
            <p className="text-sm text-blue-800">
              <strong>User ID:</strong> {(session?.user as any)?.id || 'N/A'}
            </p>
          </div>

          {/* Test Buttons */}
          <div className="space-y-4 mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Test Payment Sessions</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => testCreateSession('PREMIUM_MONTHLY')}
                disabled={loading}
                className="bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
              >
                {loading ? '⏳ Testing...' : '💳 Monthly ($9.99/mo)'}
              </button>

              <button
                onClick={() => testCreateSession('PREMIUM_YEARLY')}
                disabled={loading}
                className="bg-purple-600 text-white py-3 px-6 rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
              >
                {loading ? '⏳ Testing...' : '💎 Yearly ($99.99/yr)'}
              </button>

              <button
                onClick={() => testCreateSession('CREDITS_PACK')}
                disabled={loading}
                className="bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
              >
                {loading ? '⏳ Testing...' : '🎫 Credits ($2.99)'}
              </button>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-red-900 mb-2">❌ Error</h3>
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Result Display */}
          {result && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-semibold text-green-900 mb-3">✅ Success</h3>
              
              <div className="space-y-2 mb-4">
                <p className="text-sm text-green-800">
                  <strong>Product Type:</strong> {result.productType}
                </p>
                <p className="text-sm text-green-800">
                  <strong>Session ID:</strong> {result.sessionId}
                </p>
                {result.url && (
                  <div className="text-sm text-green-800">
                    <strong>Checkout URL:</strong>
                    <a
                      href={result.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-2 text-blue-600 hover:underline"
                    >
                      {result.url}
                    </a>
                  </div>
                )}
              </div>

              <details className="mt-4">
                <summary className="cursor-pointer text-sm font-semibold text-green-900 hover:text-green-700">
                  View Full Response
                </summary>
                <pre className="mt-2 p-3 bg-gray-100 rounded text-xs overflow-x-auto">
                  {JSON.stringify(result.fullResponse, null, 2)}
                </pre>
              </details>
            </div>
          )}

          {/* Instructions */}
          <div className="mt-8 bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-2">📋 Test Instructions</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700">
              <li>Make sure you are logged in (you should see your user info above)</li>
              <li>Click one of the payment buttons to create a checkout session</li>
              <li>Check the result to verify the session was created successfully</li>
              <li>In mock mode, you&apos;ll see a mock session ID and URL</li>
              <li>In production mode, you&apos;ll get a real Stripe checkout URL</li>
            </ol>
          </div>

          {/* Environment Info */}
          <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="font-semibold text-yellow-900 mb-2">⚙️ Environment</h3>
            <p className="text-sm text-yellow-800">
              <strong>Mode:</strong> {process.env.NEXT_PUBLIC_ENABLE_MOCKS === 'true' ? 'Mock Mode' : 'Production Mode'}
            </p>
            <p className="text-sm text-yellow-800">
              <strong>Base URL:</strong> {typeof window !== 'undefined' ? window.location.origin : 'N/A'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

