import type { Metadata } from 'next'
import { Camera, Grid2X2, Glasses } from 'lucide-react'
import { SearchToToolLanding } from '@/components/growth/SearchToToolLanding'
import type { Locale } from '@/i18n'
import { generateI18nSEO, generateStructuredData } from '@/lib/seo'

const pathname = '/compare-glasses-frames'

type Props = { params: { locale: string } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return generateI18nSEO({
    locale: params.locale as Locale,
    title: 'Compare Glasses Frames Side by Side on Your Photo | VisuTry',
    description:
      'Compare glasses frames on your photo. Choose up to four built-in presets, generate AI try-on results side by side, and decide which look works better.',
    pathname,
    noIndex: params.locale !== 'en',
    availableLocales: ['en'] as const,
  })
}

export default function CompareGlassesFramesPage({ params }: Props) {
  const locale = params.locale
  const sourcePage = pathname
  const queryCluster = 'compare-glasses-frames'
  const faq = [
    {
      question: 'How do I compare glasses frames online?',
      answer:
        'Upload one face photo, select up to four built-in frame presets, and generate side-by-side AI try-on results for a cleaner visual decision.',
    },
    {
      question: 'Is this better than trying one pair at a time?',
      answer:
        'Side-by-side compare helps when two or more silhouettes look similar alone. Use single try-on when you already have one exact product image.',
    },
    {
      question: 'Do I need to know my face shape first?',
      answer:
        'It helps but is optional. You can start with compare directly, or run the free face shape detector first to narrow the shortlist.',
    },
  ]
  const schemas = [
    generateStructuredData('faqPage', { questions: faq }),
    generateStructuredData('softwareApplication', {
      name: 'VisuTry Frame Compare',
      url: `https://www.visutry.com/${locale}${pathname}`,
      applicationCategory: 'ShoppingApplication',
      operatingSystem: 'Web Browser',
      description: 'Compare glasses frames side by side with AI try-on results on your photo.',
      featureList: [
        'Compare up to four frame presets',
        'Side-by-side AI try-on results',
        'Built for purchase decisions',
        'Works in the browser',
      ],
    }),
  ]

  return (
    <SearchToToolLanding
      locale={locale}
      sourcePage={sourcePage}
      queryCluster={queryCluster}
      contentCluster="search-tool"
      eyebrow="Side-by-side frame decisions"
      title="Compare Glasses Frames on Your Photo"
      intro="When one try-on is not enough, compare a few frame directions together. Pick presets, generate results side by side, and keep the look that fits you best."
      schemas={schemas}
      steps={[
        { title: 'Upload one photo', text: 'Use a clear, straight-on face photo.', icon: Camera },
        { title: 'Choose up to four frames', text: 'Select built-in presets that feel different enough to compare.', icon: Glasses },
        { title: 'Review side by side', text: 'Decide with a cleaner board instead of memory alone.', icon: Grid2X2 },
      ]}
      includeCtas={['compare', 'try_on', 'detector']}
      ctaLabels={{
        compare: 'Open frame compare',
        tryOn: 'Try one pair first',
        detector: 'Detect my face shape',
      }}
      principles={[
        'Compare clearly different silhouettes first.',
        'Use credits for each generated frame result.',
        'Confirm exact size and model with the seller before buying.',
      ]}
      faq={faq}
      faqEyebrow="Next step"
      faqTitle="Open side-by-side compare"
    />
  )
}
