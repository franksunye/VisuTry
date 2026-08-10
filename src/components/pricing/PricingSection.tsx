"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { ChevronDown, Glasses, Star, Zap } from "lucide-react"
import { useTranslations } from 'next-intl'
import { PricingCard } from "@/components/pricing/PricingCard"
import { PromoInput } from "@/components/pricing/PromoInput"
import { analytics } from "@/lib/analytics"
import { useQuota } from '@/hooks/useQuota'
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

type ComparisonRow = {
  feature: string
  free: React.ReactNode
  credits: React.ReactNode
  standard: React.ReactNode
}

export function PricingSection({ user: serverUser, quotas }: PricingSectionProps) {
  const { data: session } = useSession()
  const quota = useQuota()
  const [activeCode, setActiveCode] = useState<string | null>(null)

  // Prefer client-side session; fall back to server-provided user (null for
  // static rendering) so the page can be fully static-rendered.
  const user = session?.user ?? serverUser
  const tPricing = useTranslations('pricing')

  useEffect(() => {
    analytics.trackViewPricing('pricing', quota.userType, user?.remainingTrials || 0)
  }, [quota.userType, user])

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
      buttonText: "Buy Credits Pack",
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
      buttonText: "Start Monthly Subscription",
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
      buttonText: "Start Annual Subscription",
      popular: yearlyData.popular,
      icon: <Star className="w-6 h-6" />
    }
  ]

  const comparisonRows: ComparisonRow[] = [
    {
      feature: 'AI Try-ons',
      free: `${quotas.freeTrial} times`,
      credits: <span className="font-bold text-blue-600">+{getPlanQuota(creditPackId, quotas)} times</span>,
      standard: <span className="text-green-600">{quotas.monthly}/month or {quotas.yearly}/year</span>,
    },
    {
      feature: 'AI Face Analysis',
      free: 'Included with credit',
      credits: 'Included',
      standard: <span className="text-green-600">Included</span>,
    },
    {
      feature: 'Frame Compare',
      free: '1 frame trial',
      credits: '1 credit per frame',
      standard: <span className="text-green-600">1 credit per frame</span>,
    },
    {
      feature: 'Image Quality',
      free: <><div>Standard</div><div className="text-xs text-gray-500">(800×800)</div></>,
      credits: <><div>High Quality</div><div className="text-xs text-gray-500">(1200×1200)</div></>,
      standard: <><div className="text-green-600">High Quality</div><div className="text-xs text-green-500">(1200×1200)</div></>,
    },
    {
      feature: 'Watermark',
      free: 'Yes',
      credits: 'No',
      standard: <span className="text-green-600">No</span>,
    },
    {
      feature: 'Generation Speed',
      free: <><div>Standard</div><div className="text-xs text-gray-500">(Queue-based)</div></>,
      credits: <><div>Standard</div><div className="text-xs text-gray-500">(Queue-based)</div></>,
      standard: <><div className="text-green-600">Fast</div><div className="text-xs text-green-500">(Real-time)</div></>,
    },
    {
      feature: 'Processing Priority',
      free: 'Normal',
      credits: 'Normal',
      standard: <span className="text-green-600">Priority</span>,
    },
    {
      feature: 'Data Retention',
      free: <><div>7 days</div><div className="text-xs text-gray-500">Auto-delete after expiry</div></>,
      credits: <><div>90 days</div><div className="text-xs text-gray-500">Extended storage</div></>,
      standard: <><div className="text-green-600">1 year</div><div className="text-xs text-green-500">Long-term storage</div></>,
    },
    {
      feature: 'Customer Support',
      free: 'Email',
      credits: 'Priority Email',
      standard: <span className="text-green-600">Priority Support</span>,
    },
  ]

  return (
    <div>
      <PromoInput onPromoChange={setActiveCode} activeCode={activeCode} />

      <div className="grid gap-5 mb-8 md:grid-cols-3 md:gap-8 md:mb-12 items-stretch">
        {pricingPlans.map((plan) => (
          <PricingCard
            key={plan.id}
            plan={plan}
            currentUser={user}
          />
        ))}
      </div>

      <section className="overflow-hidden bg-white rounded-xl border shadow-sm">
        <div className="p-5 border-b border-gray-200 md:p-6">
          <h2 className="text-lg font-semibold text-gray-900 md:text-xl">{tPricing('comparison.title')}</h2>
          <p className="mt-1 text-sm text-gray-500 md:hidden">
            Tap a feature to compare Free, Credits Pack, and Standard.
          </p>
        </div>

        {/* Mobile: vertical disclosure list avoids squeezing a four-column table
            into a narrow viewport and keeps each decision understandable. */}
        <div className="divide-y divide-gray-200 md:hidden">
          {comparisonRows.map((row) => (
            <details key={row.feature} className="group">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-sm font-semibold text-gray-900 marker:content-none [&::-webkit-details-marker]:hidden">
                <span>{row.feature}</span>
                <ChevronDown className="h-4 w-4 flex-shrink-0 text-gray-400 transition-transform group-open:rotate-180" />
              </summary>
              <div className="grid gap-3 bg-gray-50 px-5 pb-4 pt-1 text-sm">
                <ComparisonValue label="Free">{row.free}</ComparisonValue>
                <ComparisonValue label="Credits Pack">{row.credits}</ComparisonValue>
                <ComparisonValue label="Standard">{row.standard}</ComparisonValue>
              </div>
            </details>
          ))}
        </div>

        {/* Desktop: retain the familiar compact comparison table. */}
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-sm font-medium text-start text-gray-900">Feature</th>
                <th className="px-6 py-3 text-sm font-medium text-center text-gray-900">Free</th>
                <th className="px-6 py-3 text-sm font-medium text-center text-gray-900">Credits Pack</th>
                <th className="px-6 py-3 text-sm font-medium text-center text-gray-900">Standard</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {comparisonRows.map((row) => (
                <tr key={row.feature}>
                  <td className="px-6 py-4 text-sm text-gray-900">{row.feature}</td>
                  <td className="px-6 py-4 text-sm text-center text-gray-600">{row.free}</td>
                  <td className="px-6 py-4 text-sm text-center text-gray-600">{row.credits}</td>
                  <td className="px-6 py-4 text-sm text-center text-gray-600">{row.standard}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

function ComparisonValue({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-lg border border-gray-200 bg-white px-3 py-2.5">
      <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</span>
      <div className="text-right text-sm text-gray-700">{children}</div>
    </div>
  )
}
