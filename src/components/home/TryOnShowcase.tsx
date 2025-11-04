'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface ShowcaseItem {
  image: string
  name: string
  description: string
}

const showcaseItems: ShowcaseItem[] = [
  {
    image: '/home/Alex-try-on-screen.png',
    name: 'Alex',
    description: 'Found the perfect aviator style in seconds',
  },
  {
    image: '/home/Ethan-try-on-screen.png',
    name: 'Ethan',
    description: 'Discovered his signature look with AI',
  },
  {
    image: '/home/Sophia-try-on-screen.png',
    name: 'Sophia',
    description: 'Tried 10+ styles before finding the one',
  },
]

export function TryOnShowcase() {
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
      <div className="relative bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 rounded-2xl shadow-2xl overflow-hidden">
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
                  alt={`${item.name}'s virtual try-on experience`}
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
            className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-800 rounded-full p-2 md:p-3 shadow-lg transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Previous showcase"
          >
            <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
          </button>
          <button
            onClick={goToNext}
            className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-800 rounded-full p-2 md:p-3 shadow-lg transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Next showcase"
          >
            <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
          </button>
        </div>

        {/* Bottom Info Bar */}
        <div className="bg-white/95 backdrop-blur-sm px-6 py-4 md:py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            {/* User Info */}
            <div className="text-center md:text-left">
              <h3 className="text-lg md:text-xl font-bold text-gray-900">
                {showcaseItems[currentIndex].name}
              </h3>
              <p className="text-sm md:text-base text-gray-600">
                {showcaseItems[currentIndex].description}
              </p>
            </div>

            {/* Dot Indicators */}
            <div className="flex items-center gap-2">
              {showcaseItems.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className={`transition-all duration-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                    index === currentIndex
                      ? 'w-8 md:w-10 h-2.5 md:h-3 bg-blue-600'
                      : 'w-2.5 md:w-3 h-2.5 md:h-3 bg-gray-300 hover:bg-gray-400'
                  }`}
                  aria-label={`Go to ${showcaseItems[index].name}'s showcase`}
                  aria-current={index === currentIndex}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Encouraging Text */}
      <div className="text-center mt-8 px-4">
        <p className="text-lg md:text-xl text-gray-700 font-medium mb-2">
          ✨ Join thousands who found their perfect glasses
        </p>
        <p className="text-sm md:text-base text-gray-600">
          Try on unlimited styles with AI-powered precision
        </p>
      </div>
    </div>
  )
}

