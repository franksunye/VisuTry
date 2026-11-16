'use client'

import Link from 'next/link'
import { useRef } from 'react'
import { ArrowRight, FileText, PlayCircle } from 'lucide-react'
import { businessHref, businessPages } from '@/config/business-site'
import { resourceTopics, inStoreRetailDemo, inStoreRetailWhitepaper, type BusinessResource } from '@/config/business-resources'
import { analytics } from '@/lib/analytics'
import { AnalyticsEvent } from '@/lib/analytics-events'

type BusinessResourcePlacement = 'resources' | 'business_home' | 'platform' | 'store' | 'pilot'

function trackResourceOpen(resource: BusinessResource, placement: BusinessResourcePlacement) {
  analytics.trackCustomEvent(AnalyticsEvent.B2bResourceOpened, {
    resource_id: resource.id,
    resource_type: resource.type,
    resource_version: resource.version,
    placement,
    source_page: typeof window !== 'undefined' ? window.location.pathname : undefined,
  })
}

function ResourceLink({
  resource,
  placement,
  label,
  className,
}: {
  resource: BusinessResource
  placement: BusinessResourcePlacement
  label: string
  className: string
}) {
  return (
    <a
      href={resource.url}
      target="_blank"
      rel="noreferrer"
      onClick={() => trackResourceOpen(resource, placement)}
      className={className}
    >
      {label}
      <ArrowRight className="h-4 w-4" aria-hidden="true" />
    </a>
  )
}

function DemoVideo({ placement }: { placement: BusinessResourcePlacement }) {
  const started = useRef(false)

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-950 shadow-[0_28px_80px_-56px_rgba(15,23,42,0.7)]">
      <video
        data-business-resource={inStoreRetailDemo.id}
        controls
        playsInline
        preload="none"
        poster={inStoreRetailDemo.poster}
        className="aspect-video w-full bg-slate-950 object-cover"
        onPlay={() => {
          if (started.current) return
          started.current = true
          analytics.trackCustomEvent(AnalyticsEvent.B2bResourceVideoStarted, {
            resource_id: inStoreRetailDemo.id,
            resource_version: inStoreRetailDemo.version,
            placement,
            source_page: typeof window !== 'undefined' ? window.location.pathname : undefined,
          })
        }}
        onEnded={() => {
          analytics.trackCustomEvent(AnalyticsEvent.B2bResourceVideoCompleted, {
            resource_id: inStoreRetailDemo.id,
            resource_version: inStoreRetailDemo.version,
            placement,
            source_page: typeof window !== 'undefined' ? window.location.pathname : undefined,
          })
        }}
      >
        <source src={inStoreRetailDemo.url} type="video/mp4" />
      </video>
    </div>
  )
}

