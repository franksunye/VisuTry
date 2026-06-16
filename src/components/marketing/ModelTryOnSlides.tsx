'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, ChevronLeft, ChevronRight, Grid2X2, ScanFace, Sparkles } from 'lucide-react'
import { cn } from '@/utils/cn'

type ShowcaseMode = 'home' | 'glasses' | 'compare' | 'face'

interface ShowcaseSlide {
  name: string
  image: string
  frame: string
  note: string
}

interface ModelTryOnSlidesProps {
  locale: string
  mode?: ShowcaseMode
  compact?: boolean
}

const tryOnSlides: ShowcaseSlide[] = [
  {
    name: 'Sophia',
    image: '/home/Sophia-try-on-glasses-screen.png',
    frame: 'Soft rectangle',
    note: 'Checks frame scale, color, and smile fit in one visual pass.',
  },
  {
    name: 'Ethan',
    image: '/home/Ethan-try-on-glasses-screen.png',
    frame: 'Tortoise rectangle',
    note: 'Compares a confident everyday frame before buying online.',
  },
]

const compareSlides: ShowcaseSlide[] = [
  {
    name: 'Female portrait',
    image: '/assets/marketing/compare-slide-woman.png',
    frame: '4 preset frames',
    note: 'Rectangle, Browline, Wayfarer, and Geometric compared side by side.',
  },
  {
    name: 'Male portrait',
    image: '/assets/marketing/compare-slide-man.png',
    frame: '4 preset frames',
    note: 'Same workflow on desktop and mobile with one clean comparison board.',
  },
]

const slidesByMode: Record<ShowcaseMode, ShowcaseSlide[]> = {
  home: [...tryOnSlides, ...compareSlides],
  glasses: tryOnSlides,
  compare: compareSlides,
  face: tryOnSlides,
}

const modeContent: Record<ShowcaseMode, {
  eyebrow: string
  title: string
  description: string
  ctaLabel: string
  ctaHref: (locale: string) => string
  secondaryLabel: string
  secondaryHref: (locale: string) => string
}> = {
  home: {
    eyebrow: 'AI glasses workflow',
    title: 'Analyze, try on, and compare glasses from one photo',
    description: 'Use Face for direction, Glasses for custom product images, and Compare for fast side-by-side frame decisions.',
    ctaLabel: 'Start with Face',
    ctaHref: (locale) => `/${locale}/face-analysis`,
    secondaryLabel: 'Compare frames',
    secondaryHref: (locale) => `/${locale}/try-on/glasses/compare`,
  },
  glasses: {
    eyebrow: 'Virtual glasses try-on',
    title: 'Try glasses from product photos or screenshots',
    description: 'Upload a portrait and a frame image. VisuTry creates a browser-based preview that helps you judge shape, scale, and style.',
    ctaLabel: 'Start glasses try-on',
    ctaHref: (locale) => `/${locale}/try-on/glasses`,
    secondaryLabel: 'Compare presets',
    secondaryHref: (locale) => `/${locale}/try-on/glasses/compare`,
  },
  compare: {
    eyebrow: 'Quick frame compare',
    title: 'Pick preset frames and compare them side by side',
    description: 'Choose up to four built-in frame presets and generate a clean comparison board from the same portrait.',
    ctaLabel: 'Start comparing',
    ctaHref: (locale) => `/${locale}/try-on/glasses/compare`,
    secondaryLabel: 'Try custom glasses',
    secondaryHref: (locale) => `/${locale}/try-on/glasses`,
  },
  face: {
    eyebrow: 'Face analysis for glasses',
    title: 'Find frame directions before you start trying glasses',
    description: 'Get face-shape guidance, recommended frame styles, and a clearer shortlist before spending credits on try-on images.',
    ctaLabel: 'Analyze my face',
    ctaHref: (locale) => `/${locale}/face-analysis`,
    secondaryLabel: 'Try glasses',
    secondaryHref: (locale) => `/${locale}/try-on/glasses`,
  },
}

