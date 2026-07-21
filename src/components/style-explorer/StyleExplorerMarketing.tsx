'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import {
  ArrowRight,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Cloud,
  Eye,
  Image as ImageIcon,
  Sparkles,
} from 'lucide-react'

interface StyleExplorerMarketingProps {
  locale: string
  signInHref: string
}

const resultSlides = [
  {
    src: '/assets/marketing/style-explorer-female-results.jpg',
    alt: 'Style Explorer showing four eyewear looks on the same female portrait',
    label: 'Female · Modern / Work',
  },
  {
    src: '/assets/marketing/style-explorer-male-results.jpg',
    alt: 'Style Explorer showing four eyewear looks on the same male portrait',
    label: 'Male · Classic / Everyday',
  },
]

const steps = [
  {
    number: '01',
    title: 'Pick your direction',
    description: 'Choose the style and occasion you want to explore.',
    image: '/assets/marketing/style-explorer-step-1-style-direction.jpg',
    alt: 'Style direction and occasion controls',
  },
  {
    number: '02',
    title: 'Review four frames',
    description: 'See and adjust the recommendation before generating.',
    image: '/assets/marketing/style-explorer-step-2-frame-selection.jpg',
    alt: 'Four recommended eyewear frames',
  },
  {
    number: '03',
    title: 'Compare your looks',
    description: 'Generate four results from the same portrait.',
    image: '/assets/marketing/style-explorer-step-3-generated-looks.jpg',
    alt: 'Four generated eyewear looks on one portrait',
  },
]

