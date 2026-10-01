"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  BarChart3,
  Boxes,
  ChevronDown,
  CreditCard,
  Home,
  Menu,
  Megaphone,
  Plug,
  Settings2,
  Sparkles,
  Store,
  type LucideIcon,
} from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { analytics } from '@/lib/analytics'
import { AnalyticsEvent } from '@/lib/analytics-events'
import { getMerchantActivationContext, recordMerchantActivationClientEvent } from '@/lib/merchant-activation-client'
import { merchantWorkspaceHref, type MerchantWorkspaceSection } from '@/modules/merchant/application/merchant-workspace-routes'

type Merchant = { id: string; slug: string; name: string; role: string; referenceData?: boolean }
type NavigationItem = { section: MerchantWorkspaceSection; label: string; icon: LucideIcon }

const primary: NavigationItem[] = [
  { section: 'home', label: 'Home', icon: Home },
  { section: 'catalog', label: 'Catalog', icon: Boxes },
  { section: 'store', label: 'Store', icon: Store },
  { section: 'campaigns', label: 'Campaigns', icon: Megaphone },
  { section: 'analytics', label: 'Analytics', icon: BarChart3 },
]

const utility: NavigationItem[] = [
  { section: 'integrations', label: 'Integrations', icon: Plug },
  { section: 'plan', label: 'Plan & Usage', icon: CreditCard },
  { section: 'settings', label: 'Settings', icon: Settings2 },
]

const allNavigation = [...primary, ...utility]

function activePath(pathname: string, section: MerchantWorkspaceSection) {
  if (section === 'home') return pathname.endsWith('/merchant')
  return pathname.includes(`/merchant/${section}`)
}

