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
    <div className="flex h-full flex-col overflow-hidden rounded-lg border border-blue-100 bg-white shadow-xl">
      <div className="relative min-h-[300px] flex-1 bg-white md:min-h-[380px]">
        {faceAnalysisSlides.map((slide, index) => (
          <div
            key={slide.name}
            className={cn(
              'absolute inset-0 transition-opacity duration-700',
              index === currentIndex ? 'opacity-100' : 'opacity-0',
            )}
          >
            <Image
              src={slide.image}
              alt={`${slide.label} — VisuTry AI face analysis for glasses`}
              fill
              className="object-contain p-2 md:p-3"
              priority={index === 0}
              sizes="(max-width: 1024px) 100vw, 720px"
            />
          </div>
        ))}
        <button
          type="button"
          onClick={goToPrevious}
          className="absolute left-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-gray-700 shadow-sm hover:text-blue-600"
          aria-label="Previous face analysis preview"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={goToNext}
          className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-gray-700 shadow-sm hover:text-blue-600"
          aria-label="Next face analysis preview"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
      <div className="flex flex-col gap-3 border-t border-gray-200 bg-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-bold text-gray-950">
            {currentSlide.label} · {currentSlide.frame}
          </p>
          <p className="mt-1 text-sm text-gray-600">{currentSlide.note}</p>
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
