'use client'

import dynamic from 'next/dynamic'
import { useEffect, useRef, useState } from 'react'
import { ArrowRight, Loader2, X } from 'lucide-react'

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
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!started) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeButtonRef.current?.focus()

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [started])

  if (started) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-950/45 p-3 backdrop-blur-[2px] sm:p-6">
        <section
          role="dialog"
          aria-modal="true"
          aria-labelledby="interactive-shopping-dialog-title"
          onKeyDown={(event) => {
            if (event.key === 'Escape') setStarted(false)
          }}
          className="mx-auto flex h-[calc(100vh-1.5rem)] max-h-[60rem] w-full max-w-7xl flex-col overflow-hidden rounded-[2rem] bg-[#f7f8fb] shadow-2xl sm:h-[calc(100vh-3rem)]"
        >
          <header className="flex shrink-0 items-center justify-between gap-4 border-b border-slate-200/80 bg-white px-5 py-4 sm:px-7">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">VisuTry</p>
              <h2 id="interactive-shopping-dialog-title" className="mt-1 text-sm font-semibold text-slate-950 sm:text-base">
                Try-on workspace
              </h2>
            </div>
            <button
              ref={closeButtonRef}
              type="button"
              onClick={() => setStarted(false)}
              className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
              aria-label="Close try-on workspace"
            >
              <span className="hidden sm:inline">Close</span>
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </header>
          <div className="min-h-0 flex-1 overflow-y-auto">
            <section aria-label="Interactive shopping experience" className="border-slate-200/80 bg-[#f7f8fb] px-4 py-8 sm:px-6 lg:px-8">
              <LazyStoreShopperExperience
                merchantSlug={merchantSlug}
                experienceSlug={experienceSlug}
                locale={locale}
                publicPocStorage={publicPocStorage}
              />
            </section>
          </div>
        </section>
      </div>
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
