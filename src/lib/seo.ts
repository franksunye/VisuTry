// SEO配置和工具函数
import { Metadata } from 'next'

// 网站基础信息
export const SITE_CONFIG = {
  name: 'VisuTry',
  title: 'VisuTry - AI虚拟眼镜试戴工具',
  description: '使用AI技术体验虚拟眼镜试戴，找到最适合你脸型的眼镜款式。支持多种品牌眼镜在线试戴，智能推荐最佳搭配。',
  url: process.env.NEXT_PUBLIC_SITE_URL || 'https://visutry.vercel.app',
  ogImage: '/og-image.jpg',
  keywords: [
    '虚拟眼镜试戴',
    'AI试戴',
    '在线试眼镜',
    '眼镜试戴工具',
    '人工智能',
    'virtual glasses try-on',
    'AI glasses',
    'online glasses fitting'
  ],
  author: 'VisuTry Team',
  creator: 'VisuTry',
  publisher: 'VisuTry',
  locale: 'zh-CN',
  alternateLocales: ['en-US'],
}

// 默认SEO配置
export const DEFAULT_SEO: Metadata = {
  title: {
    default: SITE_CONFIG.title,
    template: `%s | ${SITE_CONFIG.name}`
  },
  description: SITE_CONFIG.description,
  keywords: SITE_CONFIG.keywords,
  authors: [{ name: SITE_CONFIG.author }],
  creator: SITE_CONFIG.creator,
  publisher: SITE_CONFIG.publisher,
  
  // Open Graph
  openGraph: {
    type: 'website',
    locale: SITE_CONFIG.locale,
    url: SITE_CONFIG.url,
    title: SITE_CONFIG.title,
    description: SITE_CONFIG.description,
    siteName: SITE_CONFIG.name,
    images: [
      {
        url: SITE_CONFIG.ogImage,
        width: 1200,
        height: 630,
        alt: SITE_CONFIG.title,
      }
    ],
  },
  
  // Twitter
  twitter: {
    card: 'summary_large_image',
    title: SITE_CONFIG.title,
    description: SITE_CONFIG.description,
    images: [SITE_CONFIG.ogImage],
    creator: '@visutry',
  },
  
  // 图标
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '32x32', type: 'image/x-icon' },
      { url: '/favicon.svg', sizes: 'any', type: 'image/svg+xml' }
    ],
    apple: { url: '/favicon.svg', sizes: '180x180', type: 'image/svg+xml' }
  },
  
  // 其他meta标签
  metadataBase: new URL(SITE_CONFIG.url),
  alternates: {
    canonical: SITE_CONFIG.url,
    languages: {
      'zh-CN': SITE_CONFIG.url,
      'en-US': `${SITE_CONFIG.url}/en`,
    },
  },
  
  // 验证标签（需要时添加）
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
    yandex: process.env.YANDEX_VERIFICATION,
    yahoo: process.env.YAHOO_VERIFICATION,
  },
  
  // 机器人指令
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

// 生成页面SEO配置的工具函数
export function generateSEO({
  title,
  description,
  image,
  url,
  type = 'website',
  noIndex = false,
}: {
  title?: string
  description?: string
  image?: string
  url?: string
  type?: 'website' | 'article'
  noIndex?: boolean
}): Metadata {
  const seoTitle = title ? `${title} | ${SITE_CONFIG.name}` : SITE_CONFIG.title
  const seoDescription = description || SITE_CONFIG.description
  const seoImage = image || SITE_CONFIG.ogImage
  const seoUrl = url ? `${SITE_CONFIG.url}${url}` : SITE_CONFIG.url

  return {
    title: seoTitle,
    description: seoDescription,
    
    openGraph: {
      type,
      url: seoUrl,
      title: seoTitle,
      description: seoDescription,
      images: [
        {
          url: seoImage,
          width: 1200,
          height: 630,
          alt: seoTitle,
        }
      ],
      siteName: SITE_CONFIG.name,
    },
    
    twitter: {
      card: 'summary_large_image',
      title: seoTitle,
      description: seoDescription,
      images: [seoImage],
    },
    
    alternates: {
      canonical: seoUrl,
    },
    
    robots: noIndex ? {
      index: false,
      follow: false,
    } : {
      index: true,
      follow: true,
    },
  }
}

// 结构化数据生成器
export function generateStructuredData(type: 'website' | 'article' | 'product', data: any) {
  const baseData = {
    '@context': 'https://schema.org',
    '@type': type,
  }

  switch (type) {
    case 'website':
      return {
        ...baseData,
        name: SITE_CONFIG.name,
        url: SITE_CONFIG.url,
        description: SITE_CONFIG.description,
        publisher: {
          '@type': 'Organization',
          name: SITE_CONFIG.name,
          logo: {
            '@type': 'ImageObject',
            url: `${SITE_CONFIG.url}/logo.png`,
          },
        },
        ...data,
      }
    
    case 'article':
      return {
        ...baseData,
        headline: data.title,
        description: data.description,
        image: data.image,
        datePublished: data.publishedAt,
        dateModified: data.modifiedAt,
        author: {
          '@type': 'Person',
          name: data.author || SITE_CONFIG.author,
        },
        publisher: {
          '@type': 'Organization',
          name: SITE_CONFIG.name,
          logo: {
            '@type': 'ImageObject',
            url: `${SITE_CONFIG.url}/logo.png`,
          },
        },
        ...data,
      }
    
    case 'product':
      return {
        ...baseData,
        name: data.name,
        description: data.description,
        image: data.image,
        brand: {
          '@type': 'Brand',
          name: data.brand,
        },
        offers: {
          '@type': 'Offer',
          availability: 'https://schema.org/InStock',
          price: data.price,
          priceCurrency: data.currency || 'CNY',
        },
        ...data,
      }
    
    default:
      return baseData
  }
}
