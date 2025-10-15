'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { RefreshCw, CheckCircle, XCircle, AlertTriangle } from 'lucide-react'

/**
 * 测试页面：验证订阅状态在页面刷新后的一致性
 * 
 * 这个页面用于验证修复是否成功：
 * - 显示 session 中的订阅状态
 * - 提供刷新按钮来测试状态一致性
 * - 记录每次访问的状态历史
 */

interface StatusRecord {
  timestamp: string
  isPremium: boolean
  isPremiumActive: boolean
  premiumExpiresAt: string | null
  freeTrialsUsed: number
  remainingTrials: number
}

export default function TestSubscriptionPage() {
  const { data: session, status } = useSession()
  const [history, setHistory] = useState<StatusRecord[]>([])
  const [refreshCount, setRefreshCount] = useState(0)

  // 记录当前状态
  useEffect(() => {
    if (session?.user) {
      const record: StatusRecord = {
        timestamp: new Date().toISOString(),
        isPremium: session.user.isPremium || false,
        isPremiumActive: session.user.isPremiumActive || false,
        premiumExpiresAt: session.user.premiumExpiresAt?.toString() || null,
        freeTrialsUsed: session.user.freeTrialsUsed || 0,
        remainingTrials: session.user.remainingTrials || 0,
      }
      
      setHistory(prev => [...prev, record])
    }
  }, [session, refreshCount])

  const handleRefresh = () => {
    setRefreshCount(prev => prev + 1)
    window.location.reload()
  }

  const checkConsistency = () => {
    if (history.length < 2) return null
    
    const first = history[0]
    const latest = history[history.length - 1]
    
    const isConsistent = 
      first.isPremium === latest.isPremium &&
      first.isPremiumActive === latest.isPremiumActive &&
      first.freeTrialsUsed === latest.freeTrialsUsed
    
    return isConsistent
  }

  const consistency = checkConsistency()

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 mx-auto mb-4 animate-spin text-blue-600" />
          <p className="text-gray-600">Loading session...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-yellow-600" />
          <h1 className="text-2xl font-bold mb-2">Not Logged In</h1>
          <p className="text-gray-600 mb-4">Please log in to test subscription status</p>
          <a
            href="/auth/signin"
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Sign In
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Subscription Status Test</h1>
        <p className="text-gray-600">
          This page tests if subscription status remains consistent after page refresh
        </p>
      </div>

      {/* Current Status */}
      <div className="bg-white border rounded-lg shadow-sm p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <User className="w-5 h-5 mr-2" />
          Current Session Status
        </h2>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">User ID</p>
            <p className="font-mono text-sm">{session.user.id}</p>
          </div>
          
          <div>
            <p className="text-sm text-gray-600">Name</p>
            <p className="font-medium">{session.user.name || 'N/A'}</p>
          </div>
          
          <div>
            <p className="text-sm text-gray-600">Is Premium</p>
            <p className="font-medium">
              {session.user.isPremium ? (
                <span className="text-green-600 flex items-center">
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Yes
                </span>
              ) : (
                <span className="text-gray-600 flex items-center">
                  <XCircle className="w-4 h-4 mr-1" />
                  No
                </span>
              )}
            </p>
          </div>
          
          <div>
            <p className="text-sm text-gray-600">Is Premium Active</p>
            <p className="font-medium">
              {session.user.isPremiumActive ? (
                <span className="text-green-600 flex items-center">
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Active
                </span>
              ) : (
                <span className="text-gray-600 flex items-center">
                  <XCircle className="w-4 h-4 mr-1" />
                  Inactive
                </span>
              )}
            </p>
          </div>
          
          <div>
            <p className="text-sm text-gray-600">Premium Expires At</p>
            <p className="font-mono text-sm">
              {session.user.premiumExpiresAt 
                ? new Date(session.user.premiumExpiresAt).toLocaleString()
                : 'N/A'}
            </p>
          </div>
          
          <div>
            <p className="text-sm text-gray-600">Free Trials Used</p>
            <p className="font-medium">{session.user.freeTrialsUsed || 0}</p>
          </div>
          
          <div>
            <p className="text-sm text-gray-600">Remaining Trials</p>
            <p className="font-medium">{session.user.remainingTrials || 0}</p>
          </div>
        </div>
      </div>

      {/* Consistency Check */}
      {history.length > 1 && (
        <div className={`border rounded-lg shadow-sm p-6 mb-6 ${
          consistency ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
        }`}>
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            {consistency ? (
              <>
                <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
                <span className="text-green-900">Consistency Check: PASSED</span>
              </>
            ) : (
              <>
                <XCircle className="w-5 h-5 mr-2 text-red-600" />
                <span className="text-red-900">Consistency Check: FAILED</span>
              </>
            )}
          </h2>
          
          <p className={consistency ? 'text-green-800' : 'text-red-800'}>
            {consistency 
              ? '✅ Subscription status remained consistent across page refreshes'
              : '❌ Subscription status changed after page refresh - this indicates a bug'}
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="bg-white border rounded-lg shadow-sm p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Test Actions</h2>
        
        <div className="space-y-3">
          <button
            onClick={handleRefresh}
            className="w-full flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="w-5 h-5 mr-2" />
            Refresh Page (Test Consistency)
          </button>
          
          <p className="text-sm text-gray-600 text-center">
            Click to refresh and check if subscription status remains the same
          </p>
        </div>
      </div>

      {/* History */}
      <div className="bg-white border rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold mb-4">Status History</h2>
        
        {history.length === 0 ? (
          <p className="text-gray-600">No history yet</p>
        ) : (
          <div className="space-y-3">
            {history.map((record, index) => (
              <div
                key={index}
                className="border rounded p-3 bg-gray-50"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">
                    Visit #{index + 1}
                  </span>
                  <span className="text-xs text-gray-600">
                    {new Date(record.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div>
                    <span className="text-gray-600">Premium: </span>
                    <span className={record.isPremium ? 'text-green-600 font-medium' : 'text-gray-600'}>
                      {record.isPremium ? 'Yes' : 'No'}
                    </span>
                  </div>
                  
                  <div>
                    <span className="text-gray-600">Active: </span>
                    <span className={record.isPremiumActive ? 'text-green-600 font-medium' : 'text-gray-600'}>
                      {record.isPremiumActive ? 'Yes' : 'No'}
                    </span>
                  </div>
                  
                  <div>
                    <span className="text-gray-600">Trials: </span>
                    <span className="font-medium">
                      {record.freeTrialsUsed}/{record.freeTrialsUsed + record.remainingTrials}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

