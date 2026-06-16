"use client"

import { useState } from "react"

export function ManageSubscriptionButton() {
  const [loading, setLoading] = useState(false)

  const handleManageSubscription = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/payment/create-portal-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          returnUrl: window.location.href,
        }),
      })

      const data = await response.json()
      if (!response.ok || !data.success || !data?.data?.url) {
        throw new Error(data.error || "Failed to open subscription portal")
      }

      window.location.href = data.data.url
    } catch (error) {
      console.error("Failed to open subscription portal:", error)
      alert("Unable to open subscription management. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleManageSubscription}
      disabled={loading}
      className="px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 disabled:opacity-60 disabled:cursor-not-allowed"
    >
      {loading ? "Opening..." : "Manage Subscription"}
    </button>
  )
}
