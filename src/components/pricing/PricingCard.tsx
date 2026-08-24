"use client"

import { useState } from "react"
import { useParams } from "next/navigation"
import { Check, Loader2 } from "lucide-react"
import { cn } from "@/utils/cn"
import { analytics, getAcquisitionContext, type ProductType } from "@/lib/analytics"
import { localizedPath } from "@/lib/localized-path"
import { useQuota } from "@/hooks/useQuota"

interface PricingPlan {
  id: string
  name: string
  description: string
  price: string
  period: string
  originalPrice?: string
  features: string[]
  buttonText: string
  popular: boolean
  icon: React.ReactNode
}

interface User {
  id: string
  isPremiumActive: boolean
  remainingTrials: number
}

interface PricingCardProps {
  plan: PricingPlan
  currentUser: User | null
}

function isCreditsPack(productId: string): boolean {
  return productId === "CREDITS_PACK" || productId === "CREDITS_PACK_PROMO_60"
}

export function PricingCard({ plan, currentUser }: PricingCardProps) {
  const [loading, setLoading] = useState(false)
  const params = useParams()
  const locale = params.locale as string | undefined
  const quota = useQuota()
  const pricingHref = localizedPath(locale, '/pricing')
  const dashboardHref = localizedPath(locale, '/dashboard')
  const signInHref = localizedPath(locale, '/auth/signin')
  const creditsPack = isCreditsPack(plan.id)
  const signedOutButtonText = creditsPack ? "Sign in to buy credits" : "Sign in to subscribe"

  // Keep a report-unlock purchase bound to the report for every product. This
  // is a defense-in-depth guard for mobile navigation, refreshes, and browsers
  // that restore the pricing URL directly.
  const reportUnlockTaskId = (() => {
    if (typeof window === 'undefined') return null
    const url = new URL(window.location.href)
    if (url.searchParams.get('source') !== 'face-analysis-unlock') return null
    return url.searchParams.get('taskId')?.trim() || null
  })()

  const handlePurchase = async () => {
    // If the user is not signed in, return them to pricing after authentication.
    if (!currentUser) {
      const returnHref = reportUnlockTaskId
        ? `${pricingHref}?source=face-analysis-unlock&taskId=${encodeURIComponent(reportUnlockTaskId)}`
        : pricingHref
      window.location.href = `${signInHref}?callbackUrl=${encodeURIComponent(returnHref)}`
      return
    }

    setLoading(true)

    try {
      // Track purchase intent before creating the Stripe Checkout session.
      const userType = quota.userType
      const planPrice = parseFloat(plan.price.replace('$', '').replace('/month', '').replace('/year', ''))
      analytics.trackClickPurchase(
        plan.id as ProductType,
        planPrice,
        userType,
        reportUnlockTaskId ? 'face_analysis_report' : 'pricing'
      )

      const purchaseContext = reportUnlockTaskId ? 'face_analysis_report' : 'pricing'
      const successUrl = reportUnlockTaskId
        ? `${window.location.origin}${localizedPath(locale, '/face-analysis')}?unlock=success&taskId=${encodeURIComponent(reportUnlockTaskId)}&session_id={CHECKOUT_SESSION_ID}`
        : `${window.location.origin}${dashboardHref}?payment=success&session_id={CHECKOUT_SESSION_ID}`
      const cancelUrl = reportUnlockTaskId
        ? `${window.location.origin}${pricingHref}?source=face-analysis-unlock&taskId=${encodeURIComponent(reportUnlockTaskId)}&payment=cancelled&checkout_product=${encodeURIComponent(plan.id)}&checkout_value=${planPrice}`
        : `${window.location.origin}${pricingHref}?payment=cancelled&checkout_product=${encodeURIComponent(plan.id)}&checkout_value=${planPrice}`

      const response = await fetch("/api/payment/create-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productType: plan.id,
          successUrl,
          cancelUrl,
          ...(reportUnlockTaskId ? { unlockTaskId: reportUnlockTaskId } : {}),
          attribution: getAcquisitionContext(),
          locale,
        }),
      })

      const data = await response.json()

      if (data.success && data.data.url) {
        analytics.trackBeginCheckout(plan.id as ProductType, planPrice, {
          checkoutSessionId: data.data.sessionId,
          purchaseContext,
          ...(reportUnlockTaskId ? { faceAnalysisTaskId: reportUnlockTaskId } : {}),
        })
        window.location.href = data.data.url
      } else {
        throw new Error(data.error || "Failed to create payment session")
      }
    } catch (error) {
      console.error("Payment failed:", error)
      alert("Payment failed, please try again")
    } finally {
      setLoading(false)
    }
  }

  const isCurrentPlan = currentUser?.isPremiumActive &&
    (plan.id === "PREMIUM_MONTHLY" || plan.id === "PREMIUM_YEARLY")

  const isDisabled = loading || isCurrentPlan

  return (
    <div className={cn(
      "relative flex h-full flex-col bg-white rounded-2xl shadow-sm border transition-all duration-200",
      plan.popular
        ? "border-blue-500 ring-2 ring-blue-200 z-10"
        : "border-gray-200 hover:border-gray-300 hover:shadow-md"
    )}>
      {plan.popular && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <span className="bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-medium">
            Most Popular
          </span>
        </div>
      )}

      <div className="flex flex-1 flex-col p-6">
        <div className="flex items-center mb-4">
          <div className={cn(
            "w-12 h-12 rounded-lg flex items-center justify-center me-4",
            plan.popular ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-600"
          )}>
            {plan.icon}
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-900">{plan.name}</h3>
            <p className="text-gray-600 text-sm">{plan.description}</p>
          </div>
        </div>

        <div className="mb-6">
          <div className="flex items-baseline">
            <span className="text-3xl font-bold text-gray-900">{plan.price}</span>
            <span className="text-gray-600 ms-2">/ {plan.period}</span>
          </div>
          {plan.originalPrice && (
            <div className="flex items-center mt-1">
              <span className="text-gray-500 line-through text-sm">{plan.originalPrice}</span>
              <span className="text-green-600 text-sm ms-2 font-medium">Save 17%</span>
            </div>
          )}
        </div>

        <ul className="flex flex-col gap-y-3 mb-8">
          {plan.features.map((feature, index) => (
            <li key={index} className="flex items-start">
              <Check className="w-5 h-5 text-green-500 me-3 mt-0.5 flex-shrink-0" />
              <span className="text-gray-700 text-sm">{feature}</span>
            </li>
          ))}
        </ul>

        <div className="mt-auto">
          <button
            onClick={handlePurchase}
            disabled={isDisabled}
            className={cn(
              "w-full py-3 px-4 rounded-lg font-medium transition-colors",
              plan.popular
                ? "bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-400"
                : "bg-gray-900 text-white hover:bg-gray-800 disabled:bg-gray-400",
              "disabled:cursor-not-allowed"
            )}
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <Loader2 className="w-4 h-4 animate-spin me-2" />
                Processing...
              </div>
            ) : isCurrentPlan ? (
              "Current Plan"
            ) : !currentUser ? (
              signedOutButtonText
            ) : (
              plan.buttonText
            )}
          </button>

          {creditsPack && (
            <p className="text-xs text-gray-500 text-center mt-3">
              Purchased credits do not expire. Images and generated results follow the plan&apos;s data-retention period.
            </p>
          )}

          {(plan.id === "PREMIUM_MONTHLY" || plan.id === "PREMIUM_YEARLY") && (
            <p className="text-xs text-gray-500 text-center mt-3">
              Cancel anytime, no long-term contract
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
