"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter, usePathname } from "next/navigation"
import { Check, X, Gift, Sparkles } from "lucide-react"
import { resolvePromoCode } from "@/config/pricing"

interface PromoInputProps {
  onPromoChange: (code: string | null) => void
  activeCode: string | null
}

export function PromoInput({ onPromoChange, activeCode }: PromoInputProps) {
  const [inputCode, setInputCode] = useState("")
  const [isExpanded, setIsExpanded] = useState(false)
  const [validationStatus, setValidationStatus] = useState<"idle" | "valid" | "invalid">("idle")
  
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  // Initialize from URL
  useEffect(() => {
    const codeFromUrl = searchParams.get("code")
    if (codeFromUrl) {
      setInputCode(codeFromUrl)
      handleApply(codeFromUrl)
      setIsExpanded(true)
    }
  }, [searchParams])

  const handleApply = (code: string) => {
    const trimmedCode = code.trim().toUpperCase()
    if (trimmedCode.length > 0) {
      // Validate against our PROMO_CODES
      const resolvedProduct = resolvePromoCode(trimmedCode)
      if (resolvedProduct) {
        onPromoChange(trimmedCode)
        setValidationStatus("valid")
      } else {
        setValidationStatus("invalid")
        onPromoChange(null)
      }
    } else {
      onPromoChange(null)
      setValidationStatus("idle")
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleApply(inputCode)
  }

  const clearPromo = () => {
    setInputCode("")
    onPromoChange(null)
    setValidationStatus("idle")
    
    // Clear from URL without reload
    const params = new URLSearchParams(searchParams.toString())
    params.delete("code")
    const newUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname
    router.replace(newUrl, { scroll: false })
  }

  // When promo is active and valid, show a celebration banner
  if (activeCode && validationStatus === "valid") {
    return (
      <div className="mb-8">
        <div className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 bg-emerald-100 rounded-full">
                <Sparkles className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-emerald-800">
                  Promo code {activeCode} applied!
                </p>
                <p className="text-xs text-emerald-600">
                  High demand: <strong className="text-emerald-700">Only a few 2x spots left</strong>
                </p>
              </div>
            </div>
            <button
              onClick={clearPromo}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-100 hover:bg-emerald-200 rounded-full transition-colors"
            >
              <X className="w-3 h-3" />
              Remove
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Collapsed state - just a subtle clickable prompt
  if (!isExpanded) {
    return (
      <div className="mb-8">
        <button
          onClick={() => setIsExpanded(true)}
          className="w-full p-4 bg-gray-50 hover:bg-gray-100 rounded-xl border border-dashed border-gray-300 transition-colors group"
        >
          <div className="flex items-center justify-center gap-2 text-gray-500 group-hover:text-gray-700">
            <Gift className="w-4 h-4" />
            <span className="text-sm font-medium">Have a promo code?</span>
          </div>
        </button>
      </div>
    )
  }

  // Expanded input state
  return (
    <div className="mb-8">
      <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
        <form onSubmit={handleSubmit}>
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-full flex-shrink-0">
              <Gift className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1 flex gap-2">
              <input
                type="text"
                value={inputCode}
                onChange={(e) => {
                  setInputCode(e.target.value.toUpperCase())
                  setValidationStatus("idle")
                }}
                placeholder="Enter promo code"
                autoFocus
                className={`flex-1 px-4 py-2 text-sm font-medium border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                  validationStatus === "invalid"
                    ? "border-red-300 bg-red-50 focus:ring-red-500"
                    : "border-gray-200 bg-white focus:ring-blue-500"
                }`}
              />
              <button
                type="submit"
                disabled={!inputCode}
                className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Apply
              </button>
            </div>
            <button
              type="button"
              onClick={() => {
                setIsExpanded(false)
                setInputCode("")
                setValidationStatus("idle")
              }}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          {validationStatus === "invalid" && (
            <p className="mt-2 ml-13 text-xs text-red-600 font-medium">
              Invalid code. Please check and try again.
            </p>
          )}
        </form>
      </div>
    </div>
  )
}
