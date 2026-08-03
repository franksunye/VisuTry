import type { Metadata } from 'next'
import { Camera, Glasses, ScanFace } from 'lucide-react'
import { SearchToToolLanding } from '@/components/growth/SearchToToolLanding'
import type { Locale } from '@/i18n'
import { generateI18nSEO, generateStructuredData } from '@/lib/seo'

const pathname = '/what-glasses-suit-my-face'

type Props = { params: { locale: string } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return generateI18nSEO({
    locale: params.locale as Locale,
    title: 'What Glasses Suit My Face? Upload a Photo and Shortlist Frames',
    description:
      'What glasses suit my face? Use the free face shape detector on your photo, shortlist frame shapes, then confirm with virtual try-on or side-by-side compare.',
    pathname,
    noIndex: params.locale !== 'en',
    availableLocales: ['en'] as const,
  })
}

export default function WhatGlassesSuitMyFacePage({ params }: Props) {
  const locale = params.locale
  const sourcePage = pathname
  const queryCluster = 'what-glasses-suit-my-face'
  const faq = [
    {
      question: 'How do I know what glasses suit my face?',
      answer:
        'Start with a free face-shape estimate from one photo, shortlist complementary frame shapes, then validate width, scale, and style on your own image.',
    },
    {
      question: 'Do I need to upload a photo?',
      answer:
        'A photo helps the free detector and virtual try-on. If you prefer not to upload later for try-on, you can still read face-shape guidance first.',
    },
    {
      question: 'Is face shape enough to choose glasses?',
      answer:
        'No. Face shape is a useful first filter. Also check frame width, bridge fit, lens depth, prescription needs, comfort, and personal style.',
    },
  ]
  const schemas = [
    generateStructuredData('faqPage', { questions: faq }),
    generateStructuredData('howTo', {
      name: 'What glasses suit my face',
      description: 'Find glasses that suit your face from a photo, then confirm with try-on.',
      totalTime: 'PT5M',
      steps: [
        { name: 'Detect', text: 'Estimate your likely face shape from one clear photo.' },
        { name: 'Shortlist', text: 'Pick frame shapes that balance your proportions.' },
        { name: 'Validate', text: 'Try frames on your photo or compare a few side by side.' },
      ],
    }),
  ]

  return (
    <SearchToToolLanding
      locale={locale}
      sourcePage={sourcePage}
      queryCluster={queryCluster}
      contentCluster="search-tool"
      eyebrow="Photo-first glasses advice"
      title="What Glasses Suit My Face?"
      intro="Upload one photo to estimate your face shape, turn that into a practical frame shortlist, then confirm the look with try-on or frame compare."
      schemas={schemas}
      steps={[
        { title: 'Detect your face shape', text: 'Use the free on-device detector—no login required.', icon: ScanFace },
        { title: 'Shortlist frame shapes', text: 'Narrow options before you fall in love with a single pair.', icon: Glasses },
        { title: 'Validate on your photo', text: 'Check scale and style with try-on or side-by-side compare.', icon: Camera },
      ]}
      ctaLabels={{
        detector: 'Detect my face shape free',
        tryOn: 'Try glasses on my photo',
        compare: 'Compare frames side by side',
      }}
      principles={[
        'Face shape is a first filter, not a rigid rule.',
        'Virtual try-on checks how frames actually look on you.',
        'Compare a few options before you decide.',
      ]}
      faq={faq}
      faqEyebrow="Next step"
      faqTitle="Start with a free photo check"
    />
  )
}
