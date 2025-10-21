// SEO configuration and utility functions
import { Metadata } from 'next'

/**
 * Keyword Categories for SEO Optimization
 * Organized by intent and conversion potential
 */
export const KEYWORDS = {
  // Core tool keywords (high conversion intent)
  core: [
    'virtual glasses try-on',
    'AI glasses try-on',
    'online glasses fitting',
    'virtual eyewear try-on',
    'glasses try-on tool',
  ],

  // Feature-based keywords
  features: [
    'face shape glasses matcher',
    'smart glasses recommendation',
    'AI-powered eyewear fitting',
    'virtual frame fitting',
    'online optical try-on',
  ],

  // Long-tail keywords (traffic generation)
  longTail: [
    'best glasses for round face',
    'how to choose glasses online',
    'prescription glasses virtual try-on',
    'try on glasses before buying',
    'virtual glasses fitting app',
    'online eyewear shopping tool',
  ],

  // Brand-related keywords
  brands: [
    'Ray-Ban virtual try-on',
    'designer glasses online',
    'premium eyewear try-on',
    'luxury glasses virtual fitting',
  ],

  // Problem-solving keywords
  problemSolving: [
    'find perfect glasses online',
    'glasses shopping made easy',
    'try glasses without visiting store',
  ],
}

// Flatten all keywords for meta tags
const ALL_KEYWORDS = [
  ...KEYWORDS.core,
  ...KEYWORDS.features,
  ...KEYWORDS.longTail,
  ...KEYWORDS.brands,
  ...KEYWORDS.problemSolving,
]

// Website basic information
export const SITE_CONFIG = {
  name: 'VisuTry',
  title: 'VisuTry - AI Virtual Glasses Try-On Tool | Find Your Perfect Eyewear Online',
  description: 'Try on glasses virtually with AI-powered technology. Find the perfect eyewear for your face shape with our smart glasses recommendation tool. Shop designer frames online with confidence using virtual try-on.',
  url: process.env.NEXT_PUBLIC_SITE_URL || 'https://visutry.com',
  ogImage: '/og-image.jpg',
  keywords: ALL_KEYWORDS,
  author: 'VisuTry Team',
  creator: 'VisuTry',
  publisher: 'VisuTry',
  locale: 'en-US',
}

/**
 * Get keywords by page type for targeted SEO
 */
export function getKeywordsByType(type: 'home' | 'blog' | 'product' | 'pricing'): string[] {
  switch (type) {
    case 'home':
      return [...KEYWORDS.core, ...KEYWORDS.features, ...KEYWORDS.problemSolving]
    case 'blog':
      return [...KEYWORDS.core, ...KEYWORDS.longTail]
    case 'product':
      return [...KEYWORDS.core, ...KEYWORDS.brands]
    case 'pricing':
      return [...KEYWORDS.core, ...KEYWORDS.features]
    default:
      return KEYWORDS.core
  }
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
export function generateStructuredData(
  type: 'website' | 'article' | 'product' | 'organization' | 'softwareApplication' | 'faqPage' | 'offer' | 'breadcrumbList' | 'howTo',
  data: any
) {
  const baseData = {
    '@context': 'https://schema.org',
    '@type': type === 'website' ? 'WebSite' :
              type === 'article' ? 'Article' :
              type === 'product' ? 'Product' :
              type === 'organization' ? 'Organization' :
              type === 'softwareApplication' ? 'SoftwareApplication' :
              type === 'faqPage' ? 'FAQPage' :
              type === 'offer' ? 'Offer' :
              type === 'breadcrumbList' ? 'BreadcrumbList' :
              type === 'howTo' ? 'HowTo' : type,
  }

  switch (type) {
    case 'website':
      return {
        ...baseData,
        name: SITE_CONFIG.name,
        url: SITE_CONFIG.url,
        description: SITE_CONFIG.description,
        potentialAction: {
          '@type': 'SearchAction',
          target: {
            '@type': 'EntryPoint',
            urlTemplate: `${SITE_CONFIG.url}/search?q={search_term_string}`,
          },
          'query-input': 'required name=search_term_string',
        },
        ...data,
      }

    case 'organization':
      return {
        ...baseData,
        name: SITE_CONFIG.name,
        url: SITE_CONFIG.url,
        logo: `${SITE_CONFIG.url}/og-image.jpg`,
        description: SITE_CONFIG.description,
        sameAs: [
          'https://twitter.com/visutry',
          // Add more social media links as needed
        ],
        contactPoint: {
          '@type': 'ContactPoint',
          contactType: 'customer support',
          email: 'support@visutry.com',
        },
        ...data,
      }

    case 'softwareApplication':
      return {
        ...baseData,
        name: SITE_CONFIG.name,
        applicationCategory: 'DesignApplication',
        operatingSystem: 'Web Browser',
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD',
        },
        description: SITE_CONFIG.description,
        ...data,
      }

    case 'faqPage':
      return {
        ...baseData,
        mainEntity: data.questions?.map((q: any) => ({
          '@type': 'Question',
          name: q.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: q.answer,
          },
        })) || [],
      }

    case 'offer':
      return {
        ...baseData,
        name: data.name,
        description: data.description,
        price: data.price,
        priceCurrency: data.currency || 'USD',
        availability: 'https://schema.org/InStock',
        seller: {
          '@type': 'Organization',
          name: SITE_CONFIG.name,
        },
        ...data,
      }

    case 'breadcrumbList':
      return {
        ...baseData,
        itemListElement: data.items?.map((item: any, index: number) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: item.name,
          item: item.url ? `${SITE_CONFIG.url}${item.url}` : undefined,
        })) || [],
      }

    case 'howTo':
      return {
        ...baseData,
        name: data.name,
        description: data.description,
        totalTime: data.totalTime || 'PT5M',
        step: data.steps?.map((step: any, index: number) => ({
          '@type': 'HowToStep',
          position: index + 1,
          name: step.name,
          text: step.text,
          image: step.image,
        })) || [],
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
            url: `${SITE_CONFIG.url}/og-image.jpg`,
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
