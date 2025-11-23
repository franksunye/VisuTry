import { generateStructuredData } from '@/lib/seo'

/**
 * Structured Data for Homepage
 * Includes Organization, WebSite, SoftwareApplication, and FAQ schemas
 */
export function HomeStructuredData() {
  // Organization Schema
  const organizationSchema = generateStructuredData('organization', {})

  // WebSite Schema
  const websiteSchema = generateStructuredData('website', {})

  // SoftwareApplication Schema
  const softwareSchema = generateStructuredData('softwareApplication', {
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      ratingCount: '1250',
    },
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
      description: 'Free trial with 3 virtual try-ons for glasses, outfits, shoes, and accessories',
    },
  })

  // FAQ Schema
  const faqSchema = generateStructuredData('faqPage', {
    questions: [
      {
        question: 'What can I try on with VisuTry?',
        answer: 'VisuTry offers AI-powered virtual try-on for glasses, outfits, shoes, and accessories. Simply upload your photo and see how any item looks on you before making a purchase.',
      },
      {
        question: 'How does virtual try-on work?',
        answer: 'Our AI-powered virtual try-on tool uses advanced facial and body recognition technology to accurately place items on your photo. Simply upload a clear photo, select an item from our collection, and see how it looks on you instantly.',
      },
      {
        question: 'Is the virtual try-on free?',
        answer: 'Yes! We offer 3 free virtual try-ons for all users across all categories. You can upgrade to our premium plans for unlimited try-ons and additional features.',
      },
      {
        question: 'What items can I try on?',
        answer: 'You can try on glasses (prescription, sunglasses, designer frames), outfits (clothing and fashion items), shoes (sneakers, formal shoes, boots), and accessories (jewelry, watches, hats) from various brands.',
      },
      {
        question: 'How accurate is the virtual try-on?',
        answer: 'Our AI technology provides highly accurate virtual try-ons by analyzing your face shape, body size, and features. The results give you a realistic preview of how items will look on you.',
      },
      {
        question: 'Can I save and share my try-on results?',
        answer: 'Yes! You can save your virtual try-on results and share them with friends and family to get their opinions before making a purchase decision.',
      },
    ],
  })

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

      {/* SoftwareApplication Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }}
      />

      {/* FAQ Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
    </>
  )
}

