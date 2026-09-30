'use client'

import Link from 'next/link'
import { useRef } from 'react'
import { ArrowRight, FileText, PlayCircle } from 'lucide-react'
import { businessHref } from '@/config/business-site'
import { inStoreRetailDemo, inStoreRetailWhitepaper, type BusinessResource } from '@/config/business-resources'
import { analytics } from '@/lib/analytics'

type BusinessResourcePlacement = 'resources' | 'business_home' | 'platform' | 'store' | 'pilot'

function trackResourceOpen(resource: BusinessResource, placement: BusinessResourcePlacement) {
  analytics.trackCustomEvent('business_resource_opened', {
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

function DemoVideo({ placement, compact = false }: { placement: BusinessResourcePlacement; compact?: boolean }) {
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
          analytics.trackCustomEvent('business_resource_video_started', {
            resource_id: inStoreRetailDemo.id,
            resource_version: inStoreRetailDemo.version,
            placement,
            source_page: typeof window !== 'undefined' ? window.location.pathname : undefined,
          })
        }}
        onEnded={() => {
          analytics.trackCustomEvent('business_resource_video_completed', {
            resource_id: inStoreRetailDemo.id,
            resource_version: inStoreRetailDemo.version,
            placement,
            source_page: typeof window !== 'undefined' ? window.location.pathname : undefined,
          })
        }}
      >
        <source src={inStoreRetailDemo.url} type="video/mp4" />
      </video>
      {!compact ? (
        <div className="border-t border-white/10 px-5 py-4 text-xs text-slate-400">
          {inStoreRetailDemo.formatLabel} · {inStoreRetailDemo.version}
        </div>
      ) : null}
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
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 sm:py-18 lg:grid-cols-[0.72fr_1.28fr] lg:items-center lg:px-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">Product demo</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-4xl">See the in-store decision journey in action.</h2>
            <p className="mt-5 max-w-xl text-base leading-7 text-slate-600">{inStoreRetailDemo.description}</p>
            <Link href={businessHref(locale, '/business/resources')} prefetch={false} className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-blue-700 hover:text-blue-900">
              Explore all resources<ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
          <DemoVideo placement={placement} compact />
        </div>
      </section>
    )
  }

  const resources = mode === 'whitepaper'
    ? [inStoreRetailWhitepaper]
    : [inStoreRetailDemo, inStoreRetailWhitepaper]

  return (
    <section className="border-y border-slate-200 bg-[#f8fafc]" data-business-resource-placement={placement}>
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-18 lg:px-8">
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
                    onClick={() => analytics.trackCustomEvent('business_resource_navigated', {
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
  return (
    <>
      <section id="product-demo" className="bg-white scroll-mt-20">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-[0.72fr_1.28fr] lg:items-center lg:px-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">Product Demo</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-4xl">{inStoreRetailDemo.title}</h2>
            <p className="mt-5 text-base leading-7 text-slate-600">{inStoreRetailDemo.description}</p>
            <p className="mt-4 text-sm text-slate-500">{inStoreRetailDemo.formatLabel} · {inStoreRetailDemo.version}</p>
          </div>
          <DemoVideo placement="resources" />
        </div>
      </section>

      <section id="white-paper" className="border-y border-slate-200 bg-[#f8fafc] scroll-mt-20">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-[1fr_0.55fr] lg:items-center lg:px-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">White Paper</p>
            <h2 className="mt-3 max-w-3xl text-3xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-4xl">{inStoreRetailWhitepaper.title}</h2>
            <p className="mt-5 max-w-3xl text-base leading-7 text-slate-600">{inStoreRetailWhitepaper.description}</p>
            <ResourceLink
              resource={inStoreRetailWhitepaper}
              placement="resources"
              label="Read the white paper"
              className="mt-7 inline-flex items-center gap-2 rounded-xl bg-slate-950 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-slate-800"
            />
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <FileText className="h-8 w-8 text-blue-700" aria-hidden="true" />
            <p className="mt-5 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">{inStoreRetailWhitepaper.formatLabel} · {inStoreRetailWhitepaper.version}</p>
            <p className="mt-3 text-sm leading-6 text-slate-600">Face Intelligence → Recommendation → Try-On → Compare → Decision → Continuation, plus shared-device retail, deployment, and pilot-to-rollout.</p>
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-14 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">Next step</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-slate-950">Ready to test this with your own eyewear catalog?</h2>
          </div>
          <Link href={businessHref(locale, '/business/pilot')} prefetch={false} className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-slate-800">
            Start 30-Day Pilot<ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </section>
    </>
  )
}
