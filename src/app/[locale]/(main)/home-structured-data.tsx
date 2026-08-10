import { generateStructuredData } from '@/lib/seo'
import {
  VISUTRY_AI_TOPICS,
  VISUTRY_POSITIONING,
  VISUTRY_PRODUCT_PATH,
} from '@/lib/product-positioning'

/**
 * Global structured data shared by public pages.
 * Page-specific SoftwareApplication, Article, FAQ, and HowTo schemas should live on the page.
 */
export function HomeStructuredData() {
  const organizationSchema = generateStructuredData('organization', {
    description: VISUTRY_POSITIONING.organization,
    slogan: 'Make better eyewear decisions before you buy.',
    knowsAbout: [...VISUTRY_AI_TOPICS],
  })

  // VisuTry has no public site-search route. Override the generator default so
  // we do not advertise a SearchAction that resolves to a non-functional URL.
  const websiteSchema = generateStructuredData('website', {
    description: VISUTRY_POSITIONING.consumer,
    about: VISUTRY_PRODUCT_PATH.map((name) => ({
      '@type': 'SoftwareApplication',
      name,
    })),
    potentialAction: undefined,
  })

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
    </>
  )
}
