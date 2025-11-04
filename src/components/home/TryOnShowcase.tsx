'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useTranslations } from 'next-intl'

interface ShowcaseItem {
  image: string
  nameKey: string
  descriptionKey: string
}

const showcaseItems: ShowcaseItem[] = [
  {
    image: '/home/Alex-try-on-screen.png',
    nameKey: 'alex.name',
    descriptionKey: 'alex.description',
  },
  {
    image: '/home/Ethan-try-on-screen.png',
    nameKey: 'ethan.name',
    descriptionKey: 'ethan.description',
  },
  {
    image: '/home/Sophia-try-on-screen.png',
    nameKey: 'sophia.name',
    descriptionKey: 'sophia.description',
  },
]

export function TryOnShowcase() {
  const t = useTranslations('home.showcase')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)

  // Auto-play functionality
  useEffect(() => {
    if (!isAutoPlaying) return

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % showcaseItems.length)
    }, 4000) // Change slide every 4 seconds

    return () => clearInterval(interval)
  }, [isAutoPlaying])

  const goToSlide = (index: number) => {
    setCurrentIndex(index)
    setIsAutoPlaying(false) // Pause auto-play when user manually navigates
    // Resume auto-play after 10 seconds
    setTimeout(() => setIsAutoPlaying(true), 10000)
  }

  const goToPrevious = () => {
    const newIndex = currentIndex === 0 ? showcaseItems.length - 1 : currentIndex - 1
    goToSlide(newIndex)
  }

  const goToNext = () => {
    const newIndex = (currentIndex + 1) % showcaseItems.length
    goToSlide(newIndex)
  }

  return (
    <div className="w-full max-w-5xl mx-auto mb-12">
      {/* Showcase Container */}
      <div className="relative overflow-hidden shadow-2xl bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 rounded-2xl">
        {/* Main Image Display */}
        <div className="relative aspect-[16/10] md:aspect-[16/9] overflow-hidden">
          {showcaseItems.map((item, index) => (
            <div
              key={index}
              className={`absolute inset-0 transition-all duration-700 ease-in-out ${
                index === currentIndex
                  ? 'opacity-100 translate-x-0'
                  : index < currentIndex
                  ? 'opacity-0 -translate-x-full'
                  : 'opacity-0 translate-x-full'
              }`}
            >
              <div className="relative w-full h-full">
                <Image
                  src={item.image}
                  alt={`${t(item.nameKey)}'s virtual try-on experience`}
                  fill
                  className="object-contain p-4 md:p-8"
                  priority={index === 0}
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
                />
              </div>
            </div>
          ))}

          {/* Navigation Arrows */}
          <button
            onClick={goToPrevious}
            className="absolute p-2 text-gray-800 transition-all -translate-y-1/2 rounded-full shadow-lg left-2 md:left-4 top-1/2 bg-white/90 hover:bg-white md:p-3 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Previous showcase"
          >
            <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
          </button>
          <button
            onClick={goToNext}
            className="absolute p-2 text-gray-800 transition-all -translate-y-1/2 rounded-full shadow-lg right-2 md:right-4 top-1/2 bg-white/90 hover:bg-white md:p-3 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Next showcase"
          >
            <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
          </button>
        </div>

        {/* Bottom Info Bar */}
        <div className="px-6 py-4 bg-white/95 backdrop-blur-sm md:py-6">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            {/* User Info */}
            <div className="text-center md:text-left">
              <h3 className="text-lg font-bold text-gray-900 md:text-xl">
                {t(showcaseItems[currentIndex].nameKey)}
              </h3>
              <p className="text-sm text-gray-600 md:text-base">
                {t(showcaseItems[currentIndex].descriptionKey)}
              </p>
            </div>

            {/* Dot Indicators */}
            <div className="flex items-center gap-2">
              {showcaseItems.map((item, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className={`transition-all duration-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                    index === currentIndex
                      ? 'w-8 md:w-10 h-2.5 md:h-3 bg-blue-600'
                      : 'w-2.5 md:w-3 h-2.5 md:h-3 bg-gray-300 hover:bg-gray-400'
                  }`}
                  aria-label={`Go to ${t(item.nameKey)}'s showcase`}
                  aria-current={index === currentIndex}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Encouraging Text */}
      <div className="px-4 mt-8 text-center">
        <p className="mb-2 text-lg font-medium text-gray-700 md:text-xl">
          {t('encouragement.title')}
        </p>
        <p className="text-sm text-gray-600 md:text-base">
          {t('encouragement.subtitle')}
        </p>
      </div>
    </div>
  )
}

