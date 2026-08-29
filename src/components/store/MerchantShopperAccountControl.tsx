'use client'

import { signOut } from 'next-auth/react'
import { useOptionalSession } from '@/hooks/useOptionalSession'
import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import { CreditCard, History, LayoutDashboard, LogOut, User, X } from 'lucide-react'
import { calculateRemainingQuota } from '@/config/pricing'
import { useTestSession } from '@/hooks/useTestSession'
import { useQuota } from '@/hooks/useQuota'
import { localizedPath } from '@/lib/localized-path'
import {
  createMerchantContinuation,
  merchantPricingPath,
} from '@/lib/commerce-handoff/merchant-continuation'

type MerchantShopperAccountControlProps = {
  merchantSlug: string
  experienceType: 'STORE' | 'CAMPAIGN'
  experienceSlug?: string
  locale: string
}

export function MerchantShopperAccountControl({
  merchantSlug,
  experienceType,
  experienceSlug,
  locale,
}: MerchantShopperAccountControlProps) {
  const { data: session, status } = useOptionalSession()
  const { testSession, loading: testSessionLoading, clearTestSession } = useTestSession()
  const quota = useQuota()
  const buttonRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const [isOpen, setIsOpen] = useState(false)

  const user = session?.user || testSession?.user
  const isTestMode = !session?.user && Boolean(testSession?.user)
  const continuation = createMerchantContinuation({
    locale,
    merchantSlug,
    experienceType,
    experienceSlug,
  })
  const shopperReturnPath = continuation?.canonicalReturnPath || localizedPath(locale, '/')
  const pricingHref = continuation ? merchantPricingPath(continuation) : localizedPath(locale, '/pricing')

  const testQuota = useMemo(() => {
    if (!testSession?.user) return null
    return calculateRemainingQuota(
      testSession.user.isPremium,
      testSession.user.currentSubscriptionType || null,
      testSession.user.freeTrialsUsed,
      testSession.user.premiumUsageCount,
      testSession.user.creditsPurchased,
      testSession.user.creditsUsed,
    )
  }, [testSession])

  useEffect(() => {
    if (!isOpen) return

    const handlePointerDown = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setIsOpen(false)
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false)
        buttonRef.current?.focus()
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  if (status === 'loading' || testSessionLoading || !user) return null

  const remainingCredits = isTestMode
    ? testQuota?.totalRemaining ?? 0
    : quota.loading
      ? null
      : quota.totalRemaining
  const displayName = user.name || user.email || 'Account'

  const handleSignOut = () => {
    setIsOpen(false)
    if (isTestMode) {
      clearTestSession()
      window.location.assign(shopperReturnPath)
      return
    }
    void signOut({ callbackUrl: shopperReturnPath })
  }

  return (
    <div ref={menuRef} className="relative shrink-0">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="inline-flex min-h-11 items-center gap-2 rounded-2xl border border-slate-200 bg-white/90 px-2.5 py-2 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-slate-300 hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 sm:px-3"
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-label={`${displayName} shopper account`}
      >
        {user.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={user.image} alt="" className="h-7 w-7 rounded-full object-cover" />
        ) : (
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100">
            <User className="h-4 w-4 text-slate-500" aria-hidden="true" />
          </span>
        )}
        <span className="hidden max-w-28 truncate sm:inline">{displayName}</span>
        <span className="hidden rounded-full bg-blue-50 px-2 py-1 text-xs font-bold text-blue-700 sm:inline">
          {remainingCredits === null ? '…' : `${remainingCredits} credits`}
        </span>
        <span className="sr-only">Open account menu</span>
      </button>

      {isOpen ? (
        <div
          className="absolute end-0 top-full z-30 mt-2 w-[min(18rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-slate-200 bg-white py-1 shadow-xl"
          role="menu"
          aria-label="Shopper account"
        >
          <div className="flex items-start gap-3 border-b border-slate-100 px-4 py-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-950">{displayName}</p>
              {user.email ? <p className="truncate text-xs text-slate-500">{user.email}</p> : null}
              <p className="mt-2 text-xs font-medium text-blue-700">
                {remainingCredits === null ? 'Checking Consumer credits…' : `${remainingCredits} Consumer credits remaining`}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setIsOpen(false)
                buttonRef.current?.focus()
              }}
              className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              aria-label="Close account menu"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          <Link
            href={localizedPath(locale, '/dashboard/history')}
            onClick={() => setIsOpen(false)}
            className="flex min-h-11 items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            role="menuitem"
          >
            <History className="h-4 w-4 text-slate-400" aria-hidden="true" />
            My Try-Ons / History
          </Link>
          <Link
            href={localizedPath(locale, '/dashboard')}
            onClick={() => setIsOpen(false)}
            className="flex min-h-11 items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            role="menuitem"
          >
            <LayoutDashboard className="h-4 w-4 text-slate-400" aria-hidden="true" />
            Dashboard
          </Link>
          <Link
            href={pricingHref}
            onClick={() => setIsOpen(false)}
            className="flex min-h-11 items-center gap-3 px-4 py-2.5 text-sm font-semibold text-blue-700 transition hover:bg-blue-50"
            role="menuitem"
          >
            <CreditCard className="h-4 w-4" aria-hidden="true" />
            Buy more Consumer credits
          </Link>

          <div className="my-1 border-t border-slate-100" />
          <button
            type="button"
            onClick={handleSignOut}
            className="flex min-h-11 w-full items-center gap-3 px-4 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50"
            role="menuitem"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            Sign out
          </button>
        </div>
      ) : null}
    </div>
  )
}