export function StyleExplorerMarketing({ locale, signInHref }: StyleExplorerMarketingProps) {
  const [activeSlide, setActiveSlide] = useState(0)

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % resultSlides.length)
    }, 5500)

    return () => window.clearInterval(timer)
  }, [])

  const showPrevious = () => {
    setActiveSlide((current) => (current - 1 + resultSlides.length) % resultSlides.length)
  }

  const showNext = () => {
    setActiveSlide((current) => (current + 1) % resultSlides.length)
  }

  return (
    <main className="overflow-hidden bg-[linear-gradient(180deg,#f6f9ff_0%,#ffffff_42%,#f8faff_100%)]">
      <section className="mx-auto max-w-7xl px-4 pb-16 pt-10 sm:px-6 sm:pt-14 lg:px-8 lg:pb-20 lg:pt-16">
        <div className="grid items-center gap-12 lg:grid-cols-[0.82fr_1.18fr] lg:gap-16">
          <div className="max-w-xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white px-3 py-1.5 text-xs font-bold tracking-wide text-blue-700 shadow-sm">
              <Sparkles className="h-3.5 w-3.5" /> NEW · STYLE EXPLORER
            </span>

            <h1 className="mt-6 text-4xl font-bold tracking-[-0.04em] text-slate-950 sm:text-5xl lg:text-[3.65rem] lg:leading-[1.02]">
              Discover four sides of your eyewear style
            </h1>

            <p className="mt-6 max-w-lg text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
              Choose a direction and occasion. VisuTry recommends four distinct frames, then creates four looks from the same portrait.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href={signInHref}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
              >
                Start Exploring <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href={`/${locale}/pricing`}
                className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-6 py-3.5 text-sm font-bold text-slate-700 transition hover:border-blue-300 hover:text-blue-700"
              >
                View Pricing
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap gap-x-5 gap-y-3 text-sm text-slate-600">
              <span className="inline-flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-blue-600" /> Preview before generating
              </span>
              <span className="inline-flex items-center gap-2">
                <ImageIcon className="h-4 w-4 text-blue-600" /> Four looks, one portrait
              </span>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-8 -z-10 rounded-[3rem] bg-blue-200/30 blur-3xl" />
            <div className="overflow-hidden rounded-3xl border border-white/90 bg-white p-3 shadow-[0_28px_80px_-32px_rgba(37,99,235,0.35)] sm:p-4">
              <div className="relative aspect-[16/10] overflow-hidden rounded-2xl bg-slate-50">
                {resultSlides.map((slide, index) => (
                  <div
                    key={slide.src}
                    className={`absolute inset-0 transition duration-700 ease-out ${
                      index === activeSlide ? 'translate-x-0 opacity-100' : 'translate-x-4 opacity-0 pointer-events-none'
                    }`}
                    aria-hidden={index !== activeSlide}
                  >
                    <Image
                      src={slide.src}
                      alt={slide.alt}
                      fill
                      priority={index === 0}
                      className="object-contain"
                      sizes="(min-width: 1024px) 58vw, 100vw"
                    />
                  </div>
                ))}

                <div className="absolute left-4 top-4 rounded-full border border-white/80 bg-white/90 px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm backdrop-blur">
                  {resultSlides[activeSlide].label}
                </div>

                <button
                  type="button"
                  onClick={showPrevious}
                  aria-label="Show previous Style Explorer example"
                  className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full border border-slate-200 bg-white/95 p-2 text-slate-700 shadow-md transition hover:text-blue-600"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={showNext}
                  aria-label="Show next Style Explorer example"
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full border border-slate-200 bg-white/95 p-2 text-slate-700 shadow-md transition hover:text-blue-600"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="mt-5 flex justify-center gap-2" aria-label="Style Explorer examples">
              {resultSlides.map((slide, index) => (
                <button
                  key={slide.src}
                  type="button"
                  onClick={() => setActiveSlide(index)}
                  aria-label={`Show example ${index + 1}`}
                  aria-current={index === activeSlide}
                  className={`h-2 rounded-full transition-all ${index === activeSlide ? 'w-8 bg-blue-600' : 'w-2 bg-slate-300 hover:bg-slate-400'}`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            {
              icon: Eye,
              title: 'Transparent recommendations',
              description: 'Review and adjust the exact four frames before generation.',
            },
            {
              icon: Sparkles,
              title: 'One proven try-on pipeline',
              description: 'Every look uses the same reliable VisuTry generation system.',
            },
            {
              icon: Cloud,
              title: 'Saved automatically',
              description: 'Results appear in Dashboard History, ready to download or share.',
            },
          ].map(({ icon: Icon, title, description }) => (
            <article key={title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_12px_35px_-24px_rgba(15,23,42,0.45)]">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <Icon className="h-5 w-5" />
              </div>
              <h2 className="mt-5 text-base font-bold text-slate-950">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-slate-200/80 bg-white/75 py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">How it works</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
              From one portrait to four distinct looks
            </h2>
          </div>

          <div className="mt-12 grid gap-5 lg:grid-cols-3">
            {steps.map((step) => (
              <article key={step.number} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_16px_45px_-30px_rgba(15,23,42,0.5)]">
                <div className="p-6 pb-4">
                  <div className="flex items-start gap-4">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                      {step.number}
                    </span>
                    <div>
                      <h3 className="font-bold text-slate-950">{step.title}</h3>
                      <p className="mt-1.5 text-sm leading-6 text-slate-600">{step.description}</p>
                    </div>
                  </div>
                </div>
                <div className="relative mx-4 mb-4 aspect-[16/9] overflow-hidden rounded-xl bg-slate-50">
                  <Image src={step.image} alt={step.alt} fill className="object-cover" sizes="(min-width: 1024px) 33vw, 100vw" />
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="flex flex-col items-start justify-between gap-6 overflow-hidden rounded-3xl border border-blue-200 bg-[linear-gradient(110deg,#eff6ff_0%,#ffffff_48%,#eef2ff_100%)] px-7 py-9 sm:px-10 lg:flex-row lg:items-center">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
              See how different eyewear styles change your look
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600 sm:text-base">
              Explore four distinct directions without guessing from product photos alone.
            </p>
          </div>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <Link
              href={signInHref}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3.5 text-sm font-bold text-white transition hover:bg-blue-700"
            >
              Open Style Explorer <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href={`/${locale}/face-shape-detector`}
              className="inline-flex items-center justify-center rounded-xl border border-blue-200 bg-white px-6 py-3.5 text-sm font-bold text-blue-700 transition hover:border-blue-300"
            >
              Check face shape first
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
