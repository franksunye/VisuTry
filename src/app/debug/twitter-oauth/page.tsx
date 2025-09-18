'use client'

import { useState, useEffect } from 'react'
import { signIn, useSession } from 'next-auth/react'
import { Twitter, CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react'

interface DebugInfo {
  success: boolean
  environment: Record<string, string>
  urls: Record<string, string>
  config_issues: string[]
  config_complete: boolean
  twitter_app_requirements: Record<string, any>
  common_issues: Array<{
    issue: string
    description: string
    solution: string
  }>
  next_steps: string[]
}

export default function TwitterOAuthDebugPage() {
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [testing, setTesting] = useState(false)
  const { data: session, status } = useSession()

  const fetchDebugInfo = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/debug/twitter-oauth')
      const data = await response.json()
      setDebugInfo(data)
    } catch (error) {
      console.error('Failed to fetch debug info:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDebugInfo()
  }, [])

  const handleTestLogin = async () => {
    setTesting(true)
    try {
      await signIn('twitter', { callbackUrl: '/debug/twitter-oauth' })
    } catch (error) {
      console.error('Login test failed:', error)
    } finally {
      setTesting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p>Loading debug information...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
            <Twitter className="w-6 h-6 mr-2 text-blue-500" />
            Twitter OAuth Debug Panel
          </h1>
          
          {session ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                <span className="text-green-800 font-medium">
                  ✅ Successfully logged in as {session.user?.name || session.user?.email}
                </span>
              </div>
            </div>
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-yellow-600 mr-2" />
                <span className="text-yellow-800">Not logged in</span>
              </div>
            </div>
          )}

          <div className="flex space-x-4 mb-6">
            <button
              onClick={handleTestLogin}
              disabled={testing}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white px-4 py-2 rounded-lg flex items-center"
            >
              <Twitter className="w-4 h-4 mr-2" />
              {testing ? 'Testing...' : 'Test Twitter Login'}
            </button>
            
            <button
              onClick={fetchDebugInfo}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh Debug Info
            </button>
          </div>
        </div>

        {debugInfo && (
          <>
            {/* Configuration Status */}
            <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                {debugInfo.config_complete ? (
                  <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-600 mr-2" />
                )}
                Configuration Status
              </h2>
              
              {debugInfo.config_complete ? (
                <p className="text-green-800">✅ All configuration looks good!</p>
              ) : (
                <div className="space-y-2">
                  <p className="text-red-800 font-medium">❌ Configuration issues found:</p>
                  <ul className="list-disc list-inside text-red-700 space-y-1">
                    {debugInfo.config_issues.map((issue, index) => (
                      <li key={index}>{issue}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Environment Variables */}
            <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">Environment Variables</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(debugInfo.environment).map(([key, value]) => (
                  <div key={key} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <span className="font-mono text-sm">{key}</span>
                    <span className={`px-2 py-1 rounded text-xs ${
                      value === 'SET' ? 'bg-green-100 text-green-800' : 
                      value === 'NOT_SET' ? 'bg-red-100 text-red-800' : 
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* URLs */}
            <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">Expected URLs</h2>
              <div className="space-y-3">
                {Object.entries(debugInfo.urls).map(([key, url]) => (
                  <div key={key} className="p-3 bg-gray-50 rounded">
                    <div className="font-medium text-sm text-gray-600 mb-1">
                      {key.replace('_', ' ').toUpperCase()}
                    </div>
                    <div className="font-mono text-sm break-all">{url}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Next Steps */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Next Steps</h2>
              <ol className="list-decimal list-inside space-y-2">
                {debugInfo.next_steps.map((step, index) => (
                  <li key={index} className="text-gray-700">{step}</li>
                ))}
              </ol>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
