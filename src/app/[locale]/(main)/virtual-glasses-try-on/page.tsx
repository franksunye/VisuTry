import type { Metadata } from 'next'
import { Camera, Glasses, Upload } from 'lucide-react'
import { SearchToToolLanding } from '@/components/growth/SearchToToolLanding'
import type { Locale } from '@/i18n'
import { generateI18nSEO, generateStructuredData } from '@/lib/seo'

const pathname = '/virtual-glasses-try-on'

type Props = { params: { locale: string } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return generateI18nSEO({
    locale: params.locale as Locale,
    title: 'Virtual Glasses Try On from Your Photo | VisuTry',
    description:
      'Virtual glasses try on online from a face photo and any glasses product image or screenshot. See the look before you buy, then compare frames side by side.',
    pathname,
    noIndex: params.locale !== 'en',
    availableLocales: ['en'] as const,
  })
}

export default function VirtualGlassesTryOnPage({ params }: Props) {
  const locale = params.locale
  const sourcePage = pathname
  const queryCluster = 'virtual-glasses-try-on'
  const faq = [
    {
      question: 'Can I try glasses on my photo online?',
      answer:
        'Yes. Upload a clear face photo and a glasses product image or screenshot to preview how the frames look on you.',
    },
    {
      question: 'Do I need the exact brand catalog?',
      answer:
        'No. VisuTry works with your own glasses image, including retailer screenshots. Confirm the exact model and size with the seller before buying.',
    },
    {
      question: 'What if I want to compare a few pairs?',
      answer:
        'After try-on, use Frame Compare to generate side-by-side results for up to four built-in frame presets.',
    },
  ]
  const schemas = [
    generateStructuredData('faqPage', { questions: faq }),
    generateStructuredData('softwareApplication', {
      name: 'VisuTry Virtual Glasses Try-On',
      url: `https://www.visutry.com/${locale}${pathname}`,
      applicationCategory: 'ShoppingApplication',
      operatingSystem: 'Web Browser',
      description:
        'Browser-based virtual glasses try-on from a face photo and a glasses product image.',
      featureList: [
        'Try any glasses image on your photo',
        'Works with product screenshots',
        'Continue into side-by-side frame compare',
        'No app install required',
      ],
    }),
  ]

  return (
    <SearchToToolLanding
      locale={locale}
      sourcePage={sourcePage}
      queryCluster={queryCluster}
      contentCluster="search-tool"
      eyebrow="Virtual try-on from your photo"
      title="Virtual Glasses Try On Online"
      intro="See how glasses look on your face before you buy. Upload your photo and a frame image, then continue into compare when you want a cleaner side-by-side decision."
      schemas={schemas}
      steps={[
        { title: 'Upload your photo', text: 'Use a straight-on face photo with even light.', icon: Upload },
        { title: 'Add a glasses image', text: 'Use a product photo or retailer screenshot.', icon: Glasses },
        { title: 'Preview and decide', text: 'Check the look, then compare alternatives if needed.', icon: Camera },
      ]}
      includeCtas={['try_on', 'compare', 'detector']}
      ctaLabels={{
        tryOn: 'Open virtual try-on',
        compare: 'Compare frames',
        detector: 'Find my face shape first',
      }}
      principles={[
        'Use your own glasses image—not only a fixed catalog.',
        'Try-on helps with appearance; confirm size with the seller.',
        'Compare a few looks when one preview is not enough.',
      ]}
      faq={faq}
      faqEyebrow="Ready to preview"
      faqTitle="Start with a photo try-on"
    />
  )
}
