import { generateStructuredData } from '@/lib/seo'

/**
 * Global structured data shared by public pages.
 * Page-specific SoftwareApplication, Article, FAQ, and HowTo schemas should live on the page.
 */
export function HomeStructuredData() {
  const organizationSchema = generateStructuredData('organization', {})

  // VisuTry has no public site-search route. Override the generator default so
  // we do not advertise a SearchAction that resolves to a non-functional URL.
  const websiteSchema = generateStructuredData('website', {
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
