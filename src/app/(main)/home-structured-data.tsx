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
      description: 'Free trial with 3 virtual try-ons',
    },
  })

  // FAQ Schema
  const faqSchema = generateStructuredData('faqPage', {
    questions: [
      {
        question: 'How does virtual glasses try-on work?',
        answer: 'Our AI-powered virtual glasses try-on tool uses advanced facial recognition technology to accurately place glasses on your photo. Simply upload a front-facing photo, select glasses from our collection, and see how they look on you instantly.',
      },
      {
        question: 'Is the virtual try-on free?',
        answer: 'Yes! We offer 3 free virtual try-ons for all users. You can upgrade to our premium plans for unlimited try-ons and additional features.',
      },
      {
        question: 'What types of glasses can I try on?',
        answer: 'You can try on a wide variety of glasses including prescription eyeglasses, sunglasses, reading glasses, and designer frames from popular brands like Ray-Ban, Oliver Peoples, and Tom Ford.',
      },
      {
        question: 'How accurate is the virtual try-on?',
        answer: 'Our AI technology provides highly accurate virtual try-ons by analyzing your face shape, size, and features. The results give you a realistic preview of how glasses will look on you.',
      },
      {
        question: 'Can I save and share my try-on results?',
        answer: 'Yes! You can save your virtual try-on results and share them with friends and family to get their opinions before making a purchase decision.',
      },
      {
        question: 'Do I need to create an account?',
        answer: 'You can try our tool without an account for your first 3 try-ons. Creating a free account allows you to save your results and access additional features.',
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

