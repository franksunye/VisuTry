'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { CheckCircle, Glasses, ArrowRight, Sparkles, Crown, Zap } from 'lucide-react'
import Link from 'next/link'

function SuccessContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { data: session, status } = useSession()
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [countdown, setCountdown] = useState(5)

  useEffect(() => {
    // 获取 session_id 参数
    const id = searchParams?.get('session_id') || null
    setSessionId(id)
  }, [searchParams])

  useEffect(() => {
    // 倒计时自动跳转
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    } else {
      router.push('/dashboard')
    }
  }, [countdown, router])

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <div className="max-w-2xl w-full">
        {/* Success Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header with gradient */}
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-8 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-full mb-4 animate-bounce">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Payment Successful!
            </h1>
            <p className="text-green-50 text-lg">
              Thank you for your purchase
            </p>
          </div>

          {/* Content */}
          <div className="p-8">
            {/* Success Message */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center space-x-2 mb-4">
                <Sparkles className="w-6 h-6 text-yellow-500" />
                <h2 className="text-2xl font-semibold text-gray-900">
                  Welcome to Premium!
                </h2>
                <Sparkles className="w-6 h-6 text-yellow-500" />
              </div>
              <p className="text-gray-600">
                Your payment has been processed successfully. You now have access to all premium features!
              </p>
            </div>

            {/* Session Info */}
            {sessionId && (
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <p className="text-sm text-gray-600 mb-1">Transaction ID:</p>
                <p className="text-xs font-mono text-gray-800 break-all">
                  {sessionId}
                </p>
              </div>
            )}

            {/* Features Unlocked */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Crown className="w-5 h-5 text-yellow-500 mr-2" />
                Features Unlocked
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-blue-900">Unlimited AI Try-Ons</p>
                    <p className="text-sm text-blue-700">No more limits on virtual try-ons</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3 p-3 bg-purple-50 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-purple-900">High-Quality Processing</p>
                    <p className="text-sm text-purple-700">Best image quality available</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-green-900">Priority Processing</p>
                    <p className="text-sm text-green-700">Faster results for your try-ons</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3 p-3 bg-yellow-50 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-yellow-900">Premium Support</p>
                    <p className="text-sm text-yellow-700">Get help when you need it</p>
                  </div>
                </div>
              </div>
            </div>

            {/* User Info */}
            {session?.user && (
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 mb-6 border border-blue-200">
                <div className="flex items-center space-x-3">
                  {session.user.image && (
                    <img
                      src={session.user.image}
                      alt={session.user.name || 'User'}
                      className="w-12 h-12 rounded-full border-2 border-white shadow-sm"
                    />
                  )}
                  <div>
                    <p className="font-semibold text-gray-900">
                      {session.user.name || 'User'}
                    </p>
                    <p className="text-sm text-gray-600">
                      {session.user.email}
                    </p>
                  </div>
                  <div className="ml-auto">
                    <div className="flex items-center space-x-1 bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">
                      <Crown className="w-4 h-4" />
                      <span>Premium</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-3">
              <Link
                href="/try-on"
                className="w-full flex items-center justify-center px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <Glasses className="w-5 h-5 mr-2" />
                Start AI Try-On Now
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>

              <Link
                href="/dashboard"
                className="w-full flex items-center justify-center px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Go to Dashboard
              </Link>
            </div>

            {/* Auto Redirect Notice */}
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-500">
                Redirecting to dashboard in <span className="font-semibold text-blue-600">{countdown}</span> seconds...
              </p>
            </div>
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Need help? Contact us at{' '}
            <a href="mailto:support@visutry.com" className="text-blue-600 hover:underline">
              support@visutry.com
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  )
}

