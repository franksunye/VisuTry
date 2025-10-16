// SEO configuration and utility functions
import { Metadata } from 'next'

// Website basic information
export const SITE_CONFIG = {
  name: 'VisuTry',
  title: 'VisuTry - AI Virtual Glasses Try-On Tool',
  description: 'Experience virtual glasses try-on with AI technology. Find the perfect glasses style for your face shape. Try multiple brands online with intelligent recommendations.',
  url: process.env.NEXT_PUBLIC_SITE_URL || 'https://visutry.com',
  ogImage: '/og-image.jpg',
  keywords: [
    'virtual glasses try-on',
    'AI glasses',
    'online glasses fitting',
    'glasses try-on tool',
    'artificial intelligence',
    'face shape glasses',
    'virtual eyewear',
    'smart glasses recommendation'
  ],
  author: 'VisuTry Team',
  creator: 'VisuTry',
  publisher: 'VisuTry',
  locale: 'en-US',
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
  
  // Other meta tags
  metadataBase: new URL(SITE_CONFIG.url),
  alternates: {
    canonical: SITE_CONFIG.url,
  },
  
  // Verification tags (add when needed)
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
    yandex: process.env.YANDEX_VERIFICATION,
    yahoo: process.env.YAHOO_VERIFICATION,
  },

  // Robot instructions
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

// Utility function to generate page SEO configuration
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

// Structured data generator
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
          priceCurrency: data.currency || 'USD',
        },
        ...data,
      }
    
    default:
      return baseData
  }
}
