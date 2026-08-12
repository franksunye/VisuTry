'use client'

import dynamic from 'next/dynamic'
import { useState } from 'react'
import { ArrowRight, Loader2 } from 'lucide-react'

const LazyStoreShopperExperience = dynamic(
  () => import('@/components/store/StoreShopperExperience').then((module) => module.StoreShopperExperience),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-40 items-center justify-center gap-2 rounded-[2rem] border border-slate-200 bg-white p-8 text-sm text-slate-500">
        <Loader2 className="h-4 w-4 animate-spin text-blue-600" aria-hidden="true" />
        Loading the interactive experience…
      </div>
    ),
  },
)

type InteractiveCommerceLauncherProps = {
  merchantSlug: string
  experienceSlug?: string
  locale: string
  publicPocStorage: boolean
}

/**
 * Keep the public discovery route server-first. The interactive runtime,
 * upload UI, recommendation flow, and Try-On/Compare client graph only enter
 * the page after an explicit shopper action.
 */
export function InteractiveCommerceLauncher({
  merchantSlug,
  experienceSlug,
  locale,
  publicPocStorage,
}: InteractiveCommerceLauncherProps) {
  const [started, setStarted] = useState(false)

  if (started) {
    return (
      <section aria-label="Interactive shopping experience" className="border-t border-slate-200/80 bg-[#f7f8fb] px-4 py-8 sm:px-6 lg:px-8">
        <LazyStoreShopperExperience
          merchantSlug={merchantSlug}
          experienceSlug={experienceSlug}
          locale={locale}
          publicPocStorage={publicPocStorage}
        />
      </section>
    )
  }

  return (
    <section
      aria-labelledby="interactive-shopping"
      data-presentation-cta="shopping-interest"
      className="border-t border-slate-200/80 bg-white px-4 py-12 sm:px-6 sm:py-16 lg:px-8"
    >
      <div className="mx-auto flex max-w-4xl flex-col items-start justify-between gap-6 rounded-[2rem] border border-slate-200 bg-[#f8fafc] p-6 sm:flex-row sm:items-center sm:p-8">
        <div>
          <h2 id="interactive-shopping" className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
            Try these frames on your photo
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Get a private shortlist and virtual try-on when you are ready.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setStarted(true)}
          className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
        >
          Try on your photo
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </section>
  )
}
