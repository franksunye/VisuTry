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
import { IMAGE_QUALITY } from '@/lib/image-utils'

interface OptimizedImageProps extends Omit<ImageProps, 'onLoad'> {
  aboveFold?: boolean
  showPlaceholder?: boolean
  blurDataURL?: string
  wrapperClassName?: string
}

function isProtectedMediaSrc(src: ImageProps['src']): boolean {
  return typeof src === 'string' && src.startsWith('/api/try-on/') && src.includes('/media/')
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
  const loading = aboveFold ? 'eager' : 'lazy'
  const priority = aboveFold
  const defaultSizes = props.sizes || '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'
  const unoptimized = props.unoptimized ?? isProtectedMediaSrc(props.src)

  const handleLoad = () => setIsLoading(false)
  const handleError = () => {
    setIsLoading(false)
    setHasError(true)
  }

  return (
    <div className={wrapperClassName || 'relative'}>
      {showPlaceholder && isLoading && !hasError && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse" />
      )}
      {hasError && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
          <span className="text-gray-400 text-sm">Failed to load image</span>
        </div>
      )}
      <Image
        {...props}
        alt={alt}
        className={className}
        loading={loading}
        priority={priority}
        sizes={defaultSizes}
        quality={85}
        unoptimized={unoptimized}
        onLoad={handleLoad}
        onError={handleError}
        placeholder={blurDataURL ? 'blur' : 'empty'}
        blurDataURL={blurDataURL}
      />
    </div>
  )
}

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
  const unoptimized = isProtectedMediaSrc(src)

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
    return (
      <>
        {isLoading && !hasError && (
          <div className="absolute inset-0 bg-gray-200 animate-pulse rounded-lg" />
        )}
        {hasError && (
          <div className="absolute inset-0 bg-gray-100 flex items-center justify-center rounded-lg">
            <span className="text-gray-400 text-sm">Failed to load image</span>
          </div>
        )}
        <Image
          src={src}
          alt={alt}
          fill
          className={className || 'object-contain'}
          loading={priority ? 'eager' : 'lazy'}
          priority={priority}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 80vw, 800px"
          quality={85}
          unoptimized={unoptimized}
          onLoad={handleLoad}
          onError={handleError}
        />
      </>
    )
  }

  return (
    <div className="relative">
      {isLoading && !hasError && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse rounded-lg" />
      )}
      {hasError && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center rounded-lg">
          <span className="text-gray-400 text-sm">Failed to load image</span>
        </div>
      )}
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
        unoptimized={unoptimized}
        onLoad={handleLoad}
        onError={handleError}
      />
    </div>
  )
}

export function TryOnThumbnail({
  src,
  alt = "Try-on result",
  priority = false,
  className,
  index = 0,
  size = 'large',
}: {
  src: string
  alt?: string
  priority?: boolean
  className?: string
  index?: number
  size?: 'small' | 'large'
}) {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const shouldPrioritize = priority || index < 3
  const unoptimized = isProtectedMediaSrc(src)
  const sizes = size === 'small'
    ? "(max-width: 640px) 90vw, (max-width: 768px) 45vw, (max-width: 1024px) 30vw, 320px"
    : "(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 480px"

  const handleLoad = () => setIsLoading(false)
  const handleError = () => {
    setIsLoading(false)
    setHasError(true)
  }

  return (
    <>
      {isLoading && !hasError && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse rounded-lg" />
      )}
      {hasError && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center rounded-lg">
          <span className="text-gray-400 text-xs">Failed to load</span>
        </div>
      )}
      <Image
        src={src}
        alt={alt}
        fill
        className={className || 'object-cover'}
        loading={shouldPrioritize ? 'eager' : 'lazy'}
        priority={shouldPrioritize}
        sizes={sizes}
        quality={IMAGE_QUALITY.HIGH}
        unoptimized={unoptimized}
        onLoad={handleLoad}
        onError={handleError}
      />
    </>
  )
}

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
