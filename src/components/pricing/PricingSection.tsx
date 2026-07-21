"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { Glasses, Star, Zap } from "lucide-react"
import { useTranslations } from 'next-intl'
import { PricingCard } from "@/components/pricing/PricingCard"
import { PromoInput } from "@/components/pricing/PromoInput"
import { analytics, getUserType } from "@/lib/analytics"
import {
  PRODUCT_METADATA,
  PricingQuotas,
  buildPlanFeatures,
  formatPrice,
  getPlanQuota,
  resolveDisplayProductId,
  resolvePromoCode,
} from '@/config/pricing'

interface PricingSectionProps {
  user: any // Typed as any for simplicity, effectively UserForDisplay
  quotas: PricingQuotas
}

export function PricingSection({ user: serverUser, quotas }: PricingSectionProps) {
  const { data: session } = useSession()
  const [activeCode, setActiveCode] = useState<string | null>(null)

  // Prefer client-side session; fall back to server-provided user (null for
  // static rendering) so the page can be fully static-rendered.
  const user = session?.user ?? serverUser
  const tPricing = useTranslations('pricing')

  useEffect(() => {
    const creditsPurchased = user?.creditsPurchased || 0
    const creditsUsed = user?.creditsUsed || 0
    const creditsRemaining = creditsPurchased - creditsUsed
    const userType = getUserType(
      user?.isPremiumActive || false,
      creditsRemaining,
      Boolean(user)
    )

    analytics.trackViewPricing('pricing', userType, user?.remainingTrials || 0)
  }, [user])

  // Determine if any promo code is valid
  const promoProductType = activeCode ? resolvePromoCode(activeCode) : null
  const isPromoActive = !!promoProductType

  const creditPackId = resolveDisplayProductId('CREDITS_PACK', isPromoActive)
  const monthlyId = resolveDisplayProductId('PREMIUM_MONTHLY', isPromoActive)
  const yearlyId = resolveDisplayProductId('PREMIUM_YEARLY', isPromoActive)

  const creditPackData = PRODUCT_METADATA[creditPackId]
  const monthlyData = PRODUCT_METADATA[monthlyId]
  const yearlyData = PRODUCT_METADATA[yearlyId]

  const pricingPlans = [
    {
      id: creditPackData.id,
      name: creditPackData.shortName,
      description: creditPackData.description,
      price: formatPrice(creditPackData.price),
      period: tPricing('plans.creditsPack.period'),
      features: buildPlanFeatures(creditPackId, quotas),
      buttonText: creditPackData.id.includes("PROMO") ? "Buy Credits Pack" : "Buy Credits Pack",
      popular: creditPackData.popular,
      icon: <Zap className="w-6 h-6" />
    },
    {
      id: monthlyData.id,
      name: monthlyData.shortName,
      description: monthlyData.description,
      price: formatPrice(monthlyData.price),
      period: tPricing('plans.monthly.period'),
      features: buildPlanFeatures(monthlyId, quotas),
      buttonText: monthlyData.id.includes("PROMO") ? "Start Monthly Subscription" : "Start Monthly Subscription",
      popular: monthlyData.popular,
      icon: <Star className="w-6 h-6" />
    },
    {
      id: yearlyData.id,
      name: yearlyData.shortName,
      description: yearlyData.description,
      price: formatPrice(yearlyData.price),
      period: tPricing('plans.yearly.period'),
      originalPrice: "$107.88",
      features: buildPlanFeatures(yearlyId, quotas),
      buttonText: yearlyData.id.includes("PROMO") ? "Start Annual Subscription" : "Start Annual Subscription",
      popular: yearlyData.popular,
      icon: <Star className="w-6 h-6" />
    }
  ]

  return (
    <div>
      <PromoInput onPromoChange={setActiveCode} activeCode={activeCode} />
      
      <div className="grid gap-8 mb-12 md:grid-cols-3 items-stretch">
        {pricingPlans.map((plan) => (
          <PricingCard
            key={plan.id}
            plan={plan}
            currentUser={user}
          />
        ))}
      </div>

      {/* Comparison Table can optionally be updated here too if needed, doing static for now */}
      <div className="overflow-hidden bg-white rounded-xl border shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">{tPricing('comparison.title')}</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-sm font-medium text-left text-gray-900">Feature</th>
                <th className="px-6 py-3 text-sm font-medium text-center text-gray-900">Free</th>
                <th className="px-6 py-3 text-sm font-medium text-center text-gray-900">
                  Credits Pack
                </th>
                <th className="px-6 py-3 text-sm font-medium text-center text-gray-900">Standard</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              <tr>
                <td className="px-6 py-4 text-sm text-gray-900">AI Try-ons</td>
                <td className="px-6 py-4 text-sm text-center text-gray-600">{quotas.freeTrial} times</td>
                <td className="px-6 py-4 text-sm font-bold text-center text-blue-600">
                  +{getPlanQuota(creditPackId, quotas)} times
                </td>
                <td className="px-6 py-4 text-sm text-center text-green-600">
                  {quotas.monthly}/month or {quotas.yearly}/year
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 text-sm text-gray-900">AI Face Analysis</td>
                <td className="px-6 py-4 text-sm text-center text-gray-600">Included with credit</td>
                <td className="px-6 py-4 text-sm text-center text-gray-600">Included</td>
                <td className="px-6 py-4 text-sm text-center text-green-600">Included</td>
              </tr>
              <tr>
                <td className="px-6 py-4 text-sm text-gray-900">Frame Compare</td>
                <td className="px-6 py-4 text-sm text-center text-gray-600">1 frame trial</td>
                <td className="px-6 py-4 text-sm text-center text-gray-600">1 credit per frame</td>
                <td className="px-6 py-4 text-sm text-center text-green-600">1 credit per frame</td>
              </tr>
              {/* Other rows remain static as they don't change with quota */}
               <tr>
                <td className="px-6 py-4 text-sm text-gray-900">Image Quality</td>
                <td className="px-6 py-4 text-sm text-center text-gray-600">
                  <div>Standard</div>
                  <div className="text-xs text-gray-500">(800×800)</div>
                </td>
                <td className="px-6 py-4 text-sm text-center text-gray-600">
                  <div>High Quality</div>
                  <div className="text-xs text-gray-500">(1200×1200)</div>
                </td>
                <td className="px-6 py-4 text-sm text-center text-green-600">
                  <div>High Quality</div>
                  <div className="text-xs text-green-500">(1200×1200)</div>
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 text-sm text-gray-900">Watermark</td>
                <td className="px-6 py-4 text-sm text-center text-gray-600">Yes</td>
                <td className="px-6 py-4 text-sm text-center text-gray-600">No</td>
                <td className="px-6 py-4 text-sm text-center text-green-600">No</td>
              </tr>
              <tr>
                <td className="px-6 py-4 text-sm text-gray-900">Generation Speed</td>
                <td className="px-6 py-4 text-sm text-center text-gray-600">
                  <div>Standard</div>
                  <div className="text-xs text-gray-500">(Queue-based)</div>
                </td>
                <td className="px-6 py-4 text-sm text-center text-gray-600">
                  <div>Standard</div>
                  <div className="text-xs text-gray-500">(Queue-based)</div>
                </td>
                <td className="px-6 py-4 text-sm text-center text-green-600">
                  <div>Fast</div>
                  <div className="text-xs text-green-500">(Real-time)</div>
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 text-sm text-gray-900">Processing Priority</td>
                <td className="px-6 py-4 text-sm text-center text-gray-600">Normal</td>
                <td className="px-6 py-4 text-sm text-center text-gray-600">Normal</td>
                <td className="px-6 py-4 text-sm text-center text-green-600">Priority</td>
              </tr>
              <tr>
                <td className="px-6 py-4 text-sm text-gray-900">Data Retention</td>
                <td className="px-6 py-4 text-sm text-center text-gray-600">
                  <div>7 days</div>
                  <div className="text-xs text-gray-500">Auto-delete after expiry</div>
                </td>
                <td className="px-6 py-4 text-sm text-center text-gray-600">
                  <div>90 days</div>
                  <div className="text-xs text-gray-500">Extended storage</div>
                </td>
                <td className="px-6 py-4 text-sm text-center text-green-600">
                  <div>1 year</div>
                  <div className="text-xs text-green-500">Long-term storage</div>
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 text-sm text-gray-900">Customer Support</td>
                <td className="px-6 py-4 text-sm text-center text-gray-600">Email</td>
                <td className="px-6 py-4 text-sm text-center text-gray-600">Priority Email</td>
                <td className="px-6 py-4 text-sm text-center text-green-600">Priority Support</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
