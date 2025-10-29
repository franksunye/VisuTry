/**
 * Programmatic SEO utilities for VisuTry
 * Handles dynamic meta generation, structured data, and URL slugification
 */

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function unslugify(slug: string): string {
  return slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

/**
 * Generate SEO title for frame pages
 */
export function generateFrameTitle(brand: string, model: string): string {
  return `${brand} ${model} Virtual Try-On | Find Your Perfect Fit | VisuTry`
}

/**
 * Generate SEO description for frame pages
 */
export function generateFrameDescription(brand: string, model: string): string {
  return `Try on ${brand} ${model} glasses virtually with AI technology. See how they look on your face shape. Free online try-on tool.`
}

/**
 * Generate SEO title for face shape pages
 */
export function generateFaceShapeTitle(shape: string): string {
  return `Best Glasses for ${shape} Face | Style Guide & Try-On | VisuTry`
}

/**
 * Generate SEO description for face shape pages
 */
export function generateFaceShapeDescription(shape: string): string {
  return `Discover the best glasses styles for ${shape} face shapes. Get personalized recommendations and try them on virtually with VisuTry.`
}

/**
 * Generate SEO title for category pages
 */
export function generateCategoryTitle(category: string): string {
  return `${category} Glasses | Virtual Try-On | VisuTry`
}

/**
 * Generate SEO description for category pages
 */
export function generateCategoryDescription(category: string): string {
  return `Browse and try on ${category} glasses virtually. Find your perfect pair with our AI-powered try-on technology.`
}

/**
 * Generate SEO title for brand pages
 */
export function generateBrandTitle(brand: string): string {
  return `${brand} Glasses | Virtual Try-On | VisuTry`
}

/**
 * Generate SEO description for brand pages
 */
export function generateBrandDescription(brand: string): string {
  return `Explore ${brand} glasses and try them on virtually. See how different styles look on your face with VisuTry.`
}

/**
 * Generate Product Schema structured data
 */
export function generateProductSchema(data: {
  name: string
  description: string
  image: string
  brand: string
  price?: number
  url: string
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: data.name,
    description: data.description,
    image: data.image,
    brand: {
      '@type': 'Brand',
      name: data.brand,
    },
    ...(data.price && {
      offers: {
        '@type': 'Offer',
        price: data.price.toString(),
        priceCurrency: 'USD',
        availability: 'https://schema.org/InStock',
      },
    }),
    url: data.url,
  }
}

/**
 * Generate BreadcrumbList Schema
 */
export function generateBreadcrumbSchema(items: Array<{ name: string; url: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  }
}

/**
 * Generate CollectionPage Schema for category/face shape pages
 */
export function generateCollectionPageSchema(data: {
  name: string
  description: string
  url: string
  itemCount: number
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: data.name,
    description: data.description,
    url: data.url,
    numberOfItems: data.itemCount,
  }
}

/**
 * Generate canonical URL
 */
export function generateCanonicalUrl(path: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://visutry.com'
  return `${baseUrl}${path}`
}

/**
 * Generate Open Graph meta tags
 */
export function generateOGTags(data: {
  title: string
  description: string
  image: string
  url: string
  type?: string
}) {
  return {
    'og:title': data.title,
    'og:description': data.description,
    'og:image': data.image,
    'og:url': data.url,
    'og:type': data.type || 'website',
  }
}

/**
 * Generate Twitter Card meta tags
 */
export function generateTwitterTags(data: {
  title: string
  description: string
  image: string
}) {
  return {
    'twitter:card': 'summary_large_image',
    'twitter:title': data.title,
    'twitter:description': data.description,
    'twitter:image': data.image,
  }
}

/**
 * Generate URL slug for frame (brand-model)
 */
export function generateFrameSlug(brand: string, model: string): string {
  return `${slugify(brand)}-${slugify(model)}`
}

/**
 * Parse frame slug back to brand and model
 */
export function parseFrameSlug(slug: string): { brand: string; model: string } | null {
  const parts = slug.split('-')
  if (parts.length < 2) return null

  // Last part is model, rest is brand
  const model = parts[parts.length - 1]
  const brand = parts.slice(0, -1).join('-')

  return { brand: unslugify(brand), model: unslugify(model) }
}

/**
 * Generate URL slug for face shape
 */
export function generateFaceShapeSlug(shape: string): string {
  return slugify(shape)
}

/**
 * Generate URL slug for category
 */
export function generateCategorySlug(category: string): string {
  return slugify(category)
}

/**
 * Generate URL slug for brand
 */
export function generateBrandSlug(brand: string): string {
  return slugify(brand)
}

