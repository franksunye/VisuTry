'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Glasses } from 'lucide-react'
import { businessHref } from '@/config/business-site'

export function BusinessFooter() {
  const params = useParams()
  const locale = params.locale as string

  const columns = [
    {
      title: 'Platform',
      links: [
        ['Overview', '/business/platform'],
        ['Store', '/business/store'],
        ['Campaigns', '/business/campaigns'],
        ['Commerce Intelligence', '/business/commerce-intelligence'],
      ],
    },
    {
      title: 'Explore',
      links: [
        ['Examples', '/business/examples'],
        ['Integrations', '/business/integrations'],
        ['Discover Brands', '/discover'],
      ],
    },
    {
      title: 'Business',
      links: [
        ['Pricing', '/business/pricing'],
        ['Start a Pilot', '/business/pilot'],
        ['Merchant Sign In', '/merchant'],
      ],
    },
    {
      title: 'VisuTry',
      links: [
        ['For Shoppers', '/'],
        ['Blog', '/blog'],
        ['Privacy', '/privacy'],
        ['Terms', '/terms'],
      ],
    },
  ] as const

  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_repeat(4,1fr)]">
          <div className="max-w-sm">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-950 text-white">
                <Glasses className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <p className="font-semibold text-slate-950">VisuTry Business</p>
                <p className="text-xs text-slate-400">AI commerce for eyewear</p>
              </div>
            </div>
            <p className="mt-5 text-sm leading-6 text-slate-500">
              Turn eyewear catalogs into guided shopping experiences with recommendation, Try-On, Compare, and measurable shopper intent.
            </p>
          </div>

          {columns.map((column) => (
            <div key={column.title}>
              <h3 className="text-sm font-semibold text-slate-950">{column.title}</h3>
              <ul className="mt-4 space-y-2.5">
                {column.links.map(([label, href]) => (
                  <li key={href}>
                    <Link href={businessHref(locale, href)} prefetch={false} className="text-sm text-slate-500 transition hover:text-slate-950">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 flex flex-col gap-3 border-t border-slate-200 pt-6 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} VisuTry. All rights reserved.</p>
          <p>Decision support for eyewear commerce. No medical or physical-fit guarantee.</p>
        </div>
      </div>
    </footer>
  )
}
