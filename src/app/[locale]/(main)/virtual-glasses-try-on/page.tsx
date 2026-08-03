import type { Metadata } from 'next'
import { Camera, Glasses, Upload } from 'lucide-react'
import { SearchToToolLanding } from '@/components/growth/SearchToToolLanding'
import { getSearchToToolRouteCopy } from '@/config/search-to-tool-route-copy'
import type { Locale } from '@/i18n'
import { generateI18nSEO, generateStructuredData } from '@/lib/seo'

const pathname = '/virtual-glasses-try-on'
const routeId = 'virtual-glasses-try-on' as const

type Props = { params: { locale: string } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const copy = getSearchToToolRouteCopy(params.locale, routeId)
  return generateI18nSEO({
    locale: params.locale as Locale,
    title: copy.metaTitle,
    description: copy.metaDescription,
    pathname,
  })
}

export default function VirtualGlassesTryOnPage({ params }: Props) {
  const locale = params.locale
  const copy = getSearchToToolRouteCopy(locale, routeId)
  const sourcePage = pathname
  const queryCluster = 'virtual-glasses-try-on'

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
        { ...copy.steps[0], icon: Upload },
        { ...copy.steps[1], icon: Glasses },
        { ...copy.steps[2], icon: Camera },
      ]}
      includeCtas={['try_on', 'compare', 'detector']}
      bottomCtas={['try_on']}
      ctaLabels={copy.ctaLabels}
      principles={copy.principles}
      faq={copy.faq}
      faqEyebrow={copy.faqEyebrow}
      faqTitle={copy.faqTitle}
    />
  )
}
