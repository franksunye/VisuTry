import type { Metadata } from 'next'
import { Camera, Grid2X2, Glasses } from 'lucide-react'
import { SearchToToolLanding } from '@/components/growth/SearchToToolLanding'
import { B03VisualSeoSections } from '@/components/seo/B03VisualSeoSections'
import { getSearchToToolRouteCopy } from '@/config/search-to-tool-route-copy'
import type { Locale } from '@/i18n'
import { generateStructuredData } from '@/lib/seo'
import { generateSearchToToolSEO } from '@/lib/search-to-tool-seo'

const pathname = '/compare-glasses-frames'
const routeId = 'compare-glasses-frames' as const

type Props = { params: { locale: string } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const copy = getSearchToToolRouteCopy(params.locale, routeId)
  return generateSearchToToolSEO({
    locale: params.locale as Locale,
    title: copy.metaTitle,
    description: copy.metaDescription,
    pathname,
  })
}

export default function CompareGlassesFramesPage({ params }: Props) {
  const locale = params.locale
  const copy = getSearchToToolRouteCopy(locale, routeId)
  const sourcePage = pathname
  const queryCluster = 'compare-glasses-frames'

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
      includeCtas={['compare', 'try_on', 'detector']}
      bottomCtas={['compare']}
      ctaLabels={copy.ctaLabels}
      principles={copy.principles}
      faq={copy.faq}
      faqEyebrow={copy.faqEyebrow}
      faqTitle={copy.faqTitle}
    >
      <B03VisualSeoSections locale={locale} pagePath="/compare-glasses-frames" />
    </SearchToToolLanding>
  )
}
