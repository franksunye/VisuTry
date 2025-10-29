'use client'

import Script from 'next/script'

interface GoogleTagManagerProps {
  gtmId: string
}

export function GoogleTagManager({ gtmId }: GoogleTagManagerProps) {
  if (!gtmId) {
    return null
  }

  return (
    <>
      {/* Google Tag Manager Script - Lazy loaded for better performance */}
      <Script
        id="google-tag-manager"
        strategy="lazyOnload"
        dangerouslySetInnerHTML={{
          __html: `
            (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
            'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','${gtmId}');
          `,
        }}
      />
      
      {/* Google Tag Manager NoScript */}
      <noscript>
        <iframe
          src={`https://www.googletagmanager.com/ns.html?id=${gtmId}`}
          height="0"
          width="0"
          style={{ display: 'none', visibility: 'hidden' }}
        />
      </noscript>
    </>
  )
}

// DataLayer 推送工具函数
export const pushToDataLayer = (data: Record<string, any>) => {
  if (typeof window !== 'undefined' && window.dataLayer) {
    window.dataLayer.push(data)
  }
}

// 自定义事件推送
export const pushCustomEvent = (eventName: string, parameters: Record<string, any> = {}) => {
  pushToDataLayer({
    event: eventName,
    ...parameters,
  })
}

// 电商事件追踪
export const pushEcommerceEvent = (
  eventName: 'purchase' | 'add_to_cart' | 'view_item' | 'begin_checkout',
  items: Array<{
    item_id: string
    item_name: string
    category?: string
    price?: number
    currency?: string
  }>,
  transactionId?: string,
  value?: number
) => {
  pushToDataLayer({
    event: eventName,
    ecommerce: {
      transaction_id: transactionId,
      value: value,
      currency: 'USD',
      items: items,
    },
  })
}

// 用户行为事件
export const pushUserEvent = (
  action: 'sign_up' | 'login' | 'logout' | 'profile_update',
  userId?: string,
  method?: string
) => {
  pushToDataLayer({
    event: 'user_action',
    user_action: action,
    user_id: userId,
    method: method,
  })
}

// 试戴相关事件
export const pushTryOnEvent = (
  action: 'start_try_on' | 'complete_try_on' | 'share_result',
  glassesId: string,
  glassesName: string,
  brand?: string
) => {
  pushToDataLayer({
    event: 'try_on_interaction',
    try_on_action: action,
    glasses_id: glassesId,
    glasses_name: glassesName,
    glasses_brand: brand,
  })
}

// 声明全局dataLayer类型
declare global {
  interface Window {
    dataLayer: Array<Record<string, any>>
  }
}
