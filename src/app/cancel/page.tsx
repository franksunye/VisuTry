'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { XCircle, Glasses, ArrowLeft, RefreshCw, HelpCircle, CreditCard } from 'lucide-react'
import Link from 'next/link'

function CancelContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { data: session, status } = useSession()
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [countdown, setCountdown] = useState(10)

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
      router.push('/pricing')
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
        {/* Cancel Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-gray-500 to-gray-600 p-8 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-full mb-4">
              <XCircle className="w-12 h-12 text-gray-600" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Payment Cancelled
            </h1>
            <p className="text-gray-100 text-lg">
              Your payment was not completed
            </p>
          </div>

          {/* Content */}
          <div className="p-8">
            {/* Message */}
            <div className="text-center mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">
                No worries, you can try again anytime
              </h2>
              <p className="text-gray-600">
                Your payment was cancelled and no charges were made to your account.
              </p>
            </div>

            {/* Session Info */}
            {sessionId && (
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <p className="text-sm text-gray-600 mb-1">Session ID:</p>
                <p className="text-xs font-mono text-gray-800 break-all">
                  {sessionId}
                </p>
              </div>
            )}

            {/* Why did this happen? */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <HelpCircle className="w-5 h-5 text-blue-600 mr-2" />
                Common Reasons for Cancellation
              </h3>
              <div className="space-y-3">
                <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-2 h-2 bg-gray-400 rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <p className="text-gray-800">You clicked the back button or closed the payment window</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-2 h-2 bg-gray-400 rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <p className="text-gray-800">You decided to review the pricing options again</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-2 h-2 bg-gray-400 rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <p className="text-gray-800">There was an issue with your payment method</p>
                  </div>
                </div>
              </div>
            </div>

            {/* User Info */}
            {session?.user && (
              <div className="bg-blue-50 rounded-lg p-4 mb-6 border border-blue-200">
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
                    <div className="flex items-center space-x-1 bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm font-medium">
                      <Glasses className="w-4 h-4" />
                      <span>Free User</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* What's Next */}
            <div className="mb-8 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 border border-blue-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                What would you like to do?
              </h3>
              <div className="space-y-2 text-sm text-gray-700">
                <p className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Review our pricing plans and choose the one that fits your needs</span>
                </p>
                <p className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Continue using VisuTry with your free trial credits</span>
                </p>
                <p className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Contact our support team if you need assistance</span>
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Link
                href="/pricing"
                className="w-full flex items-center justify-center px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <RefreshCw className="w-5 h-5 mr-2" />
                Try Again - View Pricing
              </Link>

              <Link
                href="/try-on"
                className="w-full flex items-center justify-center px-6 py-3 bg-white border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
              >
                <Glasses className="w-5 h-5 mr-2" />
                Continue with Free Trial
              </Link>

              <Link
                href="/dashboard"
                className="w-full flex items-center justify-center px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back to Dashboard
              </Link>
            </div>

            {/* Auto Redirect Notice */}
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-500">
                Redirecting to pricing page in <span className="font-semibold text-blue-600">{countdown}</span> seconds...
              </p>
            </div>
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-6 space-y-3">
          {/* Support */}
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="flex items-start space-x-3">
              <HelpCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Need Help?</h4>
                <p className="text-sm text-gray-600 mb-2">
                  If you encountered any issues during checkout, our support team is here to help.
                </p>
                <a
                  href="mailto:support@visutry.com"
                  className="text-sm text-blue-600 hover:underline inline-flex items-center"
                >
                  Contact Support
                  <ArrowLeft className="w-3 h-3 ml-1 rotate-180" />
                </a>
              </div>
            </div>
          </div>

          {/* Payment Methods */}
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="flex items-start space-x-3">
              <CreditCard className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Secure Payment</h4>
                <p className="text-sm text-gray-600">
                  We accept all major credit cards and use Stripe for secure payment processing.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function CancelPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <CancelContent />
    </Suspense>
  )
}

