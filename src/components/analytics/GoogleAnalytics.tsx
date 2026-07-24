'use client'

import Script from 'next/script'
import { useEffect } from 'react'
import { setLanguageUserProperties } from '@/lib/analytics'

interface GoogleAnalyticsProps {
  gaId: string
  locale?: string
}

export function GoogleAnalytics({ gaId, locale }: GoogleAnalyticsProps) {
  // Set language user properties after gtag loads and on locale changes.
  // The inline script below handles the initial load;
  // this useEffect re-syncs user_properties when the user switches locale
  // (e.g. navigating from /en to /ar), keeping audience segmentation accurate.
  useEffect(() => {
    if (!gaId) return
    setLanguageUserProperties()
  }, [gaId, locale])

  if (!gaId) {
    return null
  }

  return (
    <>
      {/* Google Analytics - Lazy loaded for better performance */}
      <Script
        strategy="lazyOnload"
        src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
      />
      <Script
        id="google-analytics"
        strategy="lazyOnload"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${gaId}', {
              page_title: document.title,
              page_location: window.location.href,
            });
            // Set language user properties for audience segmentation
            gtag('set', 'user_properties', {
              landing_locale: document.documentElement.lang || 'en',
              browser_language: navigator.language || 'en',
            });
          `,
        }}
      />
    </>
  )
}

// 事件追踪工具函数
export const trackEvent = (
  action: string,
  category: string,
  label?: string,
  value?: number
) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    })
  }
}

// 页面浏览追踪
export const trackPageView = (url: string, title?: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    const gaId = process.env.NEXT_PUBLIC_GA_ID
    if (gaId) {
      window.gtag('config', gaId, {
        page_title: title,
        page_location: url,
      })
    }
  }
}

// 试戴事件追踪
export const trackTryOnEvent = (glassesId: string, glassesName: string) => {
  trackEvent('try_on_glasses', 'engagement', `${glassesId}-${glassesName}`)
}

// 上传照片事件追踪
export const trackPhotoUpload = (source: 'camera' | 'file') => {
  trackEvent('upload_photo', 'engagement', source)
}

// 分享事件追踪
export const trackShare = (platform: string, contentType: string) => {
  trackEvent('share', 'social', `${platform}-${contentType}`)
}

// 注册事件追踪
export const trackSignUp = (method: string) => {
  trackEvent('sign_up', 'user', method)
}

// 登录事件追踪
export const trackSignIn = (method: string) => {
  trackEvent('login', 'user', method)
}
