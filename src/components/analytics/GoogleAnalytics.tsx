'use client'

import Script from 'next/script'

interface GoogleAnalyticsProps {
  gaId: string
}

export function GoogleAnalytics({ gaId }: GoogleAnalyticsProps) {
  if (!gaId) {
    return null
  }

  return (
    <>
      <Script
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
      />
      <Script
        id="google-analytics"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${gaId}', {
              page_title: document.title,
              page_location: window.location.href,
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

// 声明全局gtag类型
declare global {
  interface Window {
    gtag: (
      command: 'config' | 'event',
      targetId: string,
      config?: Record<string, any>
    ) => void
  }
}
