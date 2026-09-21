"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronDown, Sparkles } from 'lucide-react'
import { useEffect, type ReactNode } from 'react'
import { analytics } from '@/lib/analytics'
import { AnalyticsEvent } from '@/lib/analytics-events'
import { getMerchantActivationContext, recordMerchantActivationClientEvent } from '@/lib/merchant-activation-client'
import { merchantWorkspaceHref, type MerchantWorkspaceSection } from '@/modules/merchant/application/merchant-workspace-routes'

type Merchant = { id: string; slug: string; name: string; role: string }

const primary: Array<{ section: MerchantWorkspaceSection; label: string }> = [
  { section: 'home', label: 'Home' },
  { section: 'catalog', label: 'Catalog' },
  { section: 'store', label: 'Store' },
  { section: 'campaigns', label: 'Campaigns' },
  { section: 'analytics', label: 'Analytics' },
]

const utility: Array<{ section: MerchantWorkspaceSection; label: string }> = [
  { section: 'integrations', label: 'Integrations' },
  { section: 'plan', label: 'Plan & Usage' },
  { section: 'settings', label: 'Settings' },
]

const allNavigation = [...primary, ...utility]

function activePath(pathname: string, section: MerchantWorkspaceSection) {
  if (section === 'home') return pathname.endsWith('/merchant')
  return pathname.includes(`/merchant/${section}`)
}

export function MerchantWorkspaceShell({
  locale,
  merchants,
  selectedMerchantId,
  children,
}: {
  locale: string
  merchants: Merchant[]
  selectedMerchantId: string
  children: ReactNode
}) {
  const pathname = usePathname()
  const selected = merchants.find((merchant) => merchant.id === selectedMerchantId)

  useEffect(() => {
    const entryKey = `visutry_merchant_workspace_entered:${selectedMerchantId}`
    try {
      if (window.sessionStorage.getItem(entryKey) === '1') return
      window.sessionStorage.setItem(entryKey, '1')
    } catch {
      // If session storage is unavailable, the durable activation endpoint
      // still applies its own dedupe boundary.
    }
    const { signupCorrelationId } = getMerchantActivationContext()
    analytics.trackCustomEvent(AnalyticsEvent.MerchantWorkspaceEntered, {
      merchant_id: selectedMerchantId,
      entry_point: 'b2b',
      actor_type: 'merchant_prospect',
      journey_type: 'visutry_b2b_acquisition',
      source_journey: 'business_merchant_entry',
      landing_surface: pathname,
      signup_correlation_id: signupCorrelationId,
    })
    void recordMerchantActivationClientEvent({
      merchantId: selectedMerchantId,
      eventType: 'merchant_workspace_entered',
    }).catch(() => {})
  }, [pathname, selectedMerchantId])

  const href = (section: MerchantWorkspaceSection) => merchantWorkspaceHref({ locale, section, merchantId: selectedMerchantId })
  const switchMerchant = (merchantId: string) => {
    const section = allNavigation.find(({ section: candidate }) => activePath(pathname, candidate))?.section ?? 'home'
    window.location.assign(merchantWorkspaceHref({ locale, section, merchantId }))
  }

  const navLink = (section: MerchantWorkspaceSection, label: string) => (
    <Link
      key={section}
      href={href(section)}
      aria-current={activePath(pathname, section) ? 'page' : undefined}
      className={`rounded-lg px-2.5 py-2 text-sm font-semibold transition ${activePath(pathname, section) ? 'bg-slate-100 text-slate-950' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950'}`}
    >
      {label}
    </Link>
  )

  return (
    <main className="min-h-screen bg-[#f7f8fb] text-slate-950">
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8">
          <div className="flex min-h-14 items-center gap-3 sm:min-h-16 sm:justify-between sm:gap-4">
            <Link href={href('home')} className="flex min-w-0 items-center gap-2 sm:gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-950 text-white sm:h-10 sm:w-10 sm:rounded-2xl">
                <Sparkles className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold tracking-tight">VisuTry Merchant</span>
                <span className="hidden text-[11px] font-medium uppercase tracking-[0.16em] text-slate-400 sm:block">Your workspace</span>
              </span>
            </Link>
            <label className="relative min-w-0 shrink-0">
              <span className="sr-only">Active merchant</span>
              <select
                aria-label="Active merchant"
                value={selectedMerchantId}
                onChange={(event) => switchMerchant(event.target.value)}
                className="w-[min(42vw,13rem)] appearance-none rounded-lg border border-slate-200 bg-white py-2 pl-2.5 pr-7 text-xs font-semibold text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 sm:w-56 sm:rounded-xl sm:py-2.5 sm:pl-3.5 sm:pr-9 sm:text-sm"
              >
                <option value={selectedMerchantId}>{selected?.name ?? 'Merchant workspace'}</option>
                {merchants.filter((merchant) => merchant.id !== selectedMerchantId).map((merchant) => <option key={merchant.id} value={merchant.id}>{merchant.name}</option>)}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-2.5 h-3.5 w-3.5 text-slate-400 sm:right-3 sm:top-3.5 sm:h-4 sm:w-4" aria-hidden="true" />
            </label>
          </div>
          <nav className="-mx-1 flex min-w-0 gap-0.5 pb-1.5 sm:mx-0 sm:gap-1 sm:pb-2" aria-label="Merchant workspace">
            <div className="flex min-w-0 flex-1 gap-0.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:gap-1">
              {primary.map(({ section, label }) => navLink(section, label))}
            </div>
            <details className="relative ml-auto shrink-0 sm:ml-2">
              <summary className="flex cursor-pointer list-none items-center gap-1 rounded-lg px-2.5 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 [&::-webkit-details-marker]:hidden">
                More <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
              </summary>
              <div className="absolute right-0 top-10 z-50 min-w-44 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl">
                {utility.map(({ section, label }) => navLink(section, label))}
              </div>
            </details>
          </nav>
        </div>
      </header>
      <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-8 lg:px-8">{children}</div>
    </main>
  )
}
