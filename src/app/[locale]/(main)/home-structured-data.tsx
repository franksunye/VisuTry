import { generateStructuredData } from '@/lib/seo'

/**
 * Global structured data shared by public pages.
 * Page-specific SoftwareApplication, Article, FAQ, and HowTo schemas should live on the page.
 */
export function HomeStructuredData() {
  // Organization Schema
  const organizationSchema = generateStructuredData('organization', {})

  // WebSite Schema
  const websiteSchema = generateStructuredData('website', {})

  return (
    <>
      {/* Organization Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />

      {/* WebSite Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
    </>
  )
}
