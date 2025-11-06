"use client"

import { useState } from "react"
import { Check, Loader2 } from "lucide-react"
import { cn } from "@/utils/cn"
import { analytics, getUserType, type ProductType } from "@/lib/analytics"

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

export function PricingCard({ plan, currentUser }: PricingCardProps) {
  const [loading, setLoading] = useState(false)

  const handleSubscribe = async () => {
    // 如果用户未登录，重定向到登录页并设置回调URL
    if (!currentUser) {
      window.location.href = `/auth/signin?callbackUrl=${encodeURIComponent('/pricing')}`
      return
    }

    setLoading(true)

    try {
      // 追踪点击购买按钮
      const userType = getUserType(
        currentUser.isPremiumActive,
        0, // creditsBalance 不在 currentUser 中，使用 0
        true // 已认证
      )
      const planPrice = parseFloat(plan.price.replace('$', '').replace('/month', '').replace('/year', ''))
      analytics.trackClickPurchase(
        plan.id as ProductType,
        planPrice,
        userType,
        'pricing'
      )

      const response = await fetch("/api/payment/create-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productType: plan.id,
          successUrl: `${window.location.origin}/dashboard?payment=success`,
          cancelUrl: `${window.location.origin}/pricing?payment=cancelled`,
        }),
      })

      const data = await response.json()

      if (data.success && data.data.url) {
        // 追踪开始结账
        analytics.trackBeginCheckout(plan.id as ProductType, planPrice)

        // Redirect to Stripe Checkout
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
      "relative bg-white rounded-2xl shadow-sm border transition-all duration-200",
      plan.popular 
        ? "border-blue-500 ring-2 ring-blue-200 scale-105" 
        : "border-gray-200 hover:border-gray-300 hover:shadow-md"
    )}>
      {/* Popular Badge */}
      {plan.popular && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <span className="bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-medium">
            Most Popular
          </span>
        </div>
      )}

      <div className="p-6">
        {/* Icon and Title */}
        <div className="flex items-center mb-4">
          <div className={cn(
            "w-12 h-12 rounded-lg flex items-center justify-center mr-4",
            plan.popular ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-600"
          )}>
            {plan.icon}
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-900">{plan.name}</h3>
            <p className="text-gray-600 text-sm">{plan.description}</p>
          </div>
        </div>

        {/* Price */}
        <div className="mb-6">
          <div className="flex items-baseline">
            <span className="text-3xl font-bold text-gray-900">{plan.price}</span>
            <span className="text-gray-600 ml-2">/ {plan.period}</span>
          </div>
          {plan.originalPrice && (
            <div className="flex items-center mt-1">
              <span className="text-gray-500 line-through text-sm">{plan.originalPrice}</span>
              <span className="text-green-600 text-sm ml-2 font-medium">Save 17%</span>
            </div>
          )}
        </div>

        {/* Features List */}
        <ul className="space-y-3 mb-8">
          {plan.features.map((feature, index) => (
            <li key={index} className="flex items-start">
              <Check className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
              <span className="text-gray-700 text-sm">{feature}</span>
            </li>
          ))}
        </ul>

        {/* Button */}
        <button
          onClick={handleSubscribe}
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
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Processing...
            </div>
          ) : isCurrentPlan ? (
            "Current Plan"
          ) : !currentUser ? (
            "Sign In to Subscribe"
          ) : (
            plan.buttonText
          )}
        </button>

        {/* Additional Info */}
        {plan.id === "CREDITS_PACK" && (
          <p className="text-xs text-gray-500 text-center mt-3">
            Credits never expire, use anytime
          </p>
        )}

        {(plan.id === "PREMIUM_MONTHLY" || plan.id === "PREMIUM_YEARLY") && (
          <p className="text-xs text-gray-500 text-center mt-3">
            Cancel anytime, no long-term contract
          </p>
        )}
      </div>
    </div>
  )
}
