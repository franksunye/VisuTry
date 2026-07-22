'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CreditCard, CheckCircle, XCircle, Clock } from 'lucide-react'
import Link from 'next/link'
import { useQuota } from '@/hooks/useQuota'
import { AutoRefreshWrapper } from '@/components/payments/AutoRefreshWrapper'
import { ManageSubscriptionButton } from '@/components/payments/ManageSubscriptionButton'
import { localizedPath } from '@/lib/localized-path'

interface Payment {
  id: string
  productType: string
  description: string | null
  createdAt: string
  stripePaymentId: string | null
  amount: number
  currency: string
  status: string
}

interface PaymentsPageClientProps {
  locale: string
}

/**
 * Client-side payments page.
 *
 * Replaces the previous server-side getServerSession + prisma.payment.findMany
 * to avoid Neon HTTP driver timeouts during SSR.
 */
export function PaymentsPageClient({ locale }: PaymentsPageClientProps) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const quota = useQuota()
  const [payments, setPayments] = useState<Payment[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push(localizedPath(locale, '/auth/signin'))
    }
  }, [status, router, locale])

  useEffect(() => {
    if (status !== 'authenticated') return
    let cancelled = false
    fetch('/api/payment/history')
      .then(async (res) => {
        if (!res.ok) throw new Error('Failed to fetch payment history')
        const json = await res.json()
        if (!cancelled && json.success) {
          setPayments(json.data)
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Failed to load payment history')
      })
    return () => { cancelled = true }
  }, [status])

  if (status === 'loading' || (status === 'authenticated' && payments === null && !error)) {
    return (
      <div className="container max-w-4xl px-4 py-8 mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Payment History</h1>
          <p className="mt-2 text-gray-600">View all your transactions and subscription details</p>
        </div>
        <div className="p-6 mb-8 bg-white border border-gray-200 rounded-lg shadow-sm animate-pulse">
          <div className="h-6 w-48 bg-gray-200 rounded mb-4" />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="p-4 rounded-lg bg-gray-50 h-24" />
            ))}
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm animate-pulse">
          <div className="p-6 border-b border-gray-200">
            <div className="h-6 w-40 bg-gray-200 rounded" />
          </div>
          <div className="p-6 space-y-4">
            {[0, 1].map((i) => (
              <div key={i} className="h-16 bg-gray-100 rounded" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container max-w-4xl px-4 py-8 mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Payment History</h1>
        </div>
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

  const user = session?.user as any
  if (!user) return null

  const creditsRemaining = quota.creditsRemaining
  const creditsPurchased = quota.creditsPurchased
  const subscriptionQuota = quota.quotaLabelCount
  const subscriptionQuotaLabel = quota.quotaLabel

  const paymentList = payments || []

  return (
    <AutoRefreshWrapper>
      <div className="container max-w-4xl px-4 py-8 mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Payment History</h1>
          <p className="mt-2 text-gray-600">View all your transactions and subscription details</p>
        </div>

        {/* Current Status Card */}
        <div className="p-6 mb-8 bg-white border border-gray-200 rounded-lg shadow-sm">
          <h2 className="mb-4 text-xl font-semibold">Current Status</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="p-4 rounded-lg bg-blue-50">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm text-blue-600">Membership</div>
                  <div className="mt-1 text-2xl font-bold text-blue-900">
                    {user.isPremiumActive ? 'Standard' : 'Free'}
                  </div>
                  {user.isPremiumActive && user.premiumExpiresAt && (
                    <div className="mt-1 text-xs text-blue-700">
                      Expires: {new Date(user.premiumExpiresAt).toLocaleDateString()}
                    </div>
                  )}
                </div>
                {user.isPremiumActive && <ManageSubscriptionButton />}
              </div>
              {user.isPremiumActive && (
                <div className="mt-2 text-xs text-blue-700">
                  You can update payment method or cancel from Stripe Billing Portal.
                </div>
              )}
            </div>

            <div className="p-4 rounded-lg bg-green-50">
              <div className="text-sm text-green-600">Credits Balance</div>
              <div className="mt-1 text-2xl font-bold text-green-900">
                {creditsRemaining}/{creditsPurchased}
              </div>
              <div className="mt-1 text-xs text-green-700">Never expire</div>
            </div>

            <div className="p-4 rounded-lg bg-purple-50">
              <div className="text-sm text-purple-600">
                {user.isPremiumActive ? 'Subscription Quota' : 'Free Trials'}
              </div>
              <div className="mt-1 text-2xl font-bold text-purple-900">
                {subscriptionQuota}
              </div>
              <div className="mt-1 text-xs text-purple-700">
                {subscriptionQuotaLabel}
              </div>
            </div>
          </div>
        </div>

        {/* Payment History */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold">Transaction History</h2>
            <p className="mt-1 text-sm text-gray-600">
              {paymentList.length} {paymentList.length === 1 ? 'transaction' : 'transactions'} total
            </p>
          </div>

          {paymentList.length === 0 ? (
            <div className="p-12 text-center">
              <CreditCard className="w-16 h-16 mx-auto text-gray-300" />
              <h3 className="mt-4 text-lg font-medium text-gray-900">No payments yet</h3>
              <p className="mt-2 text-gray-600">Your payment history will appear here</p>
              <Link
                href={localizedPath(locale, '/pricing')}
                className="inline-block px-6 py-3 mt-6 text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-700"
              >
                View Pricing Plans
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {paymentList.map((payment) => {
                const statusConfig: Record<string, { icon: typeof CheckCircle; color: string; bg: string; label: string }> = {
                  COMPLETED: { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50', label: 'Completed' },
                  PENDING: { icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-50', label: 'Pending' },
                  FAILED: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-50', label: 'Failed' },
                  REFUNDED: { icon: XCircle, color: 'text-gray-600', bg: 'bg-gray-50', label: 'Refunded' },
                }

                const config = statusConfig[payment.status] || statusConfig.COMPLETED
                const StatusIcon = config.icon

                const productNames: Record<string, string> = {
                  PREMIUM_MONTHLY: 'Standard - Monthly',
                  PREMIUM_YEARLY: 'Standard - Annual',
                  CREDITS_PACK: 'Credits Pack (30 credits)',
                  CREDITS_PACK_PROMO_60: 'Credits Pack - Extended (60 credits)',
                  PREMIUM_MONTHLY_PROMO: 'Standard - Monthly (Extended)',
                  PREMIUM_YEARLY_PROMO: 'Standard - Annual (Extended)',
                }

                return (
                  <div key={payment.id} className="p-6 transition-colors hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center">
                          <h3 className="text-lg font-medium text-gray-900">
                            {productNames[payment.productType] || payment.productType}
                          </h3>
                          <span className={`ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.color}`}>
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {config.label}
                          </span>
                        </div>

                        {payment.description && (
                          <p className="mt-1 text-sm text-gray-600">{payment.description}</p>
                        )}

                        <div className="mt-2 text-sm text-gray-500">
                          {new Date(payment.createdAt).toLocaleString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>

                        {payment.stripePaymentId && (
                          <div className="mt-1 font-mono text-xs text-gray-400">
                            ID: {payment.stripePaymentId}
                          </div>
                        )}
                      </div>

                      <div className="ml-6 text-right">
                        <div className="text-2xl font-bold text-gray-900">
                          ${(payment.amount / 100).toFixed(2)}
                        </div>
                        <div className="text-sm text-gray-500 uppercase">
                          {payment.currency}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Help Section */}
        <div className="p-6 mt-8 border border-gray-200 rounded-lg bg-gray-50">
          <h3 className="font-semibold text-gray-900">Need help?</h3>
          <p className="mt-2 text-sm text-gray-600">
            If you have any questions about your payments or subscriptions, please contact our support team.
          </p>
          <div className="mt-4">
            <Link
              href={localizedPath(locale, '/pricing')}
              className="text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              View Pricing Plans →
            </Link>
          </div>
        </div>
      </div>
    </AutoRefreshWrapper>
  )
}
