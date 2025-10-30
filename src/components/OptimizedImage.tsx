"use client"

/**
 * OptimizedImage Component
 *
 * A wrapper around Next.js Image component with built-in performance optimizations:
 * - Automatic lazy loading for below-fold images
 * - Priority loading for above-fold images
 * - Responsive sizes
 * - WebP format support
 * - Explicit dimensions to prevent CLS
 */

import Image, { ImageProps } from 'next/image'
import { useState } from 'react'

interface OptimizedImageProps extends Omit<ImageProps, 'onLoad'> {
  /**
   * Whether this image is above the fold (visible on initial page load)
   * Above-fold images will be loaded with priority
   */
  aboveFold?: boolean
  
  /**
   * Custom loading placeholder
   */
  showPlaceholder?: boolean
  
  /**
   * Blur data URL for placeholder
   */
  blurDataURL?: string
  
  /**
   * Custom className for the wrapper div
   */
  wrapperClassName?: string
}

export default function OptimizedImage({
  aboveFold = false,
  showPlaceholder = true,
  blurDataURL,
  wrapperClassName,
  className,
  alt,
  ...props
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  // Determine loading strategy
  const loading = aboveFold ? 'eager' : 'lazy'
  const priority = aboveFold

  // Default sizes for responsive images
  const defaultSizes = props.sizes || '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'

  const handleLoad = () => {
    setIsLoading(false)
  }

  const handleError = () => {
    setIsLoading(false)
    setHasError(true)
  }

  return (
    <div className={wrapperClassName || 'relative'}>
      {/* Loading placeholder */}
      {showPlaceholder && isLoading && !hasError && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse" />
      )}

      {/* Error state */}
      {hasError && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
          <span className="text-gray-400 text-sm">Failed to load image</span>
        </div>
      )}

      {/* Optimized image */}
      <Image
        {...props}
        alt={alt}
        className={className}
        loading={loading}
        priority={priority}
        sizes={defaultSizes}
        quality={85}
        onLoad={handleLoad}
        onError={handleError}
        placeholder={blurDataURL ? 'blur' : 'empty'}
        blurDataURL={blurDataURL}
      />
    </div>
  )
}

/**
 * Blog thumbnail image with optimized settings
 */
export function BlogThumbnail({
  src,
  alt,
  priority = false,
  className,
}: {
  src: string
  alt: string
  priority?: boolean
  className?: string
}) {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      fill
      aboveFold={priority}
      className={className || 'object-cover'}
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
    />
  )
}

/**
 * Hero image with priority loading
 */
export function HeroImage({
  src,
  alt,
  width,
  height,
  className,
}: {
  src: string
  alt: string
  width: number
  height: number
  className?: string
}) {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={width}
      height={height}
      aboveFold={true}
      className={className}
      sizes="100vw"
      quality={90}
    />
  )
}

/**
 * Try-On result image with high quality
 * Used for displaying AI try-on results in result pages and share pages
 *
 * @param useFill - If true, uses fill layout (for fixed aspect ratio containers like share page)
 *                  If false, uses responsive layout (for auto-height containers like try-on page)
 */
export function TryOnResultImage({
  src,
  alt = "AI Try-On Result",
  priority = true,
  className,
  onLoad,
  onError,
  useFill = false,
  width = 800,
  height = 800,
}: {
  src: string
  alt?: string
  priority?: boolean
  className?: string
  onLoad?: () => void
  onError?: () => void
  useFill?: boolean
  width?: number
  height?: number
}) {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  const handleLoad = () => {
    setIsLoading(false)
    onLoad?.()
  }

  const handleError = () => {
    setIsLoading(false)
    setHasError(true)
    onError?.()
  }

  if (useFill) {
    // Fill layout for fixed aspect ratio containers (share page)
    return (
      <>
        {/* Loading placeholder */}
        {isLoading && !hasError && (
          <div className="absolute inset-0 bg-gray-200 animate-pulse rounded-lg" />
        )}

        {/* Error state */}
        {hasError && (
          <div className="absolute inset-0 bg-gray-100 flex items-center justify-center rounded-lg">
            <span className="text-gray-400 text-sm">Failed to load image</span>
          </div>
        )}

        {/* Optimized image */}
        <Image
          src={src}
          alt={alt}
          fill
          className={className || 'object-contain'}
          loading={priority ? 'eager' : 'lazy'}
          priority={priority}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 80vw, 800px"
          quality={85}
          onLoad={handleLoad}
          onError={handleError}
        />
      </>
    )
  }

  // Responsive layout for auto-height containers (try-on page)
  return (
    <div className="relative">
      {/* Loading placeholder */}
      {isLoading && !hasError && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse rounded-lg" />
      )}

      {/* Error state */}
      {hasError && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center rounded-lg">
          <span className="text-gray-400 text-sm">Failed to load image</span>
        </div>
      )}

      {/* Optimized image */}
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        className={className || 'w-full h-auto object-contain'}
        loading={priority ? 'eager' : 'lazy'}
        priority={priority}
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 80vw, 800px"
        quality={85}
        onLoad={handleLoad}
        onError={handleError}
      />
    </div>
  )
}

/**
 * Try-On thumbnail image for lists and galleries
 * Optimized for performance with lower quality and lazy loading
 */
export function TryOnThumbnail({
  src,
  alt = "Try-on result",
  priority = false,
  className,
  index = 0,
}: {
  src: string
  alt?: string
  priority?: boolean
  className?: string
  index?: number
}) {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  // First 3 images get priority loading
  const shouldPrioritize = priority || index < 3

  const handleLoad = () => {
    setIsLoading(false)
  }

  const handleError = () => {
    setIsLoading(false)
    setHasError(true)
  }

  return (
    <>
      {/* Loading placeholder */}
      {isLoading && !hasError && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse rounded-lg" />
      )}

      {/* Error state */}
      {hasError && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center rounded-lg">
          <span className="text-gray-400 text-xs">Failed to load</span>
        </div>
      )}

      {/* Optimized image */}
      <Image
        src={src}
        alt={alt}
        fill
        className={className || 'object-cover'}
        loading={shouldPrioritize ? 'eager' : 'lazy'}
        priority={shouldPrioritize}
        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 300px"
        quality={40}
        onLoad={handleLoad}
        onError={handleError}
      />
    </>
  )
}

/**
 * Avatar image with fixed dimensions
 */
export function AvatarImage({
  src,
  alt,
  size = 40,
  className,
}: {
  src: string
  alt: string
  size?: number
  className?: string
}) {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={size}
      height={size}
      aboveFold={false}
      className={className || 'rounded-full'}
      sizes={`${size}px`}
    />
  )
}

