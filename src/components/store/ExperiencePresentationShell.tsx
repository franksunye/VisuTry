'use client'

import Image from 'next/image'
import type { RefObject } from 'react'
import {
  ArrowRight,
  Glasses,
  LockKeyhole,
  ShieldCheck,
} from 'lucide-react'
import type { PresentationMode } from '@/modules/store/domain/presentation-mode'

export type PresentationFrame = {
  id: string
  name: string
  imageUrl: string | null
  shape: string
  color: string | null
  productBrand: string | null
}

export type PresentationExperience = {
  type: 'STORE' | 'CAMPAIGN'
  name: string
  headline: string | null
  description: string | null
  heroAssetUrl: string | null
}

export type PresentationMerchant = {
  name: string
  logoUrl: string | null
  referenceData: boolean
  activeFrameCount: number
  experience: PresentationExperience | null
}

export type ExperiencePresentationCopy = {
  storeLabel: string
  campaignLabel: string
  storeSubhead: string
  storeHero: string
  heroBody: string
  referenceCatalog: string
  liveCatalog: string
  featuredEyebrow: string
  featuredTitle: string
  featuredDescription: string
  storeCta: string
  campaignCta: string
  actionCta: string
  ctaSupport: string
  privacyTitle: string
  privacyBody: string
  privacyPoint1: string
  privacyPoint2: string
  privacyPoint3: string
  privacyPublicNoticeLabel: string
  privacyPublicNotice: string
  privacyAccept: string
  privacyStarting: string
  privacyHint: string
  poweredBy: string
  uploadTitle: string
  recommendTitle: string
  tryOnTitle: string
}

type ExperiencePresentationShellProps = {
  mode: PresentationMode
  merchant: PresentationMerchant
  accent: string
  featuredFrames: PresentationFrame[]
  copy: ExperiencePresentationCopy
  publicPocStorage: boolean
  sessionStarting: boolean
  errorMessage: string | null
  onStartRuntime: () => void
  onShoppingCta: () => void
  featuredFramesRef: RefObject<HTMLElement>
  showRuntimeCta?: boolean
  featuredFrameLimit?: number | null
}

function ExperienceHeroVisual({
  merchant,
  mode,
}: {
  merchant: PresentationMerchant
  mode: PresentationMode
}) {
  const isCampaign = merchant.experience?.type === 'CAMPAIGN'
  const heroTitle = isCampaign ? merchant.experience?.name : `Shop the ${merchant.name} eyewear collection`
  const heroDescription = merchant.experience?.description?.trim() || `Selected eyewear from ${merchant.name}.`

  return (
    <div
      className={`relative overflow-hidden rounded-[1.75rem] px-6 py-10 ${
        isCampaign
          ? 'bg-[linear-gradient(145deg,#f6eadf,#f7f1e8)]'
          : 'bg-[linear-gradient(145deg,#edf3fb,#faf7f2)]'
      } ${mode === 'EDITORIAL_FIRST' ? 'aspect-[16/9]' : 'aspect-[16/10]'}`}
    >
      {merchant.experience?.heroAssetUrl ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={merchant.experience.heroAssetUrl}
          alt={`${merchant.name} eyewear collection`}
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : null}
      <div className="absolute inset-0 bg-slate-950/10" aria-hidden="true" />
      <div
        className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-slate-950/18 to-transparent"
        aria-hidden="true"
      />
      <div className="absolute inset-x-6 bottom-6 text-white sm:inset-x-8 sm:bottom-8">
        <p className="font-serif text-2xl font-semibold sm:text-3xl">{heroTitle}</p>
        <p className="mt-2 max-w-md text-sm leading-6 text-white/85">{heroDescription}</p>
      </div>
    </div>
  )
}