function EnvironmentLabel({ referenceData }: { referenceData?: boolean }) {
  return referenceData ? (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-900">
      <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-amber-600" />
      Reference data
    </span>
  ) : null
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
  const [mobileNavigationOpen, setMobileNavigationOpen] = useState(false)
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

  useEffect(() => {
    setMobileNavigationOpen(false)
  }, [pathname])

  const href = (section: MerchantWorkspaceSection) => merchantWorkspaceHref({ locale, section, merchantId: selectedMerchantId })
  const switchMerchant = (merchantId: string) => {
    const section = allNavigation.find(({ section: candidate }) => activePath(pathname, candidate))?.section ?? 'home'
    window.location.assign(merchantWorkspaceHref({ locale, section, merchantId }))
  }

  const navLink = ({ section, label, icon: Icon }: NavigationItem, onNavigate?: () => void) => {
    const active = activePath(pathname, section)
    return (
      <Link
        key={section}
        href={href(section)}
        aria-current={active ? 'page' : undefined}
        onClick={onNavigate}
        className={`group flex min-h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 ${active ? 'bg-slate-100 text-slate-950' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-950'}`}
      >
        <Icon aria-hidden="true" className={`h-[18px] w-[18px] shrink-0 ${active ? 'text-blue-700' : 'text-slate-400 group-hover:text-slate-600'}`} strokeWidth={1.8} />
        <span>{label}</span>
        {active ? <span aria-hidden="true" className="ml-auto h-1.5 w-1.5 rounded-full bg-blue-700" /> : null}
      </Link>
    )
  }

  const merchantPicker = (className: string) => (
    <label className={`relative block ${className}`}>
      <span className="sr-only">Active merchant</span>
      <select
        aria-label="Active merchant"
        value={selectedMerchantId}
        onChange={(event) => switchMerchant(event.target.value)}
        className="min-h-10 w-full appearance-none rounded-lg border border-slate-200 bg-white py-2 pl-3 pr-9 text-sm font-medium text-slate-800 outline-none transition hover:border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
      >
        <option value={selectedMerchantId}>{selected?.name ?? 'Merchant workspace'}</option>
        {merchants.filter((merchant) => merchant.id !== selectedMerchantId).map((merchant) => <option key={merchant.id} value={merchant.id}>{merchant.name}</option>)}
      </select>
      <ChevronDown aria-hidden="true" className="pointer-events-none absolute right-3 top-3 h-4 w-4 text-slate-400" />
    </label>
  )

  return (
    <Dialog open={mobileNavigationOpen} onOpenChange={setMobileNavigationOpen}>
    <main className="min-h-screen bg-[#f5f7fa] text-slate-950 lg:pl-[248px]">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[248px] flex-col border-r border-slate-200 bg-white px-4 py-5 lg:flex">
        <Link href={href('home')} className="flex items-center gap-3 rounded-lg px-2 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-950 text-white">
            <Sparkles className="h-[18px] w-[18px]" aria-hidden="true" />
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-semibold tracking-tight text-slate-950">VisuTry</span>
            <span className="mt-0.5 block text-xs text-slate-500">Merchant workspace</span>
          </span>
        </Link>

        <nav aria-label="Merchant primary navigation" className="mt-8 space-y-1">
          <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">Workspace</p>
          {primary.map((item) => navLink(item))}
        </nav>

        <nav aria-label="Merchant utility navigation" className="mt-auto space-y-1 border-t border-slate-100 pt-4">
          <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">Manage</p>
          {utility.map((item) => navLink(item))}
        </nav>
      </aside>

      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex h-[60px] max-w-[1600px] items-center justify-between gap-3 px-4 sm:px-7 lg:h-[68px] lg:px-10 xl:px-12">
          <div className="flex min-w-0 items-center gap-3 lg:hidden">
            <DialogTrigger asChild>
              <button
                type="button"
                aria-label={mobileNavigationOpen ? 'Close navigation' : 'Open navigation'}
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
              >
                <Menu className="h-4 w-4" aria-hidden="true" />
              </button>
            </DialogTrigger>
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-950 text-white">
              <Sparkles className="h-4 w-4" aria-hidden="true" />
            </span>
            <span className="min-w-0 truncate text-sm font-semibold text-slate-950">{selected?.name ?? 'Merchant workspace'}</span>
          </div>

          <div className="hidden min-w-0 items-center gap-3 lg:flex">
            <span className="text-xs font-medium text-slate-500">Workspace</span>
            <span aria-hidden="true" className="h-4 w-px bg-slate-200" />
            {merchantPicker('w-[min(34vw,18rem)]')}
            <EnvironmentLabel referenceData={selected?.referenceData} />
          </div>

          <div className="hidden items-center gap-3 lg:flex">
            <span className="text-xs text-slate-500">{selected?.role === 'OWNER' ? 'Owner' : selected?.role}</span>
          </div>

          <div className="lg:hidden"><EnvironmentLabel referenceData={selected?.referenceData} /></div>
        </div>
      </header>

      <DialogContent aria-modal="true" overlayClassName="bg-slate-950/25" className="!left-0 !top-0 !h-dvh !w-[min(86vw,320px)] !max-w-none !translate-x-0 !translate-y-0 !gap-0 !rounded-none border-r border-slate-200 !p-0 shadow-2xl lg:hidden">
        <DialogTitle className="sr-only">Merchant navigation</DialogTitle>
        <DialogDescription className="sr-only">Choose a section in your merchant workspace.</DialogDescription>
        <aside id="merchant-mobile-navigation" className="flex h-full flex-col bg-white px-4 py-5" aria-label="Merchant navigation">
          <div className="flex items-center justify-between gap-3 px-2">
            <Link href={href('home')} onClick={() => setMobileNavigationOpen(false)} className="flex min-w-0 items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-950 text-white"><Sparkles className="h-[18px] w-[18px]" aria-hidden="true" /></span>
              <span className="min-w-0"><span className="block text-sm font-semibold text-slate-950">VisuTry Merchant</span><span className="block truncate text-xs text-slate-500">{selected?.name ?? 'Workspace'}</span></span>
            </Link>
          </div>
          <div className="mt-5 px-2">
            {merchantPicker('w-full')}
          </div>
          <nav aria-label="Merchant primary navigation" className="mt-7 space-y-1">
            <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">Workspace</p>
            {primary.map((item) => navLink(item, () => setMobileNavigationOpen(false)))}
          </nav>
          <nav aria-label="Merchant utility navigation" className="mt-auto space-y-1 border-t border-slate-100 pt-4">
            <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">Manage</p>
            {utility.map((item) => navLink(item, () => setMobileNavigationOpen(false)))}
          </nav>
        </aside>
      </DialogContent>

      <div className="mx-auto max-w-[1600px] px-4 py-6 sm:px-7 sm:py-8 lg:px-10 lg:py-9 xl:px-12">
        {children}
      </div>
    </main>
    </Dialog>
  )
}