const modeSteps: Record<ShowcaseMode, Array<{ icon: typeof ScanFace; label: string }>> = {
  home: [
    { icon: ScanFace, label: 'Face guidance' },
    { icon: Sparkles, label: 'Custom try-on' },
    { icon: Grid2X2, label: 'Side-by-side compare' },
  ],
  glasses: [
    { icon: Sparkles, label: 'Upload product image' },
    { icon: ScanFace, label: 'AI fits the frame' },
    { icon: Grid2X2, label: 'Save to history' },
  ],
  compare: [
    { icon: Grid2X2, label: 'Choose presets' },
    { icon: Sparkles, label: 'Generate each frame' },
    { icon: ScanFace, label: 'Review in one board' },
  ],
  face: [
    { icon: ScanFace, label: 'Detect face shape' },
    { icon: Grid2X2, label: 'Shortlist frame styles' },
    { icon: Sparkles, label: 'Continue to try-on' },
  ],
}

export function ModelTryOnSlides({ locale, mode = 'home', compact = false }: ModelTryOnSlidesProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const content = modeContent[mode]
  const steps = modeSteps[mode]
  const slides = useMemo(() => slidesByMode[mode], [mode])
  const currentSlide = slides[currentIndex]

  useEffect(() => {
    setCurrentIndex(0)
  }, [mode])

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setCurrentIndex((index) => (index + 1) % slides.length)
    }, 4500)

    return () => window.clearInterval(intervalId)
  }, [slides.length])

  const heroClassName = useMemo(
    () => cn(
      'grid gap-7 rounded-lg border border-gray-200 bg-white p-5 shadow-sm lg:grid-cols-[0.9fr_1.1fr] lg:items-center',
      compact ? 'lg:p-6' : 'lg:p-8',
    ),
    [compact],
  )

  const goToPrevious = () => {
    setCurrentIndex((index) => (index === 0 ? slides.length - 1 : index - 1))
  }

  const goToNext = () => {
    setCurrentIndex((index) => (index + 1) % slides.length)
  }

  return (
    <section className={heroClassName}>
      <div>
        <p className="mb-3 inline-flex items-center rounded-lg border border-blue-200 bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700">
          {content.eyebrow}
        </p>
        <h2 className={cn('font-bold leading-tight text-gray-950', compact ? 'text-2xl md:text-3xl' : 'text-3xl md:text-4xl')}>
          {content.title}
        </h2>
        <p className="mt-4 max-w-xl text-base leading-7 text-gray-600">
          {content.description}
        </p>
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {steps.map((step) => {
            const Icon = step.icon
            return (
              <div key={step.label} className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                <Icon className="mb-2 h-4 w-4 text-blue-600" />
                <p className="text-sm font-semibold text-gray-800">{step.label}</p>
              </div>
            )
          })}
        </div>
        <div className="mt-7 flex flex-col gap-3 sm:flex-row">
          <Link
            href={content.ctaHref(locale)}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-sm hover:bg-blue-700"
          >
            {content.ctaLabel}
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href={content.secondaryHref(locale)}
            className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-5 py-3 text-sm font-bold text-gray-700 hover:border-blue-300 hover:text-blue-700"
          >
            {content.secondaryLabel}
          </Link>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-blue-50/60">
        <div className="relative aspect-[16/10] bg-white">
          {slides.map((slide, index) => (
            <div
              key={slide.name}
              className={cn(
                'absolute inset-0 transition-all duration-700',
                index === currentIndex ? 'opacity-100' : 'opacity-0',
              )}
            >
              <Image
                src={slide.image}
                alt={`${slide.name} using VisuTry ${mode} workflow`}
                fill
                className="object-contain p-3 md:p-5"
                priority={index === 0}
                sizes="(max-width: 768px) 100vw, 640px"
              />
            </div>
          ))}
          <button
            type="button"
            onClick={goToPrevious}
            className="absolute left-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-gray-700 shadow-sm hover:text-blue-600"
            aria-label="Previous slide"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={goToNext}
            className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-gray-700 shadow-sm hover:text-blue-600"
            aria-label="Next slide"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
        <div className="flex flex-col gap-3 border-t border-gray-200 bg-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-bold text-gray-950">
              {currentSlide.name} · {currentSlide.frame}
            </p>
            <p className="mt-1 text-sm text-gray-600">{currentSlide.note}</p>
          </div>
          <div className="flex gap-2">
            {slides.map((slide, index) => (
              <button
                key={slide.name}
                type="button"
                onClick={() => setCurrentIndex(index)}
                className={cn(
                  'h-2.5 rounded-full transition-all',
                  index === currentIndex ? 'w-8 bg-blue-600' : 'w-2.5 bg-gray-300 hover:bg-gray-400',
                )}
                aria-label={`Show ${slide.name}`}
                aria-current={index === currentIndex}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
