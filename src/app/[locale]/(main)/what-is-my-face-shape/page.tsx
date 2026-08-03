import type { Metadata } from 'next'
import { Camera, ScanFace, Sparkles } from 'lucide-react'
import { SearchToToolLanding } from '@/components/growth/SearchToToolLanding'
import type { Locale } from '@/i18n'
import { generateI18nSEO, generateStructuredData } from '@/lib/seo'

const pathname = '/what-is-my-face-shape'

type Props = { params: { locale: string } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return generateI18nSEO({
    locale: params.locale as Locale,
    title: 'What Is My Face Shape? Free Photo Face Shape Detector | VisuTry',
    description:
      'What is my face shape? Upload one clear photo and use the free on-device VisuTry detector to estimate your likely face shape, then continue into glasses advice.',
    pathname,
    noIndex: params.locale !== 'en',
    availableLocales: ['en'] as const,
  })
}

export default function WhatIsMyFaceShapePage({ params }: Props) {
  const locale = params.locale
  const sourcePage = pathname
  const queryCluster = 'what-is-my-face-shape'
  const faq = [
    {
      question: 'How can I tell what my face shape is?',
      answer:
        'Compare the relative width of your forehead, cheekbones, and jaw together with overall face length. VisuTry can estimate the likely shape from one clear photo.',
    },
    {
      question: 'Is the face shape detector free?',
      answer:
        'Yes. The basic face shape detector is free and runs on-device in your browser, so you can get a quick estimate before choosing glasses.',
    },
    {
      question: 'What should I do after I know my face shape?',
      answer:
        'Use it as a first filter, then compare frame width, lens depth, bridge fit, and style. You can continue into the glasses advisor, virtual try-on, or frame compare.',
    },
  ]

  const schemas = [
    generateStructuredData('faqPage', { questions: faq }),
    generateStructuredData('howTo', {
      name: 'How to find your face shape from a photo',
      description: 'Estimate your likely face shape from one clear photo and use it to narrow glasses choices.',
      totalTime: 'PT2M',
      steps: [
        { name: 'Upload', text: 'Choose a clear, straight-on face photo with even lighting.' },
        { name: 'Detect', text: 'Run the free on-device face shape detector.' },
        { name: 'Continue', text: 'Use the result to shortlist glasses and validate them with try-on.' },
      ],
    }),
  ]

  return (
    <SearchToToolLanding
      locale={locale}
      sourcePage={sourcePage}
      queryCluster={queryCluster}
      contentCluster="search-tool"
      eyebrow="Free photo face-shape check"
      title="What Is My Face Shape?"
      intro="Use one clear photo to estimate your likely face shape, then turn that result into practical glasses guidance instead of stopping at a label."
      schemas={schemas}
      steps={[
        { title: 'Upload one photo', text: 'Use a straight-on photo with your full face visible.', icon: Camera },
        { title: 'Detect your likely shape', text: 'The free detector runs on-device in your browser.', icon: ScanFace },
        { title: 'Use the result', text: 'Continue into glasses advice, try-on, or frame compare.', icon: Sparkles },
      ]}
      includeCtas={['detector', 'advisor', 'try_on']}
      bottomCtas={['detector']}
      ctaLabels={{
        detector: 'Detect my face shape free',
        advisor: 'Get glasses advice',
        tryOn: 'Try glasses on my photo',
      }}
      principles={[
        'Face shape is an estimate, not an identity label.',
        'Use proportions together rather than one feature alone.',
        'Confirm glasses visually after narrowing the options.',
      ]}
      faq={faq}
      faqEyebrow="Free next step"
      faqTitle="Check your face shape from a photo"
    />
  )
}
