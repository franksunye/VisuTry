/**
 * Performance Optimization Utilities for VisuTry
 * 
 * This module provides utilities for monitoring and optimizing Core Web Vitals:
 * - LCP (Largest Contentful Paint)
 * - FID (First Input Delay) 
 * - CLS (Cumulative Layout Shift)
 */

import { locales, defaultLocale } from '@/i18n'
export interface WebVitalsMetric {
  id: string
  name: string
  value: number
  rating: 'good' | 'needs-improvement' | 'poor'
  delta: number
  navigationType: string
}

/**
 * Report Web Vitals to analytics
 * Can be used with Google Analytics, Vercel Analytics, or custom analytics
 */
export function reportWebVitals(metric: WebVitalsMetric) {
  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Web Vitals] ${metric.name}:`, {
      value: metric.value,
      rating: metric.rating,
      delta: metric.delta,
    })
  }

  // Send to analytics in production
  if (process.env.NODE_ENV === 'production') {
    // Google Analytics 4
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', metric.name, {
        value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
        event_category: 'Web Vitals',
        event_label: metric.id,
        non_interaction: true,
      })
    }

    // Vercel Analytics (if enabled)
    if (typeof window !== 'undefined' && (window as any).va) {
      (window as any).va('event', {
        name: metric.name,
        data: {
          value: metric.value,
          rating: metric.rating,
        },
      })
    }
  }
}

/**
 * Get rating for a metric value
 */
export function getMetricRating(name: string, value: number): 'good' | 'needs-improvement' | 'poor' {
  const thresholds = {
    LCP: { good: 2500, poor: 4000 },
    FID: { good: 100, poor: 300 },
    CLS: { good: 0.1, poor: 0.25 },
    FCP: { good: 1800, poor: 3000 },
    TTFB: { good: 800, poor: 1800 },
    INP: { good: 200, poor: 500 },
  }

  const threshold = thresholds[name as keyof typeof thresholds]
  if (!threshold) return 'good'

  if (value <= threshold.good) return 'good'
  if (value <= threshold.poor) return 'needs-improvement'
  return 'poor'
}

/**
 * Preload critical resources
 */
export function preloadCriticalResources() {
  if (typeof window === 'undefined') return

  // Preload critical fonts
  const fontLinks = [
    { href: '/fonts/inter-var.woff2', type: 'font/woff2' },
  ]

  fontLinks.forEach(({ href, type }) => {
    const link = document.createElement('link')
    link.rel = 'preload'
    link.as = 'font'
    link.type = type
    link.href = href
    link.crossOrigin = 'anonymous'
    document.head.appendChild(link)
  })
}

/**
 * Lazy load images with Intersection Observer
 */
export function lazyLoadImages() {
  if (typeof window === 'undefined' || !('IntersectionObserver' in window)) return

  const imageObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target as HTMLImageElement
        if (img.dataset.src) {
          img.src = img.dataset.src
          img.removeAttribute('data-src')
          observer.unobserve(img)
        }
      }
    })
  })

  document.querySelectorAll('img[data-src]').forEach(img => {
    imageObserver.observe(img)
  })
}

/**
 * Optimize third-party scripts
 */
export function optimizeThirdPartyScripts() {
  if (typeof window === 'undefined') return

  // Defer non-critical scripts
  const scripts = document.querySelectorAll('script[data-defer]')
  scripts.forEach(script => {
    script.setAttribute('defer', '')
  })
}

/**
 * Monitor performance metrics
 */
export class PerformanceMonitor {
  private metrics: Map<string, number> = new Map()

  mark(name: string) {
    if (typeof window === 'undefined' || !window.performance) return
    window.performance.mark(name)
  }

  measure(name: string, startMark: string, endMark?: string) {
    if (typeof window === 'undefined' || !window.performance) return

    try {
      const measure = window.performance.measure(name, startMark, endMark)
      this.metrics.set(name, measure.duration)
      return measure.duration
    } catch (error) {
      console.warn(`Failed to measure ${name}:`, error)
      return 0
    }
  }

  getMetric(name: string): number | undefined {
    return this.metrics.get(name)
  }

  getAllMetrics(): Record<string, number> {
    return Object.fromEntries(this.metrics)
  }

  clear() {
    this.metrics.clear()
    if (typeof window !== 'undefined' && window.performance) {
      window.performance.clearMarks()
      window.performance.clearMeasures()
    }
  }
}

/**
 * Optimize images for Core Web Vitals
 */
export const imageOptimizationConfig = {
  // Sizes for responsive images
  sizes: {
    mobile: '100vw',
    tablet: '50vw',
    desktop: '33vw',
  },
  
  // Quality settings
  quality: {
    thumbnail: 75,
    standard: 85,
    high: 90,
  },
  
  // Formats
  formats: ['image/webp', 'image/avif'],
  
  // Loading strategies
  loading: {
    aboveFold: 'eager' as const,
    belowFold: 'lazy' as const,
  },
  
  // Priority settings
  priority: {
    hero: true,
    aboveFold: true,
    belowFold: false,
  },
}

/**
 * Calculate Cumulative Layout Shift (CLS)
 */
export function calculateCLS(): Promise<number> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
      resolve(0)
      return
    }

    let clsValue = 0
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!(entry as any).hadRecentInput) {
          clsValue += (entry as any).value
        }
      }
    })

    observer.observe({ type: 'layout-shift', buffered: true })

    // Resolve after 5 seconds
    setTimeout(() => {
      observer.disconnect()
      resolve(clsValue)
    }, 5000)
  })
}

/**
 * Prefetch critical routes
 */
export function prefetchCriticalRoutes() {
  if (typeof window === 'undefined') return

  const path = window.location.pathname
  const firstSeg = path.split('/')[1] || defaultLocale
  const currentLocale = (locales as readonly string[]).includes(firstSeg) ? firstSeg : defaultLocale

  const criticalRoutes = [
    `/${currentLocale}`,
    `/${currentLocale}/blog`,
    `/${currentLocale}/pricing`,
  ]

  criticalRoutes.forEach(route => {
    const link = document.createElement('link')
    link.rel = 'prefetch'
    link.href = route
    document.head.appendChild(link)
  })
}

/**
 * Performance optimization checklist
 */
export const performanceChecklist = {
  images: {
    lazyLoading: true,
    responsiveSizes: true,
    webpFormat: true,
    explicitDimensions: true,
    priorityLoading: true,
  },
  fonts: {
    preload: true,
    fontDisplay: 'swap',
    subsetting: true,
  },
  scripts: {
    defer: true,
    async: true,
    codesplitting: true,
  },
  css: {
    critical: true,
    minified: true,
    purged: true,
  },
  caching: {
    staticAssets: true,
    apiResponses: true,
    images: true,
  },
}

export default {
  reportWebVitals,
  getMetricRating,
  preloadCriticalResources,
  lazyLoadImages,
  optimizeThirdPartyScripts,
  PerformanceMonitor,
  imageOptimizationConfig,
  calculateCLS,
  prefetchCriticalRoutes,
  performanceChecklist,
}