function FeaturedFrameGrid({
  merchant,
  frames,
  limit,
}: {
  merchant: PresentationMerchant
  frames: PresentationFrame[]
  limit: number | null
}) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {frames.slice(0, limit ?? frames.length).map((frame, index) => (
        <article
          key={frame.id}
          className={`group rounded-2xl border bg-white p-2.5 ${
            index === 0 ? 'border-blue-400 ring-2 ring-blue-100' : 'border-slate-200'
          }`}
        >
          <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-slate-50">
            {frame.imageUrl ? (
              <Image
                src={frame.imageUrl}
                alt={frame.name}
                fill
                sizes="(max-width: 640px) 50vw, 160px"
                className="object-contain p-2"
              />
            ) : (
              <Glasses className="absolute inset-0 m-auto h-8 w-8 text-slate-300" aria-hidden="true" />
            )}
          </div>
          <p className="mt-2 truncate text-xs font-semibold text-slate-800">{frame.name}</p>
          <p className="mt-0.5 truncate text-[10px] font-medium uppercase tracking-[0.12em] text-slate-400">
            {frame.productBrand || merchant.name}
          </p>
          <p className="mt-0.5 truncate text-[10px] capitalize text-slate-400">
            {[frame.shape, frame.color].filter(Boolean).join(' · ')}
          </p>
        </article>
      ))}
    </div>
  )
}

function RuntimeCta({
  label,
  accent,
  sessionStarting,
  copy,
  onStartRuntime,
  describedBy = 'privacy-details',
}: {
  label: string
  accent: string
  sessionStarting: boolean
  copy: ExperiencePresentationCopy
  onStartRuntime: () => void
  describedBy?: string
}) {
  return (
    <button
      type="button"
      onClick={onStartRuntime}
      disabled={sessionStarting}
      aria-describedby={describedBy}
      className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl px-5 py-3.5 text-sm font-semibold text-white shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
      style={{ backgroundColor: accent }}
    >
      {sessionStarting ? copy.privacyStarting : label}
      <ArrowRight className="h-4 w-4" aria-hidden="true" />
    </button>
  )
}

function ShoppingCta({
  copy,
  mode,
  onShoppingCta,
}: {
  copy: ExperiencePresentationCopy
  mode: PresentationMode
  onShoppingCta: () => void
}) {
  const label = mode === 'EDITORIAL_FIRST' ? copy.campaignCta : copy.storeCta

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={onShoppingCta}
        data-presentation-cta="shopping-interest"
        className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3.5 text-sm font-semibold text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-slate-800"
      >
        {label}
        <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </button>
      <span className="text-xs leading-5 text-slate-500">{copy.ctaSupport}</span>
    </div>
  )
}

function PrivacyGate({
  accent,
  copy,
  publicPocStorage,
  sessionStarting,
  errorMessage,
  onStartRuntime,
  showCta,
}: {
  accent: string
  copy: ExperiencePresentationCopy
  publicPocStorage: boolean
  sessionStarting: boolean
  errorMessage: string | null
  onStartRuntime: () => void
  showCta?: boolean
}) {
  return (
    <section
      id="privacy-details"
      className="rounded-3xl border border-slate-200/80 bg-white/95 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.07)] sm:p-6"
    >
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
            <ShieldCheck className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <h2 className="font-semibold text-slate-950">{copy.privacyTitle}</h2>
            <p className="mt-1.5 max-w-2xl text-sm leading-6 text-slate-600">{copy.privacyBody}</p>
          </div>
        </div>
        {showCta !== false ? (
          <RuntimeCta
            label={copy.privacyAccept}
            accent={accent}
            sessionStarting={sessionStarting}
            copy={copy}
            onStartRuntime={onStartRuntime}
          />
        ) : null}
      </div>
      <div className="mt-4 grid gap-2 text-xs text-slate-500 sm:grid-cols-2">
        <p className="flex items-start gap-2">
          <LockKeyhole className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-700" aria-hidden="true" />
          {copy.privacyPoint1}
        </p>
        <p className="flex items-start gap-2">
          <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-700" aria-hidden="true" />
          {copy.privacyPoint3}
        </p>
      </div>
      {publicPocStorage ? (
        <details className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-xs leading-5 text-amber-900">
          <summary className="cursor-pointer font-semibold">{copy.privacyPublicNoticeLabel}</summary>
          <p className="mt-2">{copy.privacyPublicNotice}</p>
        </details>
      ) : null}
      {errorMessage ? <p className="mt-4 text-sm text-red-600" role="alert">{errorMessage}</p> : null}
      <p className="mt-4 flex items-center gap-2 text-xs text-slate-400">
        <LockKeyhole className="h-3.5 w-3.5" aria-hidden="true" />
        {copy.privacyPoint2}
      </p>
    </section>
  )
}

