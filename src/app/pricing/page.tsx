import { redirect } from "next/navigation"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { PricingCard } from "@/components/pricing/PricingCard"
import { Glasses, ArrowLeft, Check, Star, Zap } from "lucide-react"
import Link from "next/link"

export default async function PricingPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/auth/signin")
  }

  const pricingPlans = [
    {
      id: "CREDITS_PACK",
      name: "Credits Pack",
      description: "Perfect for occasional users",
      price: "$2.99",
      period: "One-time",
      features: [
        "20 additional AI try-ons",
        "High-quality image processing",
        "Unlimited downloads and sharing",
        "Priority customer support"
      ],
      buttonText: "Buy Credits Pack",
      popular: false,
      icon: <Zap className="w-6 h-6" />
    },
    {
      id: "PREMIUM_MONTHLY",
      name: "Premium",
      description: "Most popular choice",
      price: "$9.99",
      period: "per month",
      features: [
        "Unlimited AI try-ons",
        "High-quality image processing",
        "Priority processing queue",
        "Unlimited downloads and sharing",
        "Premium glasses frame library",
        "Priority customer support",
        "Ad-free experience"
      ],
      buttonText: "Start Monthly Subscription",
      popular: true,
      icon: <Star className="w-6 h-6" />
    },
    {
      id: "PREMIUM_YEARLY",
      name: "Premium Annual",
      description: "Best value",
      price: "$99.99",
      period: "per year",
      originalPrice: "$119.88",
      features: [
        "Unlimited AI try-ons",
        "High-quality image processing",
        "Priority processing queue",
        "Unlimited downloads and sharing",
        "Premium glasses frame library",
        "Priority customer support",
        "Ad-free experience",
        "Save 2 months"
      ],
      buttonText: "Start Annual Subscription",
      popular: false,
      icon: <Star className="w-6 h-6" />
    }
  ]

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Choose Your Plan</h1>
          <p className="text-gray-600 mt-1">Upgrade to premium for unlimited AI try-on experience</p>
        </div>
        <Link
          href="/dashboard"
          className="flex items-center text-blue-600 hover:text-blue-700"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Dashboard
        </Link>
      </div>

      {/* Current Status */}
      <div className="mb-8">
        {session.user.isPremiumActive ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center">
              <Star className="w-5 h-5 text-yellow-600 mr-2" />
              <div>
                <strong className="text-yellow-800">You are a Premium Member</strong>
                {session.user.premiumExpiresAt && (
                  <span className="text-yellow-700 ml-2">
                    Expires: {new Date(session.user.premiumExpiresAt).toLocaleDateString("en-US")}
                  </span>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Glasses className="w-5 h-5 text-blue-600 mr-2" />
                <div>
                  <strong className="text-blue-800">Free User</strong>
                  <span className="text-blue-700 ml-2">
                    Remaining try-ons: {session.user.remainingTrials}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Pricing Cards */}
      <div className="grid md:grid-cols-3 gap-8 mb-12">
        {pricingPlans.map((plan) => (
          <PricingCard
            key={plan.id}
            plan={plan}
            currentUser={session.user}
          />
        ))}
      </div>

      {/* Feature Comparison */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Feature Comparison</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">Feature</th>
                <th className="px-6 py-3 text-center text-sm font-medium text-gray-900">Free</th>
                <th className="px-6 py-3 text-center text-sm font-medium text-gray-900">Credits Pack</th>
                <th className="px-6 py-3 text-center text-sm font-medium text-gray-900">Premium</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              <tr>
                <td className="px-6 py-4 text-sm text-gray-900">AI Try-ons</td>
                <td className="px-6 py-4 text-center text-sm text-gray-600">3 times</td>
                <td className="px-6 py-4 text-center text-sm text-gray-600">+20 times</td>
                <td className="px-6 py-4 text-center text-sm text-green-600">Unlimited</td>
              </tr>
              <tr>
                <td className="px-6 py-4 text-sm text-gray-900">Image Quality</td>
                <td className="px-6 py-4 text-center text-sm text-gray-600">Standard</td>
                <td className="px-6 py-4 text-center text-sm text-gray-600">High Quality</td>
                <td className="px-6 py-4 text-center text-sm text-green-600">High Quality</td>
              </tr>
              <tr>
                <td className="px-6 py-4 text-sm text-gray-900">Processing Priority</td>
                <td className="px-6 py-4 text-center text-sm text-gray-600">Normal</td>
                <td className="px-6 py-4 text-center text-sm text-gray-600">Normal</td>
                <td className="px-6 py-4 text-center text-sm text-green-600">Priority</td>
              </tr>
              <tr>
                <td className="px-6 py-4 text-sm text-gray-900">Glasses Frame Library</td>
                <td className="px-6 py-4 text-center text-sm text-gray-600">Basic</td>
                <td className="px-6 py-4 text-center text-sm text-gray-600">Basic</td>
                <td className="px-6 py-4 text-center text-sm text-green-600">Premium</td>
              </tr>
              <tr>
                <td className="px-6 py-4 text-sm text-gray-900">Customer Support</td>
                <td className="px-6 py-4 text-center text-sm text-gray-600">Email</td>
                <td className="px-6 py-4 text-center text-sm text-gray-600">Priority Email</td>
                <td className="px-6 py-4 text-center text-sm text-green-600">Priority Support</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* FAQ */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Frequently Asked Questions</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="font-semibold text-gray-900 mb-2">Can I cancel my subscription anytime?</h3>
            <p className="text-gray-600 text-sm">
              Yes, you can cancel your subscription at any time. After cancellation, you can still use premium features until the end of the current billing period.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="font-semibold text-gray-900 mb-2">What payment methods are supported?</h3>
            <p className="text-gray-600 text-sm">
              We support all major credit and debit cards, including Visa, Mastercard, American Express, and more.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="font-semibold text-gray-900 mb-2">Do credits expire?</h3>
            <p className="text-gray-600 text-sm">
              Credits never expire after purchase. You can use them anytime at your convenience.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="font-semibold text-gray-900 mb-2">How do I contact support?</h3>
            <p className="text-gray-600 text-sm">
              You can contact us via email at support@visutry.com. Premium members enjoy priority support.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
