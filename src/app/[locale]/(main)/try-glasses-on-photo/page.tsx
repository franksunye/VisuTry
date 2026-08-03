import type { Metadata } from 'next'
import { Camera, Glasses, Grid2X2 } from 'lucide-react'
import { SearchToToolLanding } from '@/components/growth/SearchToToolLanding'
import { getSearchToToolPhaseACopy } from '@/config/search-to-tool-phase-a-locales'
import type { Locale } from '@/i18n'
import { generateI18nSEO, generateStructuredData } from '@/lib/seo'

const pathname = '/try-glasses-on-photo'
const routeId = 'try-glasses-on-photo' as const

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

export default function TryGlassesOnPhotoPage({ params }: Props) {
  const locale = params.locale
  const copy = getSearchToToolPhaseACopy(locale, routeId)
  const sourcePage = pathname
  const queryCluster = 'try-glasses-on-photo'

  const schemas = [
    generateStructuredData('faqPage', { questions: copy.faq }),
    generateStructuredData('softwareApplication', {
      name: copy.title,
      url: `https://www.visutry.com/${locale}${pathname}`,
      applicationCategory: 'ShoppingApplication',
      operatingSystem: 'Web Browser',
      description: copy.software!.description,
      featureList: copy.software!.featureList,
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
        { ...copy.steps[0], icon: Camera },
        { ...copy.steps[1], icon: Glasses },
        { ...copy.steps[2], icon: Grid2X2 },
      ]}
      includeCtas={['try_on', 'compare', 'detector']}
      bottomCtas={['try_on', 'compare']}
      ctaLabels={copy.ctaLabels}
      principles={copy.principles}
      faq={copy.faq}
      faqEyebrow={copy.faqEyebrow}
      faqTitle={copy.faqTitle}
    />
  )
}
