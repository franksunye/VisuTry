import { redirect } from "next/navigation"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { ArrowLeft, CreditCard, CheckCircle, XCircle, Clock } from "lucide-react"
import Link from "next/link"
import { Metadata } from 'next'
import { generateSEO } from '@/lib/seo'
import { getSubscriptionQuotaLabel } from '@/config/pricing'

export const metadata: Metadata = generateSEO({
  title: 'Payment History - AI Glasses Try-On | VisuTry',
  description: 'View your payment history and subscription details.',
  url: '/payments',
})

export default async function PaymentsPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/auth/signin")
  }

  // Get all payment records for the user
  const payments = await prisma.payment.findMany({
    where: {
      userId: session.user.id
    },
    orderBy: {
      createdAt: 'desc'
    }
  })

  // Get current user status
  const user = session.user
  // TypeScript workaround: creditsBalance is defined in types/next-auth.d.ts but may not be recognized during build
  const creditsBalance = (user as any).creditsBalance || 0

  // Get latest subscription payment to determine subscription type
  const latestSubscriptionPayment = payments.find(p =>
    p.productType === 'PREMIUM_YEARLY' || p.productType === 'PREMIUM_MONTHLY'
  )
  const isYearlySubscription = latestSubscriptionPayment?.productType === 'PREMIUM_YEARLY'

  // Calculate subscription quota remaining using centralized config
  // Use premiumUsageCount for Premium users, freeTrialsUsed for free users
  const usageCount = user.isPremiumActive ? (user as any).premiumUsageCount || 0 : user.freeTrialsUsed
  const { quota: subscriptionQuota, label: subscriptionQuotaLabel } = getSubscriptionQuotaLabel(
    user.isPremiumActive,
    isYearlySubscription,
    usageCount
  )

  return (
    <div className="container max-w-4xl px-4 py-8 mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Payment History</h1>
          <p className="mt-2 text-gray-600">View all your transactions and subscription details</p>
        </div>
        <Link
          href="/dashboard"
          className="flex items-center px-4 py-2 text-gray-700 transition-colors bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Link>
      </div>

      {/* Current Status Card */}
      <div className="p-6 mb-8 bg-white border border-gray-200 rounded-lg shadow-sm">
        <h2 className="mb-4 text-xl font-semibold">Current Status</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="p-4 rounded-lg bg-blue-50">
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

          <div className="p-4 rounded-lg bg-green-50">
            <div className="text-sm text-green-600">Credits Balance</div>
            <div className="mt-1 text-2xl font-bold text-green-900">
              {creditsBalance}
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
            {payments.length} {payments.length === 1 ? 'transaction' : 'transactions'} total
          </p>
        </div>

        {payments.length === 0 ? (
          <div className="p-12 text-center">
            <CreditCard className="w-16 h-16 mx-auto text-gray-300" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">No payments yet</h3>
            <p className="mt-2 text-gray-600">Your payment history will appear here</p>
            <Link
              href="/pricing"
              className="inline-block px-6 py-3 mt-6 text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-700"
            >
              View Pricing Plans
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {payments.map((payment) => {
              const statusConfig = {
                COMPLETED: {
                  icon: CheckCircle,
                  color: 'text-green-600',
                  bg: 'bg-green-50',
                  label: 'Completed'
                },
                PENDING: {
                  icon: Clock,
                  color: 'text-yellow-600',
                  bg: 'bg-yellow-50',
                  label: 'Pending'
                },
                FAILED: {
                  icon: XCircle,
                  color: 'text-red-600',
                  bg: 'bg-red-50',
                  label: 'Failed'
                },
                REFUNDED: {
                  icon: XCircle,
                  color: 'text-gray-600',
                  bg: 'bg-gray-50',
                  label: 'Refunded'
                }
              }

              const config = statusConfig[payment.status]
              const StatusIcon = config.icon

              const productNames = {
                PREMIUM_MONTHLY: 'Standard - Monthly',
                PREMIUM_YEARLY: 'Standard - Annual',
                CREDITS_PACK: 'Credits Pack (10 credits)'
              }

              return (
                <div key={payment.id} className="p-6 transition-colors hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center">
                        <h3 className="text-lg font-medium text-gray-900">
                          {productNames[payment.productType]}
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
                          minute: '2-digit'
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
        <div className="flex gap-4 mt-4">
          <Link
            href="/pricing"
            className="text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            View Pricing Plans →
          </Link>
          <Link
            href="/dashboard"
            className="text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            Back to Dashboard →
          </Link>
        </div>
      </div>
    </div>
  )
}

