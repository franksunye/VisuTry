import type { Metadata } from 'next'
import { Glasses, ScanFace, Sparkles } from 'lucide-react'
import { SearchToToolLanding } from '@/components/growth/SearchToToolLanding'
import type { Locale } from '@/i18n'
import { generateI18nSEO, generateStructuredData } from '@/lib/seo'

const pathname = '/ai-glasses-advisor'

type Props = { params: { locale: string } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return generateI18nSEO({
    locale: params.locale as Locale,
    title: 'AI Glasses Advisor: Find Frames for Your Face | VisuTry',
    description:
      'Use the VisuTry AI glasses advisor to turn a face photo into practical frame guidance, then validate the shortlist with virtual try-on or side-by-side comparison.',
    pathname,
    noIndex: params.locale !== 'en',
    availableLocales: ['en'] as const,
  })
}

export default function AiGlassesAdvisorPage({ params }: Props) {
  const locale = params.locale
  const sourcePage = pathname
  const queryCluster = 'ai-glasses-advisor'
  const faq = [
    {
      question: 'What does an AI glasses advisor do?',
      answer:
        'It turns visible face proportions and your photo into practical frame guidance, helping you narrow shapes and styles before trying specific glasses.',
    },
    {
      question: 'Is the advisor the same as virtual try-on?',
      answer:
        'No. The advisor helps decide what directions are worth trying. Virtual try-on then shows how a specific frame looks on your own photo.',
    },
    {
      question: 'Should I use face shape alone to choose glasses?',
      answer:
        'No. Face shape is only one input. Frame width, lens depth, bridge fit, prescription needs, and your preferred style should also be considered.',
    },
  ]

  const schemas = [
    generateStructuredData('faqPage', { questions: faq }),
    generateStructuredData('softwareApplication', {
      name: 'VisuTry AI Glasses Advisor',
      url: `https://www.visutry.com/${locale}${pathname}`,
      applicationCategory: 'ShoppingApplication',
      operatingSystem: 'Web Browser',
      description: 'AI-assisted eyewear guidance from a face photo, connected to virtual try-on and frame comparison.',
      featureList: [
        'Photo-based face analysis',
        'Personalized frame guidance',
        'Continuation into virtual try-on',
        'Continuation into frame comparison',
      ],
    }),
  ]

  return (
    <SearchToToolLanding
      locale={locale}
      sourcePage={sourcePage}
      queryCluster={queryCluster}
      contentCluster="search-tool"
      eyebrow="Personalized eyewear guidance"
      title="AI Glasses Advisor"
      intro="Use your photo to narrow the frame directions worth considering, understand why they may work, then validate the shortlist with try-on or side-by-side comparison."
      schemas={schemas}
      steps={[
        { title: 'Understand your face', text: 'Use face proportions as a practical starting point.', icon: ScanFace },
        { title: 'Get frame guidance', text: 'Turn the analysis into a smaller set of frame directions worth testing.', icon: Sparkles },
        { title: 'Validate the shortlist', text: 'Use virtual try-on and compare before you decide.', icon: Glasses },
      ]}
      includeCtas={['advisor', 'try_on', 'compare', 'detector']}
      bottomCtas={['advisor']}
      ctaLabels={{
        advisor: 'Open AI glasses advisor',
        tryOn: 'Try glasses on my photo',
        compare: 'Compare frames',
        detector: 'Detect my face shape free',
      }}
      principles={[
        'Use recommendations to narrow choices, not to impose a single answer.',
        'Connect guidance to visual proof with try-on.',
        'Keep fit, prescription, and comfort checks separate from appearance.',
      ]}
      faq={faq}
      faqEyebrow="Personalized next step"
      faqTitle="Open the glasses advisor"
    />
  )
}
