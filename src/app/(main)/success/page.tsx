'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { CheckCircle, Glasses, ArrowRight, Sparkles, Crown, Loader2 } from 'lucide-react'
import Link from 'next/link'

// Payment processing status
type PaymentStatus = 'checking' | 'updating' | 'success' | 'redirecting' | 'error'

function SuccessContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { data: session, status, update } = useSession()
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('checking')
  const [countdown, setCountdown] = useState(3)
  const [statusMessage, setStatusMessage] = useState('Processing your payment...')
  const [initialBalance, setInitialBalance] = useState<number | null>(null)

  useEffect(() => {
    // Get session_id parameter
    const id = searchParams?.get('session_id') || null
    setSessionId(id)
  }, [searchParams])

  useEffect(() => {
    // 🔥 Smart waiting and auto-refresh flow
    if (status === 'authenticated' && paymentStatus === 'checking') {
      console.log('💳 Payment success page loaded, starting balance check...')

      // Record initial balance
      const currentBalance = (session?.user as any)?.creditsBalance || 0
      setInitialBalance(currentBalance)

      let attempts = 0
      const maxAttempts = 15 // Max 15 attempts (15 seconds)

      const checkBalanceUpdate = async () => {
        try {
          attempts++
          console.log(`🔍 Checking balance update (attempt ${attempts}/${maxAttempts})...`)

          // Query latest balance
          const response = await fetch('/api/user/balance')
          const data = await response.json()

          if (!data.success) {
            throw new Error(data.error || 'Failed to fetch balance')
          }

          const newBalance = data.data.creditsBalance
          console.log(`📊 Current balance: ${currentBalance} → New balance: ${newBalance}`)

          // Check if balance has been updated (increased)
          if (newBalance > currentBalance) {
            console.log('✅ Balance updated! Refreshing session...')
            setStatusMessage('Payment successful! Updating your account...')
            setPaymentStatus('updating')

            // Refresh session to get latest data
            await update()

            console.log('✅ Session refreshed successfully')
            setStatusMessage('Account updated! Redirecting...')
            setPaymentStatus('success')

            // Start countdown after 2 seconds
            setTimeout(() => {
              setPaymentStatus('redirecting')
            }, 2000)

          } else if (attempts >= maxAttempts) {
            // Max attempts reached, still refresh session and continue
            console.warn('⚠️ Max attempts reached, refreshing session anyway...')
            setStatusMessage('Updating your account...')
            setPaymentStatus('updating')

            await update()

            setStatusMessage('Account updated! Redirecting...')
            setPaymentStatus('success')

            setTimeout(() => {
              setPaymentStatus('redirecting')
            }, 2000)

          } else {
            // Continue polling
            setTimeout(checkBalanceUpdate, 1000) // Check every second
          }

        } catch (error) {
          console.error('❌ Error checking balance:', error)

          if (attempts >= maxAttempts) {
            // Try to refresh session even if error occurred
            setStatusMessage('Updating your account...')
            setPaymentStatus('updating')

            try {
              await update()
              setPaymentStatus('success')
              setTimeout(() => {
                setPaymentStatus('redirecting')
              }, 2000)
            } catch (updateError) {
              console.error('❌ Failed to refresh session:', updateError)
              setPaymentStatus('error')
              setStatusMessage('Update failed, please refresh the page')
            }
          } else {
            // Continue trying
            setTimeout(checkBalanceUpdate, 1000)
          }
        }
      }

      // Start checking
      checkBalanceUpdate()
    }
  }, [status, paymentStatus, session, update])

  useEffect(() => {
    // Countdown auto-redirect (only in redirecting state)
    if (paymentStatus === 'redirecting') {
      if (countdown > 0) {
        const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
        return () => clearTimeout(timer)
      } else {
        router.push('/dashboard?payment=success')
      }
    }
  }, [countdown, router, paymentStatus])

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto border-b-2 border-blue-600 rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Show processing state
  if (paymentStatus === 'checking' || paymentStatus === 'updating') {
    return (
      <div className="flex items-center justify-center min-h-screen px-4 bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="w-full max-w-md">
          <div className="p-8 bg-white shadow-xl rounded-2xl">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 mb-4 bg-blue-100 rounded-full">
                <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
              </div>
              <h2 className="mb-2 text-2xl font-bold text-gray-900">
                {paymentStatus === 'checking' ? 'Processing Payment...' : 'Updating Account...'}
              </h2>
              <p className="mb-6 text-gray-600">
                {statusMessage}
              </p>
              <div className="p-4 rounded-lg bg-blue-50">
                <p className="text-sm text-blue-800">
                  Please wait while we update your account balance
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Show error state
  if (paymentStatus === 'error') {
    return (
      <div className="flex items-center justify-center min-h-screen px-4 bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="w-full max-w-md">
          <div className="p-8 bg-white shadow-xl rounded-2xl">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 mb-4 bg-red-100 rounded-full">
                <CheckCircle className="w-12 h-12 text-red-600" />
              </div>
              <h2 className="mb-2 text-2xl font-bold text-gray-900">
                Update Failed
              </h2>
              <p className="mb-6 text-gray-600">
                {statusMessage}
              </p>
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center px-6 py-3 text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-700"
              >
                Go to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center min-h-screen px-4 bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="w-full max-w-2xl">
        {/* Success Card */}
        <div className="overflow-hidden bg-white shadow-xl rounded-2xl">
          {/* Header with gradient */}
          <div className="p-8 text-center bg-gradient-to-r from-green-500 to-emerald-600">
            <div className="inline-flex items-center justify-center w-20 h-20 mb-4 bg-white rounded-full animate-bounce">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
            <h1 className="mb-2 text-3xl font-bold text-white">
              Payment Successful!
            </h1>
            <p className="text-lg text-green-50">
              Thank you for your purchase
            </p>
          </div>

          {/* Content */}
          <div className="p-8">
            {/* Success Message */}
            <div className="mb-8 text-center">
              <div className="inline-flex items-center justify-center mb-4 space-x-2">
                <Sparkles className="w-6 h-6 text-yellow-500" />
                <h2 className="text-2xl font-semibold text-gray-900">
                  Account Updated!
                </h2>
                <Sparkles className="w-6 h-6 text-yellow-500" />
              </div>
              <p className="text-gray-600">
                Your payment has been processed successfully and your account balance has been updated!
              </p>
            </div>

            {/* Session Info */}
            {sessionId && (
              <div className="p-4 mb-6 rounded-lg bg-gray-50">
                <p className="mb-1 text-sm text-gray-600">Transaction ID:</p>
                <p className="font-mono text-xs text-gray-800 break-all">
                  {sessionId}
                </p>
              </div>
            )}

            {/* Features Unlocked */}
            <div className="mb-8">
              <h3 className="flex items-center mb-4 text-lg font-semibold text-gray-900">
                <Crown className="w-5 h-5 mr-2 text-yellow-500" />
                Features Unlocked
              </h3>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="flex items-start p-3 space-x-3 rounded-lg bg-blue-50">
                  <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-blue-900">Unlimited AI Try-Ons</p>
                    <p className="text-sm text-blue-700">No more limits on virtual try-ons</p>
                  </div>
                </div>
                <div className="flex items-start p-3 space-x-3 rounded-lg bg-purple-50">
                  <CheckCircle className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-purple-900">High-Quality Processing</p>
                    <p className="text-sm text-purple-700">Best image quality available</p>
                  </div>
                </div>
                <div className="flex items-start p-3 space-x-3 rounded-lg bg-green-50">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-green-900">Priority Processing</p>
                    <p className="text-sm text-green-700">Faster results for your try-ons</p>
                  </div>
                </div>
                <div className="flex items-start p-3 space-x-3 rounded-lg bg-yellow-50">
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
              <div className="p-4 mb-6 border border-blue-200 rounded-lg bg-gradient-to-r from-blue-50 to-purple-50">
                <div className="flex items-center space-x-3">
                  {session.user.image && (
                    <img
                      src={session.user.image}
                      alt={session.user.name || 'User'}
                      className="w-12 h-12 border-2 border-white rounded-full shadow-sm"
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
                    <div className="flex items-center px-3 py-1 space-x-1 text-sm font-medium text-yellow-800 bg-yellow-100 rounded-full">
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
                className="flex items-center justify-center w-full px-6 py-4 text-white transition-all duration-200 rounded-lg shadow-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 hover:shadow-xl"
              >
                <Glasses className="w-5 h-5 mr-2" />
                Start AI Try-On Now
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>

              <Link
                href="/dashboard"
                className="flex items-center justify-center w-full px-6 py-3 text-gray-700 transition-colors bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Go to Dashboard
              </Link>
            </div>

            {/* Auto Redirect Notice */}
            <div className="mt-6 text-center">
              <div className="inline-flex items-center justify-center space-x-2 text-sm text-gray-500">
                <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                <p>
                  Redirecting to dashboard in {countdown} seconds...
                </p>
              </div>
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto border-b-2 border-blue-600 rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  )
}

