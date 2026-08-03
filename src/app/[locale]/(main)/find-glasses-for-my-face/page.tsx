import type { Metadata } from 'next'
import { Camera, Glasses, ScanFace } from 'lucide-react'
import { SearchToToolLanding } from '@/components/growth/SearchToToolLanding'
import type { Locale } from '@/i18n'
import { generateI18nSEO, generateStructuredData } from '@/lib/seo'

const pathname = '/find-glasses-for-my-face'

type Props = { params: { locale: string } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return generateI18nSEO({
    locale: params.locale as Locale,
    title: 'Find Glasses for My Face from a Photo | VisuTry',
    description:
      'Find glasses for your face from one photo. Detect your likely face shape, shortlist frame directions, then validate them with virtual try-on or side-by-side compare.',
    pathname,
    noIndex: params.locale !== 'en',
    availableLocales: ['en'] as const,
  })
}

export default function FindGlassesForMyFacePage({ params }: Props) {
  const locale = params.locale
  const sourcePage = pathname
  const queryCluster = 'find-glasses-for-my-face'
  const faq = [
    {
      question: 'How do I find glasses that suit my face?',
      answer:
        'Start with face proportions, then narrow the frame shapes and widths worth testing. A photo-based try-on or side-by-side comparison helps confirm the shortlist.',
    },
    {
      question: 'Should I choose glasses only by face shape?',
      answer:
        'No. Face shape is a useful first filter, but frame width, bridge fit, lens depth, prescription needs, and personal style also matter.',
    },
    {
      question: 'Can I use my own glasses product image?',
      answer:
        'Yes. VisuTry virtual try-on can use a glasses product image or retailer screenshot so you can validate a specific pair after narrowing the direction.',
    },
  ]

  const schemas = [
    generateStructuredData('faqPage', { questions: faq }),
    generateStructuredData('howTo', {
      name: 'How to find glasses for your face',
      description: 'Use face-shape guidance, shortlist frame directions, and validate them on your own photo.',
      totalTime: 'PT5M',
      steps: [
        { name: 'Detect', text: 'Estimate your likely face shape from a clear photo.' },
        { name: 'Shortlist', text: 'Choose a few frame shapes and proportions worth testing.' },
        { name: 'Validate', text: 'Try one exact frame or compare several candidates side by side.' },
      ],
    }),
  ]

  return (
    <SearchToToolLanding
      locale={locale}
      sourcePage={sourcePage}
      queryCluster={queryCluster}
      contentCluster="search-tool"
      eyebrow="Photo-first frame shortlisting"
      title="Find Glasses for My Face"
      intro="Turn one photo into a practical shortlist: understand your face proportions, narrow the frame directions worth trying, then validate the final candidates visually."
      schemas={schemas}
      steps={[
        { title: 'Understand your face', text: 'Start with the free face shape detector as a first filter.', icon: ScanFace },
        { title: 'Shortlist frame directions', text: 'Focus on a few shapes and proportions instead of browsing everything.', icon: Glasses },
        { title: 'Validate on your photo', text: 'Use try-on or side-by-side compare before you decide.', icon: Camera },
      ]}
      includeCtas={['detector', 'advisor', 'try_on', 'compare']}
      bottomCtas={['advisor', 'try_on']}
      ctaLabels={{
        detector: 'Detect my face shape free',
        advisor: 'Get glasses advice',
        tryOn: 'Try glasses on my photo',
        compare: 'Compare frames',
      }}
      principles={[
        'Use face shape to narrow options, not to impose a rigid rule.',
        'Frame width and scale matter as much as silhouette.',
        'Compare a small shortlist rather than browsing endlessly.',
      ]}
      faq={faq}
      faqEyebrow="Ready to narrow the options"
      faqTitle="Move from shortlist to visual proof"
    />
  )
}
