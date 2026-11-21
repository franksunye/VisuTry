import type { Metadata } from 'next'
import { localeToOGLocale, type Locale } from '@/i18n'
import { SITE_CONFIG } from '@/lib/seo'
import { getMerchantDiscoveryEditorial, normalizeMerchantDiscoveryDestinations } from '@/lib/merchant-discovery-editorial'
import type { ExperienceSearchVisibility } from '@/modules/store/domain/experience-search-visibility'
import type { PublicExperienceDiscovery } from '@/modules/store/application/get-public-experience-discovery'

export function discoveryCanonicalUrl(pathname: string): string {
  const path = pathname.startsWith('/') ? pathname : `/${pathname}`
  const url = new URL(path, SITE_CONFIG.url)
  url.search = ''
  url.hash = ''
  return url.toString()
}

export function localizedDiscoveryVisibility(
  visibility: ExperienceSearchVisibility,
  locale: Locale,
): ExperienceSearchVisibility {
  // The current Merchant/Experience copy is shared English content. Keep
  // alternate locale routes available, but do not inflate the index with thin
  // untranslated duplicates.
  if (locale !== 'en' && visibility === 'PUBLIC_INDEX') return 'PUBLIC_NOINDEX'
  return visibility
}

function discoveryTitle(discovery: PublicExperienceDiscovery, locale: string): string {
  const editorial = locale === 'en' ? getMerchantDiscoveryEditorial(discovery) : null
  if (editorial) return editorial.title
  const { merchant, experience } = discovery
  return experience.type === 'STORE' && !experience.headline?.trim()
    ? `${merchant.name} Eyewear Collection | VisuTry`
    : `${experience.headline?.trim() || experience.name} | ${merchant.name}`
}

function discoveryDescription(discovery: PublicExperienceDiscovery, locale: string): string {
  const editorial = locale === 'en' ? getMerchantDiscoveryEditorial(discovery) : null
  if (editorial) return editorial.description
  const { merchant, experience, frames } = discovery
  return experience.description?.trim()
    || `${merchant.name}'s ${experience.type === 'STORE' ? 'eyewear collection' : 'featured eyewear edit'} includes ${frames.length} frame${frames.length === 1 ? '' : 's'} with product details and merchant links.`
}

export function buildExperienceDiscoveryMetadata(input: {
  discovery: PublicExperienceDiscovery
  locale: Locale
  pathname: string
}): Metadata {
  const { discovery, locale, pathname } = input
  const canonical = discoveryCanonicalUrl(pathname)
  const visibility = localizedDiscoveryVisibility(discovery.visibility, locale)
  const title = discoveryTitle(discovery, locale)
  const description = discoveryDescription(discovery, locale)
  const image = discovery.experience.heroAssetUrl
    || discovery.frames.find((frame) => frame.imageUrl)?.imageUrl
    || SITE_CONFIG.ogImage
  const metadata: Metadata = {
    title,
    description,
    metadataBase: new URL(SITE_CONFIG.url),
    alternates: { canonical },
    robots: {
      index: visibility === 'PUBLIC_INDEX',
      follow: visibility !== 'PRIVATE',
      googleBot: {
        index: visibility === 'PUBLIC_INDEX',
        follow: visibility !== 'PRIVATE',
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    openGraph: {
      type: 'website',
      url: canonical,
      title,
      description,
      siteName: SITE_CONFIG.name,
      locale: localeToOGLocale[locale],
      images: image ? [{ url: image, alt: `${discovery.merchant.name} eyewear collection` }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: image ? [image] : undefined,
    },
  }

  if (visibility === 'PUBLIC_INDEX') {
    metadata.alternates = {
      canonical,
      languages: { en: canonical, 'x-default': canonical },
    }
  }

  return metadata
}

function productFacts(discovery: PublicExperienceDiscovery, frame: PublicExperienceDiscovery['frames'][number]) {
  const facts: Array<{ '@type': 'PropertyValue'; name: string; value: string }> = []
  const values: Array<[string, string | null]> = [
    ['Shape', frame.shape],
    ['Material', frame.material],
    ['Color', frame.color],
    ['Width', frame.widthClass],
    ['Price', frame.price === null ? null : `${frame.price / 100} ${(frame.currency || 'usd').toUpperCase()}`],
  ]
  values.forEach(([name, value]) => {
    if (value) facts.push({ '@type': 'PropertyValue', name, value })
  })
  if (frame.brand) {
    facts.push({ '@type': 'PropertyValue', name: 'Brand', value: frame.brand })
  } else if (discovery.merchant.name) {
    facts.push({ '@type': 'PropertyValue', name: 'Merchant', value: discovery.merchant.name })
  }
  return facts
}

/** Structured data intentionally omits Offer, Review, AggregateRating and availability. */
export function buildExperienceDiscoveryJsonLd(input: {
  discovery: PublicExperienceDiscovery
  locale: string
  pathname: string
}): Record<string, unknown> {
  const { locale, pathname } = input
  const discovery = normalizeMerchantDiscoveryDestinations(input.discovery)
  const canonical = discoveryCanonicalUrl(pathname)
  const title = discoveryTitle(discovery, locale)
  const description = discoveryDescription(discovery, locale)
  const collectionImage = discovery.experience.heroAssetUrl
    || discovery.frames.find((frame) => frame.imageUrl)?.imageUrl

  const products = discovery.frames.map((frame) => ({
    '@type': 'Product',
    name: frame.name,
    ...(frame.imageUrl ? { image: [frame.imageUrl] } : {}),
    brand: { '@type': 'Brand', name: frame.brand || discovery.merchant.name },
    ...(frame.productUrl ? { url: frame.productUrl } : {}),
    additionalProperty: productFacts(discovery, frame),
  }))

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        '@id': `${canonical}#collection`,
        url: canonical,
        name: title,
        description,
        ...(collectionImage ? { image: collectionImage } : {}),
        mainEntity: {
          '@type': 'ItemList',
          itemListElement: products.map((product, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            item: product,
          })),
        },
      },
      {
        '@type': 'Organization',
        '@id': `${canonical}#merchant`,
        name: discovery.merchant.name,
        ...(discovery.merchant.websiteUrl ? { url: discovery.merchant.websiteUrl } : {}),
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'VisuTry', item: SITE_CONFIG.url },
          { '@type': 'ListItem', position: 2, name: discovery.merchant.name, item: canonical },
          { '@type': 'ListItem', position: 3, name: discovery.experience.name, item: canonical },
        ],
      },
    ],
  }
}

export function serializeJsonLd(value: Record<string, unknown>): string {
  return JSON.stringify(value).replace(/</g, '\\u003c')
}
