import type { Metadata } from 'next'
import { Camera, Glasses, ScanFace } from 'lucide-react'
import { SearchToToolLanding } from '@/components/growth/SearchToToolLanding'
import { getSearchToToolPhaseACopy } from '@/config/search-to-tool-phase-a-locales'
import type { Locale } from '@/i18n'
import { generateI18nSEO, generateStructuredData } from '@/lib/seo'

const pathname = '/find-glasses-for-my-face'
const routeId = 'find-glasses-for-my-face' as const

type Props = { params: { locale: string } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const copy = getSearchToToolPhaseACopy(params.locale, routeId)
  return generateI18nSEO({
    locale: params.locale as Locale,
    title: copy.metaTitle,
    description: copy.metaDescription,
    pathname,
  })
}

export default function FindGlassesForMyFacePage({ params }: Props) {
  const locale = params.locale
  const copy = getSearchToToolPhaseACopy(locale, routeId)
  const sourcePage = pathname
  const queryCluster = 'find-glasses-for-my-face'

  const schemas = [
    generateStructuredData('faqPage', { questions: copy.faq }),
    generateStructuredData('howTo', {
      name: copy.howTo!.name,
      description: copy.howTo!.description,
      totalTime: 'PT5M',
      steps: copy.howTo!.steps,
    }),
  ]

  return (
    <SearchToToolLanding
      locale={locale}
      sourcePage={sourcePage}
      queryCluster={queryCluster}
      contentCluster="search-tool"
      eyebrow={copy.eyebrow}
      title={copy.title}
      intro={copy.intro}
      schemas={schemas}
      steps={[
        { ...copy.steps[0], icon: ScanFace },
        { ...copy.steps[1], icon: Glasses },
        { ...copy.steps[2], icon: Camera },
      ]}
      includeCtas={['detector', 'advisor', 'try_on', 'compare']}
      bottomCtas={['advisor', 'try_on']}
      ctaLabels={copy.ctaLabels}
      principles={copy.principles}
      faq={copy.faq}
      faqEyebrow={copy.faqEyebrow}
      faqTitle={copy.faqTitle}
    />
  )
}
