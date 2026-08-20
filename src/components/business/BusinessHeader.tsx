'use client'

import Link from 'next/link'
import { useParams, usePathname } from 'next/navigation'
import { ArrowRight, Glasses, Menu, X } from 'lucide-react'
import { useState } from 'react'
import { businessHref, businessNav } from '@/config/business-site'
import { cn } from '@/utils/cn'

export function BusinessHeader() {
  const params = useParams()
  const pathname = usePathname()
  const locale = params.locale as string
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8" aria-label="Business navigation">
        <div className="flex h-[72px] items-center justify-between gap-5">
          <Link href={businessHref(locale, '/business')} prefetch={false} className="flex shrink-0 items-center gap-3" aria-label="VisuTry Business home">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-950 text-white shadow-sm">
              <Glasses className="h-5 w-5" aria-hidden="true" />
            </span>
            <span className="flex items-baseline gap-2">
              <span className="text-[17px] font-semibold tracking-[-0.02em] text-slate-950">VisuTry</span>
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Business</span>
            </span>
          </Link>

          <div className="hidden items-center gap-6 xl:flex">
            {businessNav.map((item) => {
              const href = businessHref(locale, item.href)
              const active = pathname === href
              return (
                <Link
                  key={item.href}
                  href={href}
                  prefetch={false}
                  className={cn(
                    'text-sm font-medium transition-colors',
                    active ? 'text-blue-700' : 'text-slate-600 hover:text-slate-950'
                  )}
                >
                  {item.label}
                </Link>
              )
            })}
          </div>

          <div className="flex shrink-0 items-center gap-2.5">
            <Link href={`/${locale}/merchant`} prefetch={false} className="hidden text-sm font-semibold text-slate-600 transition hover:text-slate-950 lg:inline-flex">
              Merchant Sign In
            </Link>
            <Link
              href={businessHref(locale, '/business/pilot')}
              prefetch={false}
              className="hidden items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 sm:inline-flex"
            >
              Start a Pilot
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-700 transition hover:bg-slate-50 xl:hidden"
              aria-label="Toggle business navigation"
              aria-expanded={open}
              onClick={() => setOpen((value) => !value)}
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        <div className={cn('overflow-hidden transition-all duration-300 xl:hidden', open ? 'max-h-[560px] border-t border-slate-200 py-4' : 'max-h-0')}>
          <div className="grid gap-1">
            {businessNav.map((item) => {
              const href = businessHref(locale, item.href)
              const active = pathname === href
              return (
                <Link
                  key={item.href}
                  href={href}
                  prefetch={false}
                  onClick={() => setOpen(false)}
                  className={cn(
                    'rounded-xl px-3 py-2.5 text-sm font-medium transition',
                    active ? 'bg-blue-50 text-blue-700' : 'text-slate-700 hover:bg-slate-50'
                  )}
                >
                  {item.label}
                </Link>
              )
            })}
            <div className="my-2 border-t border-slate-200" />
            <Link href={`/${locale}/merchant`} prefetch={false} onClick={() => setOpen(false)} className="rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
              Merchant Sign In
            </Link>
            <Link href={businessHref(locale, '/business/pilot')} prefetch={false} onClick={() => setOpen(false)} className="mt-1 inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white">
              Start a Pilot
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link href={`/${locale}`} prefetch={false} onClick={() => setOpen(false)} className="px-3 py-2.5 text-sm font-medium text-slate-500">
              For Shoppers →
            </Link>
          </div>
        </div>
      </nav>
    </header>
  )
}
