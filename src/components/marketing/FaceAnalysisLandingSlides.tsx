'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/utils/cn'

const faceAnalysisSlides = [
  {
    name: 'Report',
    label: 'AI face shape report',
    image: '/assets/marketing/face-analysis-slide-report.png',
    frame: 'Landmark analysis',
    note: 'See face shape, confidence score, key features, and frame recommendations in one report.',
  },
  {
    name: 'Workflow',
    label: 'Full analysis workflow',
    image: '/assets/marketing/face-analysis-landing-art.jpg',
    frame: 'Frames to wear',
    note: 'From portrait upload to personalized frame picks and virtual try-on next steps.',
  },
]

export function FaceAnalysisLandingSlides() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const currentSlide = faceAnalysisSlides[currentIndex]

  useEffect(() => {
    const isNarrowScreen = window.matchMedia('(max-width: 639px)').matches
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (isNarrowScreen || prefersReducedMotion) return

    const intervalId = window.setInterval(() => {
      setCurrentIndex((index) => (index + 1) % faceAnalysisSlides.length)
    }, 4500)

    return () => window.clearInterval(intervalId)
  }, [])

  const goToPrevious = () => {
    setCurrentIndex((index) => (index === 0 ? faceAnalysisSlides.length - 1 : index - 1))
  }

  const goToNext = () => {
    setCurrentIndex((index) => (index + 1) % faceAnalysisSlides.length)
  }

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-lg border border-blue-100 bg-white shadow-lg md:shadow-xl">
      <div className="relative min-h-[240px] flex-1 bg-white sm:min-h-[300px] md:min-h-[380px]">
        <div key={currentSlide.name} className="absolute inset-0">
          <Image
            src={currentSlide.image}
            alt={`${currentSlide.label} — VisuTry AI face analysis for glasses`}
            fill
            className="object-contain p-2 md:p-3"
            priority={currentIndex === 0}
            sizes="(max-width: 639px) 100vw, (max-width: 1024px) 100vw, 720px"
          />
        </div>
        <button
          type="button"
          onClick={goToPrevious}
          className="absolute start-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-gray-700 shadow-sm hover:text-blue-600 sm:start-3 sm:h-9 sm:w-9"
          aria-label="Previous face analysis preview"
        >
          <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
        </button>
        <button
          type="button"
          onClick={goToNext}
          className="absolute end-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-gray-700 shadow-sm hover:text-blue-600 sm:end-3 sm:h-9 sm:w-9"
          aria-label="Next face analysis preview"
        >
          <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
        </button>
      </div>
      <div className="flex flex-col gap-2 border-t border-gray-200 bg-white px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:px-4 sm:py-4">
        <div>
          <p className="text-xs font-bold text-gray-950 sm:text-sm">
            {currentSlide.label} · {currentSlide.frame}
          </p>
          <p className="mt-1 text-xs leading-5 text-gray-600 sm:text-sm">{currentSlide.note}</p>
        </div>
        <div className="flex gap-2">
          {faceAnalysisSlides.map((slide, index) => (
            <button
              key={slide.name}
              type="button"
              onClick={() => setCurrentIndex(index)}
              className={cn(
                'h-2.5 rounded-full transition-all',
                index === currentIndex ? 'w-8 bg-blue-600' : 'w-2.5 bg-gray-300 hover:bg-gray-400',
              )}
              aria-label={`Show ${slide.label}`}
              aria-current={index === currentIndex}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
