'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/utils/cn'

const compareSlides = [
  {
    name: 'Woman',
    label: 'Female portrait',
    image: '/assets/marketing/compare-slide-woman.png',
    frame: '4 preset frames',
    note: 'Rectangle, Browline, Wayfarer, and Geometric compared side by side.',
  },
  {
    name: 'Man',
    label: 'Male portrait',
    image: '/assets/marketing/compare-slide-man.png',
    frame: '4 preset frames',
    note: 'Same workflow on desktop and mobile with one clean comparison board.',
  },
]

export function CompareLandingSlides() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const currentSlide = compareSlides[currentIndex]

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setCurrentIndex((index) => (index + 1) % compareSlides.length)
    }, 4500)

    return () => window.clearInterval(intervalId)
  }, [])

  const goToPrevious = () => {
    setCurrentIndex((index) => (index === 0 ? compareSlides.length - 1 : index - 1))
  }

  const goToNext = () => {
    setCurrentIndex((index) => (index + 1) % compareSlides.length)
  }

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-lg border border-gray-200 bg-blue-50/60 shadow-xl">
      <div className="relative min-h-[280px] flex-1 bg-white lg:min-h-[360px]">
        {compareSlides.map((slide, index) => (
          <div
            key={slide.name}
            className={cn(
              'absolute inset-0 transition-opacity duration-700',
              index === currentIndex ? 'opacity-100' : 'opacity-0',
            )}
          >
            <Image
              src={slide.image}
              alt={`${slide.label} — VisuTry preset frame compare`}
              fill
              className="object-contain p-2 md:p-4"
              priority={index === 0}
              sizes="(max-width: 1024px) 100vw, 780px"
            />
          </div>
        ))}
        <button
          type="button"
          onClick={goToPrevious}
          className="absolute left-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-gray-700 shadow-sm hover:text-blue-600"
          aria-label="Previous compare preview"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={goToNext}
          className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-gray-700 shadow-sm hover:text-blue-600"
          aria-label="Next compare preview"
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
          {compareSlides.map((slide, index) => (
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
