'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, ChevronLeft, ChevronRight, Grid2X2, ScanFace, Sparkles } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { cn } from '@/utils/cn'

type ShowcaseMode = 'home' | 'glasses' | 'compare' | 'face'

interface ShowcaseSlide {
  nameKey: string
  image: string
  frameKey: string
  noteKey: string
}

interface ModelTryOnSlidesProps {
  locale: string
  mode?: ShowcaseMode
  compact?: boolean
  preloadFirstImage?: boolean
}

const tryOnSlides: ShowcaseSlide[] = [
  {
    nameKey: 'slides.sophiaName',
    image: '/home/Sophia-try-on-glasses-screen.jpg',
    frameKey: 'slides.sophiaFrame',
    noteKey: 'slides.sophiaNote',
  },
  {
    nameKey: 'slides.ethanName',
    image: '/home/Ethan-try-on-glasses-screen.jpg',
    frameKey: 'slides.ethanFrame',
    noteKey: 'slides.ethanNote',
  },
]

const compareSlides: ShowcaseSlide[] = [
  {
    nameKey: 'slides.femaleName',
    image: '/assets/marketing/compare-slide-woman.png',
    frameKey: 'slides.femaleFrame',
    noteKey: 'slides.femaleNote',
  },
  {
    nameKey: 'slides.maleName',
    image: '/assets/marketing/compare-slide-man.png',
    frameKey: 'slides.maleFrame',
    noteKey: 'slides.maleNote',
  },
]

const slidesByMode: Record<ShowcaseMode, ShowcaseSlide[]> = {
  home: [...tryOnSlides, ...compareSlides],
  glasses: tryOnSlides,
  compare: compareSlides,
  face: tryOnSlides,
}

const modeSteps: Record<ShowcaseMode, Array<{ icon: typeof ScanFace; key: string }>> = {
  home: [
    { icon: ScanFace, key: 'modes.home.step1' },
    { icon: Sparkles, key: 'modes.home.step2' },
    { icon: Grid2X2, key: 'modes.home.step3' },
  ],
  glasses: [
    { icon: Sparkles, key: 'modes.glasses.step1' },
    { icon: ScanFace, key: 'modes.glasses.step2' },
    { icon: Grid2X2, key: 'modes.glasses.step3' },
  ],
  compare: [
    { icon: Grid2X2, key: 'modes.compare.step1' },
    { icon: Sparkles, key: 'modes.compare.step2' },
    { icon: ScanFace, key: 'modes.compare.step3' },
  ],
  face: [
    { icon: ScanFace, key: 'modes.face.step1' },
    { icon: Grid2X2, key: 'modes.face.step2' },
    { icon: Sparkles, key: 'modes.face.step3' },
  ],
}

export function ModelTryOnSlides({
  locale,
  mode = 'home',
  compact = false,
  preloadFirstImage = true,
}: ModelTryOnSlidesProps) {
  const t = useTranslations('marketing.modelTryOnSlides')
  const [currentIndex, setCurrentIndex] = useState(0)
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
          {t(`modes.${mode}.eyebrow`)}
        </p>
        <h2 className={cn('font-bold leading-tight text-gray-950', compact ? 'text-2xl md:text-3xl' : 'text-3xl md:text-4xl')}>
          {t(`modes.${mode}.title`)}
        </h2>
        <p className="mt-4 max-w-xl text-base leading-7 text-gray-600">
          {t(`modes.${mode}.description`)}
        </p>
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {steps.map((step) => {
            const Icon = step.icon
            return (
              <div key={step.key} className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                <Icon className="mb-2 h-4 w-4 text-blue-600" />
                <p className="text-sm font-semibold text-gray-800">{t(step.key)}</p>
              </div>
            )
          })}
        </div>
        <div className="mt-7 flex flex-col gap-3 sm:flex-row">
          <Link
            href={{
              home: `/${locale}/face-analysis`,
              glasses: `/${locale}/try-on/glasses`,
              compare: `/${locale}/try-on/glasses/compare`,
              face: `/${locale}/face-analysis`,
            }[mode]}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-sm hover:bg-blue-700"
          >
            {t(`modes.${mode}.ctaLabel`)}
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href={{
              home: `/${locale}/try-on/glasses/compare`,
              glasses: `/${locale}/try-on/glasses/compare`,
              compare: `/${locale}/try-on/glasses`,
              face: `/${locale}/try-on/glasses`,
            }[mode]}
            className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-5 py-3 text-sm font-bold text-gray-700 hover:border-blue-300 hover:text-blue-700"
          >
            {t(`modes.${mode}.secondaryLabel`)}
          </Link>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-blue-50/60">
        <div className="relative aspect-[16/10] bg-white">
          {slides.map((slide, index) => (
            <div
              key={slide.nameKey}
              className={cn(
                'absolute inset-0 transition-all duration-700',
                index === currentIndex ? 'opacity-100' : 'opacity-0',
              )}
            >
              <Image
                src={slide.image}
                alt={t('a11y.alt', { name: t(slide.nameKey), mode })}
                fill
                className="object-contain p-3 md:p-5"
                priority={preloadFirstImage && index === 0}
                sizes="(max-width: 768px) 100vw, 640px"
              />
            </div>
          ))}
          <button
            type="button"
            onClick={goToPrevious}
            className="absolute left-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-gray-700 shadow-sm hover:text-blue-600"
            aria-label={t('a11y.previous')}
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={goToNext}
            className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-gray-700 shadow-sm hover:text-blue-600"
            aria-label={t('a11y.next')}
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
        <div className="flex flex-col gap-3 border-t border-gray-200 bg-white px-4 py-4 sm:min-h-[108px] sm:flex-row sm:items-center sm:justify-between">
          <div className="sm:min-h-[56px]">
            <p className="text-sm font-bold text-gray-950">
              {t(currentSlide.nameKey)} · {t(currentSlide.frameKey)}
            </p>
            <p className="mt-1 text-sm text-gray-600">{t(currentSlide.noteKey)}</p>
          </div>
          <div className="flex gap-2">
            {slides.map((slide, index) => (
              <button
                key={slide.nameKey}
                type="button"
                onClick={() => setCurrentIndex(index)}
                className={cn(
                  'h-2.5 rounded-full transition-all',
                  index === currentIndex ? 'w-8 bg-blue-600' : 'w-2.5 bg-gray-300 hover:bg-gray-400',
                )}
                aria-label={t('a11y.show', { name: t(slide.nameKey) })}
                aria-current={index === currentIndex}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