export function ExperiencePresentationShell({
  mode,
  merchant,
  accent,
  featuredFrames,
  copy,
  publicPocStorage,
  sessionStarting,
  errorMessage,
  onStartRuntime,
  onShoppingCta,
  featuredFramesRef,
  showRuntimeCta = true,
  featuredFrameLimit = 4,
}: ExperiencePresentationShellProps) {
  const isCampaign = merchant.experience?.type === 'CAMPAIGN'
  const headline = merchant.experience?.headline || (isCampaign ? merchant.experience?.name : copy.storeHero) || copy.storeHero
  const description = merchant.experience?.description || copy.storeSubhead

  if (mode === 'ACTION_FIRST') {
    return (
      <main
        data-presentation-mode={mode}
        className="grid items-start gap-8 py-8 lg:min-h-[calc(100vh-150px)] lg:grid-cols-[0.82fr_1.18fr] lg:gap-14 lg:py-12"
      >
        <section className="max-w-xl">
          <h1 className="font-serif text-4xl font-semibold leading-[1.08] tracking-[-0.035em] text-slate-950 sm:text-5xl lg:text-6xl">
            {headline}
          </h1>
          <p className="mt-5 max-w-lg text-base leading-7 text-slate-600 sm:text-lg">{description}</p>
          <div className="mt-6">
            <RuntimeCta
              label={copy.actionCta}
              accent={accent}
              sessionStarting={sessionStarting}
              copy={copy}
              onStartRuntime={onStartRuntime}
            />
          </div>
          <p className="mt-3 flex items-center gap-2 text-xs text-slate-400">
            <LockKeyhole className="h-3.5 w-3.5" aria-hidden="true" />
            {copy.privacyHint}
          </p>
        </section>
        <section className="relative mx-auto w-full max-w-3xl">
          <div className="relative overflow-hidden rounded-[2.25rem] border border-white bg-white/90 p-4 shadow-[0_35px_100px_rgba(30,64,175,0.12)] sm:p-6">
            <ExperienceHeroVisual merchant={merchant} mode={mode} />
            <div className="mt-4">
              <FeaturedFrameGrid merchant={merchant} frames={featuredFrames} limit={featuredFrameLimit} />
            </div>
          </div>
        </section>
        <div className="lg:col-span-2">
          <PrivacyGate
            accent={accent}
            copy={copy}
            publicPocStorage={publicPocStorage}
            sessionStarting={sessionStarting}
            errorMessage={errorMessage}
            onStartRuntime={onStartRuntime}
            showCta={false}
          />
        </div>
      </main>
    )
  }

  const isEditorial = mode === 'EDITORIAL_FIRST'
  return (
    <main data-presentation-mode={mode} className="py-8 sm:py-12">
      <section className={`grid items-center gap-8 ${isEditorial ? 'lg:grid-cols-[0.88fr_1.12fr]' : 'lg:grid-cols-[0.78fr_1.22fr]'}`}>
        <div>
          <h1 className="font-serif text-4xl font-semibold leading-[1.08] tracking-[-0.035em] text-slate-950 sm:text-5xl lg:text-6xl">{headline}</h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-slate-600 sm:text-lg">{description}</p>
          <div className="mt-6">
            <ShoppingCta copy={copy} mode={mode} onShoppingCta={onShoppingCta} />
          </div>
        </div>
        <ExperienceHeroVisual merchant={merchant} mode={mode} />
      </section>

      <section
        ref={featuredFramesRef}
        className="mt-8 scroll-mt-6 border-t border-slate-200/80 pt-7"
        aria-labelledby="featured-frames-heading"
      >
        <div className="mb-4">
          <h2 id="featured-frames-heading" className="font-serif text-2xl font-semibold text-slate-950 sm:text-3xl">{copy.featuredTitle}</h2>
        </div>
        <FeaturedFrameGrid merchant={merchant} frames={featuredFrames} limit={featuredFrameLimit} />
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
          <ShoppingCta copy={copy} mode={mode} onShoppingCta={onShoppingCta} />
          <p className="flex items-center gap-2 text-xs text-slate-400"><LockKeyhole className="h-3.5 w-3.5" aria-hidden="true" />{copy.privacyPoint2}</p>
        </div>
      </section>

      <div className="mt-8">
        <PrivacyGate
          accent={accent}
          copy={copy}
          publicPocStorage={publicPocStorage}
          sessionStarting={sessionStarting}
          errorMessage={errorMessage}
          onStartRuntime={onStartRuntime}
          showCta={showRuntimeCta}
        />
      </div>
    </main>
  )
}