export function BusinessResourceStrip({
  locale,
  placement,
  mode = 'both',
}: {
  locale: string
  placement: Exclude<BusinessResourcePlacement, 'resources'>
  mode?: 'both' | 'whitepaper' | 'video'
}) {
  if (mode === 'video') {
    return (
      <section className="border-y border-slate-200 bg-white" data-business-resource-placement={placement}>
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 sm:py-16 lg:grid-cols-[0.72fr_1.28fr] lg:items-center lg:px-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">Product demo</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-4xl">See the in-store decision journey in action.</h2>
            <p className="mt-5 max-w-xl text-base leading-7 text-slate-600">{inStoreRetailDemo.description}</p>
            <Link href={businessHref(locale, '/business/resources')} prefetch={false} className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-blue-700 hover:text-blue-900">
              Explore all resources<ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
          <DemoVideo placement={placement} />
        </div>
      </section>
    )
  }

  const resources = mode === 'whitepaper'
    ? [inStoreRetailWhitepaper]
    : [inStoreRetailDemo, inStoreRetailWhitepaper]

  return (
    <section className="border-y border-slate-200 bg-[#f8fafc]" data-business-resource-placement={placement}>
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-16 lg:px-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">{mode === 'whitepaper' ? 'Platform resource' : 'Product resources'}</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-4xl">
              {mode === 'whitepaper' ? 'Go deeper on the retail decision model.' : 'See the product. Go deeper before you pilot.'}
            </h2>
            <p className="mt-4 text-base leading-7 text-slate-600">
              {mode === 'whitepaper'
                ? 'Read the practical white paper covering the decision journey, shared-device retail, deployment, and pilot-to-rollout model.'
                : 'Use the product demo and white paper to evaluate the shopper journey and deployment model before starting a Pilot.'}
            </p>
          </div>
          {mode === 'both' ? (
            <Link href={businessHref(locale, '/business/resources')} prefetch={false} className="inline-flex items-center gap-2 text-sm font-semibold text-blue-700 hover:text-blue-900">
              Browse resources<ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          ) : null}
        </div>

        <div className={`mt-9 grid gap-5 ${resources.length > 1 ? 'md:grid-cols-2' : ''}`}>
          {resources.map((resource) => (
            <article key={resource.id} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_20px_60px_-48px_rgba(15,23,42,0.35)]">
              <div className="flex items-start gap-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                  {resource.type === 'video' ? <PlayCircle className="h-5 w-5" aria-hidden="true" /> : <FileText className="h-5 w-5" aria-hidden="true" />}
                </span>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">{resource.formatLabel}</p>
                  <h3 className="mt-2 text-xl font-semibold tracking-[-0.02em] text-slate-950">{resource.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{resource.description}</p>
                  <Link
                    href={businessHref(locale, resource.type === 'video' ? '/business/resources#product-demo' : '/business/resources#white-paper')}
                    prefetch={false}
                    onClick={() => analytics.trackCustomEvent(AnalyticsEvent.B2bResourceNavigated, {
                      resource_id: resource.id,
                      resource_type: resource.type,
                      resource_version: resource.version,
                      placement,
                      source_page: typeof window !== 'undefined' ? window.location.pathname : undefined,
                    })}
                    className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-blue-700 hover:text-blue-900"
                  >
                    {resource.type === 'video' ? 'Watch product demo' : 'Read white paper'}
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

export function BusinessResourcesPage({ locale }: { locale: string }) {
  const page = businessPages.resources
  const mediaLinks = [page.primaryCta, ...(page.secondaryCta ? [page.secondaryCta] : [])]

  return (
    <div className="mx-auto max-w-7xl px-5 sm:px-8">
      <header className="border-b border-slate-200 pb-5 pt-8 sm:pb-7 sm:pt-12">
        <Link href={businessHref(locale, '/business')} prefetch={false} className="text-sm font-semibold text-blue-700 hover:underline">
          {page.eyebrow}
        </Link>
        <h1 className="mt-3 text-4xl font-semibold leading-tight tracking-[-0.045em] sm:text-5xl lg:text-6xl">{page.title}</h1>
        <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">{page.description}</p>
        <nav aria-label="Resource topics" className="mt-5 flex flex-wrap items-center gap-2 sm:mt-6">
          {resourceTopics.map((topic) => (
            <a key={topic.id} href={`#${topic.id}`} className="inline-flex min-h-11 items-center rounded-full border border-slate-300 px-3.5 text-sm font-medium text-slate-800 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-800">
              {topic.shortTitle}
            </a>
          ))}
        </nav>
        <div className="mt-2 flex flex-wrap items-center gap-x-5 lg:hidden">
          {mediaLinks.map((link) => (
            <a key={link.href} href={link.href} className="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-blue-700 hover:underline">
              {link.label}<ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </a>
          ))}
        </div>
      </header>

      <div className="grid gap-8 py-7 sm:py-10 lg:grid-cols-[minmax(0,1fr)_minmax(16rem,0.41fr)] lg:gap-10">
        <div className="grid content-start gap-x-8 gap-y-8 md:grid-cols-2">
          {resourceTopics.map((topic) => (
            <section key={topic.id} id={topic.id} aria-labelledby={`${topic.id}-heading`} className="min-w-0 scroll-mt-24">
              <h2 id={`${topic.id}-heading`} className="border-b-2 border-slate-800 pb-3 text-xl font-semibold leading-tight tracking-[-0.025em] sm:text-2xl">
                {topic.title}
              </h2>
              <ul className="divide-y divide-slate-200">
                {topic.links.map((link) => (
                  <li key={link.path}>
                    <Link href={businessHref(locale, link.path)} prefetch={false} className="group flex min-h-11 items-center justify-between gap-3 py-3 text-[0.95rem] font-medium leading-6 text-slate-700 hover:text-blue-700">
                      <span className="group-hover:underline">{link.label}</span>
                      <ArrowRight className="h-4 w-4 shrink-0 text-slate-400 group-hover:text-blue-700" aria-hidden="true" />
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <aside aria-label="Product demo and white paper" className="self-start rounded-2xl bg-slate-50 px-5 py-6 sm:px-6">
          <section id="product-demo" className="scroll-mt-24">
            <h2 className="text-lg font-semibold leading-snug tracking-tight">{inStoreRetailDemo.title}</h2>
            <div className="mt-4"><DemoVideo placement="resources" /></div>
            <p className="mt-3 text-sm leading-6 text-slate-600">See how a shopper compares frames with an optician during a store visit.</p>
          </section>
          <section id="white-paper" className="mt-6 scroll-mt-24 border-t border-slate-200 pt-5">
            <p className="flex items-center gap-2 text-xs font-semibold text-slate-600"><FileText className="h-4 w-4" aria-hidden="true" />{inStoreRetailWhitepaper.formatLabel} · {inStoreRetailWhitepaper.version}</p>
            <h2 className="mt-2 text-lg font-semibold leading-snug tracking-tight">{inStoreRetailWhitepaper.title}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">Explore shared-device setup and how to move from a store pilot to rollout.</p>
            <ResourceLink resource={inStoreRetailWhitepaper} placement="resources" label="Read the white paper" className="mt-2 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-blue-700 hover:underline" />
          </section>
        </aside>
      </div>

      <section className="flex flex-col items-start gap-4 border-t border-slate-200 py-7 sm:flex-row sm:items-center sm:justify-between sm:py-9">
        <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">Ready to test this with your own frames?</h2>
        <Link href={businessHref(locale, '/business/pilot')} prefetch={false} onClick={() => analytics.trackBusinessCtaClicked({ locale, ctaLocation: 'business_resources', intentType: 'pilot_request' })} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800">
          Start 30-Day Pilot<ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </section>
    </div>
  )
}
