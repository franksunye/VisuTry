import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Compass,
  Grid2X2,
  Layers3,
  LineChart,
  ScanFace,
  ShoppingBag,
  Sparkles,
  Store,
  Wand2,
} from 'lucide-react'
import { getBusinessCopy } from '@/config/business'
import { setRequestLocale } from 'next-intl/server'
import { generateStructuredData } from '@/lib/seo'
import { StoreMarketingVisual } from '@/components/store/StoreMarketingVisual'

interface BusinessPageProps {
  params: {
    locale: string
  }
}

export const dynamic = 'force-static'

export async function generateMetadata({ params }: BusinessPageProps): Promise<Metadata> {
  setRequestLocale(params.locale)
  const copy = getBusinessCopy(params.locale)
  return {
    title: copy.metaTitle,
    description: copy.metaDescription,
    alternates: {
      canonical: `https://www.visutry.com/${params.locale}/business`,
    },
    openGraph: {
      title: copy.metaTitle,
      description: copy.metaDescription,
      url: `https://www.visutry.com/${params.locale}/business`,
      type: 'website',
    },
  }
}

export default async function BusinessPage({ params }: BusinessPageProps) {
  setRequestLocale(params.locale)
  const locale = params.locale
  const copy = getBusinessCopy(locale)
  const businessSchema = generateStructuredData('softwareApplication', {
    name: copy.schemaName,
    url: `https://www.visutry.com/${locale}/business`,
    applicationCategory: 'ShoppingApplication',
    description: copy.metaDescription,
    provider: {
      '@type': 'Organization',
      name: 'VisuTry',
      url: 'https://www.visutry.com/',
    },
    featureList: copy.intelligence.signals,
  })

  const journeyIcons = [Compass, Wand2, Sparkles, Grid2X2, ShoppingBag]
  const distributionIcons = [Compass, ScanFace, Grid2X2, Wand2]
  const deploymentIcons = [Layers3, Store, Sparkles, ArrowRight, BarChart3]

  return (
    <main className="overflow-hidden bg-[#f7f8fb] text-slate-950">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(businessSchema) }} />

      <section className="border-b border-slate-200/80 bg-[radial-gradient(circle_at_78%_10%,rgba(186,230,253,0.62),transparent_34%),linear-gradient(135deg,#f8fbff_0%,#ffffff_58%,#f4f7fb_100%)]">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-[0.88fr_1.12fr] lg:items-center lg:px-8 lg:py-24">
          <div className="max-w-2xl">
            <p className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/85 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-blue-700 shadow-sm">
              <Store className="h-3.5 w-3.5" aria-hidden="true" />
              {copy.eyebrow}
            </p>
            <h1 className="mt-6 max-w-2xl text-4xl font-semibold tracking-[-0.045em] text-slate-950 sm:text-5xl lg:text-[4.5rem] lg:leading-[1.02]">
              {copy.title}
            </h1>
            <p className="mt-6 max-w-xl text-base leading-8 text-slate-600 sm:text-lg">
              {copy.description}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href={`/${locale}/store/luna-optical`} className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 py-3.5 text-sm font-bold text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-slate-800">
                {copy.primaryCta}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <a href="mailto:support@visutry.com?subject=VisuTry%20pilot%20conversation" className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3.5 text-sm font-bold text-slate-800 transition hover:border-blue-300 hover:text-blue-700">
                {copy.secondaryCta}
              </a>
            </div>
            <p className="mt-5 text-xs leading-5 text-slate-500">{copy.microline}</p>
          </div>

          <StoreMarketingVisual
            src="/images/store/store-hero-shopper.png"
            alt={copy.visuals.hero.alt}
            label={copy.visuals.hero.label}
            description={copy.visuals.hero.description}
            aspectClass="aspect-[4/3] rounded-[2rem]"
            priority
          />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">{copy.shopperJourney.eyebrow}</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">{copy.shopperJourney.title}</h2>
          <p className="mt-4 text-base leading-7 text-slate-600">{copy.shopperJourney.description}</p>
        </div>
        <ol className="mt-10 grid gap-4 md:grid-cols-5">
          {copy.shopperJourney.steps.map((step, index) => {
            const Icon = journeyIcons[index]
            return (
              <li key={step.label} className="relative rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_16px_40px_-32px_rgba(15,23,42,0.65)]">
                <div className="flex items-center justify-between">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700"><Icon className="h-5 w-5" aria-hidden="true" /></span>
                  <span className="text-xs font-bold text-slate-400">0{index + 1}</span>
                </div>
                <h3 className="mt-5 text-base font-bold">{step.label}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{step.description}</p>
              </li>
            )
          })}
        </ol>
      </section>

      <section className="border-y border-slate-200/80 bg-white/70">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-[0.8fr_1.2fr] lg:items-center lg:px-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">{copy.experienceTypes.eyebrow}</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">{copy.experienceTypes.title}</h2>
            <p className="mt-4 max-w-xl text-base leading-7 text-slate-600">{copy.experienceTypes.description}</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <Store className="h-6 w-6 text-blue-700" aria-hidden="true" />
              <h3 className="mt-5 text-xl font-semibold">{copy.experienceTypes.storeTitle}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">{copy.experienceTypes.storeDescription}</p>
              <Link href={`/${locale}/store`} className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-blue-700 hover:text-blue-900">{copy.experienceTypes.storeCta} <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
            </article>
            <article className="rounded-2xl border border-slate-200 bg-slate-950 p-6 text-white shadow-sm">
              <Sparkles className="h-6 w-6 text-sky-300" aria-hidden="true" />
              <h3 className="mt-5 text-xl font-semibold">{copy.experienceTypes.campaignTitle}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-300">{copy.experienceTypes.campaignDescription}</p>
              <Link href={`/${locale}/discover`} className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-sky-300 hover:text-white">{copy.experienceTypes.campaignCta} <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
            </article>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:px-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">{copy.distribution.eyebrow}</p>
          <h2 className="mt-3 max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">{copy.distribution.title}</h2>
          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">{copy.distribution.description}</p>
          <div className="mt-7 grid gap-3 sm:grid-cols-2">
            {copy.distribution.surfaces.map((surface, index) => {
              const Icon = distributionIcons[index]
              return <div key={surface.label} className="flex gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><Icon className="mt-0.5 h-5 w-5 shrink-0 text-blue-700" aria-hidden="true" /><div><h3 className="text-sm font-bold">{surface.label}</h3><p className="mt-1 text-sm leading-5 text-slate-600">{surface.description}</p></div></div>
            })}
          </div>
        </div>
        <StoreMarketingVisual
          src="/images/store/store-shopper-experience.png"
          alt={copy.visuals.distribution.alt}
          label={copy.visuals.distribution.label}
          description={copy.visuals.distribution.description}
          aspectClass="aspect-[16/10] rounded-[2rem]"
        />
      </section>

      <section className="bg-slate-950 text-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-[0.72fr_1.28fr] lg:items-center lg:px-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-300">{copy.intelligence.eyebrow}</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">{copy.intelligence.title}</h2>
            <p className="mt-4 text-base leading-7 text-slate-300">{copy.intelligence.description}</p>
            <div className="mt-7 overflow-hidden rounded-2xl border border-white/10 bg-white/95 shadow-xl shadow-black/20">
              <Image src="/images/store/store-owner-dashboard.png" alt={copy.visuals.intelligence.alt} width={1448} height={1086} className="h-auto w-full" />
              <p className="px-4 py-3 text-xs leading-5 text-slate-600">{copy.visuals.intelligence.description}</p>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {copy.intelligence.signals.map((signal, index) => <div key={signal} className="rounded-2xl border border-white/10 bg-white/[0.06] p-5"><div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-300/10 text-sky-300"><LineChart className="h-4 w-4" aria-hidden="true" /></div><p className="mt-4 text-sm font-semibold text-white">{signal}</p><p className="mt-2 text-xs leading-5 text-slate-400">{copy.intelligence.signalNote}</p><span className="sr-only">{copy.intelligence.signalSrPrefix} {index + 1}</span></div>)}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">{copy.proof.eyebrow}</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">{copy.proof.title}</h2>
          <p className="mt-4 text-base leading-7 text-slate-600">{copy.proof.description}</p>
        </div>
        <div className="mt-10 grid gap-5 lg:grid-cols-2">
          <article className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-6">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-800">{copy.proof.liveLabel}</p>
            <h3 className="mt-3 text-2xl font-semibold">Luna Optical</h3>
            <p className="mt-3 max-w-lg text-sm leading-6 text-slate-600">{copy.proof.liveDescription}</p>
            <Link href={`/${locale}/store/luna-optical`} className="mt-6 inline-flex items-center gap-2 rounded-xl bg-emerald-800 px-4 py-3 text-sm font-bold text-white hover:bg-emerald-900">{copy.proof.liveCta} <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
          </article>
          <article className="rounded-2xl border border-amber-200 bg-amber-50/70 p-6">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-amber-900">{copy.proof.referenceLabel}</p>
            <h3 className="mt-3 text-2xl font-semibold">AKILA · Statement Frames</h3>
            <p className="mt-3 max-w-lg text-sm leading-6 text-slate-600">{copy.proof.referenceDescription}</p>
            <Link href={`/${locale}/c/akila/statement-frames`} className="mt-6 inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-bold text-white hover:bg-slate-800">{copy.proof.referenceCta} <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
          </article>
        </div>
        <p className="mx-auto mt-6 max-w-3xl rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs leading-5 text-slate-500">{copy.proof.disclosure}</p>
      </section>

      <section className="border-y border-slate-200/80 bg-white/70">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-[0.72fr_1.28fr] lg:items-center lg:px-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">{copy.deployment.eyebrow}</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">{copy.deployment.title}</h2>
            <p className="mt-4 text-base leading-7 text-slate-600">{copy.deployment.description}</p>
            <p className="mt-6 flex items-start gap-2 text-sm font-semibold text-slate-700"><CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" aria-hidden="true" />{copy.deployment.note}</p>
          </div>
          <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {copy.deployment.steps.map((step, index) => {
              const Icon = deploymentIcons[index]
              return <li key={step.label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><Icon className="h-5 w-5 text-blue-700" aria-hidden="true" /><p className="mt-4 text-sm font-bold">{step.label}</p><p className="mt-1 text-xs leading-5 text-slate-600">{step.description}</p></li>
            })}
          </ol>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-16 text-center sm:px-6 sm:py-24">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">{copy.closing.eyebrow}</p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">{copy.closing.title}</h2>
        <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-slate-600">{copy.closing.description}</p>
        <a href="mailto:support@visutry.com?subject=VisuTry%20pilot%20conversation" className="mt-8 inline-flex items-center gap-2 rounded-xl bg-slate-950 px-6 py-3.5 text-sm font-bold text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-slate-800">{copy.closing.cta}<ArrowRight className="h-4 w-4" aria-hidden="true" /></a>
      </section>
    </main>
  )
}
