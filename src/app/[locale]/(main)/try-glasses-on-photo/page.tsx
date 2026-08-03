import type { Metadata } from 'next'
import { Camera, Glasses, Grid2X2 } from 'lucide-react'
import { SearchToToolLanding } from '@/components/growth/SearchToToolLanding'
import type { Locale } from '@/i18n'
import { generateI18nSEO, generateStructuredData } from '@/lib/seo'

const pathname = '/try-glasses-on-photo'

type Props = { params: { locale: string } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return generateI18nSEO({
    locale: params.locale as Locale,
    title: 'Try Glasses on a Photo Online | VisuTry',
    description:
      'Try glasses on your photo online. Upload a clear face photo and a glasses product image or screenshot, preview the look, then compare alternative frames side by side.',
    pathname,
    noIndex: params.locale !== 'en',
    availableLocales: ['en'] as const,
  })
}

export default function TryGlassesOnPhotoPage({ params }: Props) {
  const locale = params.locale
  const sourcePage = pathname
  const queryCluster = 'try-glasses-on-photo'
  const faq = [
    {
      question: 'Can I try glasses on a photo online?',
      answer:
        'Yes. Upload a clear face photo and a glasses product image or screenshot to preview how the frame looks on you in the browser.',
    },
    {
      question: 'Can I use a screenshot from an eyewear store?',
      answer:
        'Yes. A clean product image or retailer screenshot can be used for virtual try-on. Confirm exact size and model details with the seller before buying.',
    },
    {
      question: 'What if I want to compare more than one pair?',
      answer:
        'Use Frame Compare after try-on to review several candidates side by side instead of relying on memory from separate previews.',
    },
  ]

  const schemas = [
    generateStructuredData('faqPage', { questions: faq }),
    generateStructuredData('softwareApplication', {
      name: 'VisuTry Photo Glasses Try-On',
      url: `https://www.visutry.com/${locale}${pathname}`,
      applicationCategory: 'ShoppingApplication',
      operatingSystem: 'Web Browser',
      description: 'Try a glasses product image on your own face photo in the browser.',
      featureList: [
        'Upload your own face photo',
        'Use a glasses product image or screenshot',
        'Preview one specific frame',
        'Continue into side-by-side frame comparison',
      ],
    }),
  ]

  return (
    <SearchToToolLanding
      locale={locale}
      sourcePage={sourcePage}
      queryCluster={queryCluster}
      contentCluster="search-tool"
      eyebrow="Photo-based virtual glasses preview"
      title="Try Glasses on Your Photo Online"
      intro="Upload your own photo and a glasses image to preview one specific pair, then compare alternatives side by side when you need more confidence before buying."
      schemas={schemas}
      steps={[
        { title: 'Upload your face photo', text: 'Use a clear, straight-on image with even light.', icon: Camera },
        { title: 'Add the glasses image', text: 'Use a product photo or retailer screenshot of the frame you are considering.', icon: Glasses },
        { title: 'Compare if needed', text: 'Move into Frame Compare when one preview is not enough.', icon: Grid2X2 },
      ]}
      includeCtas={['try_on', 'compare', 'detector']}
      bottomCtas={['try_on', 'compare']}
      ctaLabels={{
        tryOn: 'Try glasses on my photo',
        compare: 'Compare frames side by side',
        detector: 'Check my face shape first',
      }}
      principles={[
        'Use a front-facing photo for the cleanest visual check.',
        'Try-on helps with appearance; confirm physical fit and size separately.',
        'Compare a shortlist when two or more frames remain close.',
      ]}
      faq={faq}
      faqEyebrow="Ready to preview"
      faqTitle="Start with your photo and one frame"
    />
  )
}
