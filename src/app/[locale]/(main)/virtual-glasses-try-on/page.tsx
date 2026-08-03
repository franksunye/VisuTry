import type { Metadata } from 'next'
import { Camera, Glasses, Upload } from 'lucide-react'
import { SearchToToolLanding } from '@/components/growth/SearchToToolLanding'
import { getSearchToToolLandingCopy } from '@/config/search-to-tool-locales'
import type { Locale } from '@/i18n'
import { generateI18nSEO, generateStructuredData } from '@/lib/seo'

const pathname = '/virtual-glasses-try-on'
const routeId = 'virtual-glasses-try-on' as const
const icons = [Upload, Glasses, Camera] as const

type Props = { params: { locale: string } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const copy = getSearchToToolLandingCopy(params.locale, routeId)
  return generateI18nSEO({ locale: params.locale as Locale, title: copy.metaTitle, description: copy.metaDescription, pathname })
}

export default function VirtualGlassesTryOnPage({ params }: Props) {
  const locale = params.locale
  const copy = getSearchToToolLandingCopy(locale, routeId)
  const schemas = [
    generateStructuredData('faqPage', { questions: copy.faq }),
    generateStructuredData('softwareApplication', {
      name: `VisuTry — ${copy.title}`,
      url: `https://www.visutry.com/${locale}${pathname}`,
      applicationCategory: 'ShoppingApplication',
      operatingSystem: 'Web Browser',
      description: copy.intro,
      featureList: copy.steps.map((step) => `${step.title}: ${step.text}`),
    }),
  ]

  return (
    <SearchToToolLanding
      locale={locale}
      sourcePage={pathname}
      queryCluster={routeId}
      contentCluster="search-tool"
      eyebrow={copy.eyebrow}
      title={copy.title}
      intro={copy.intro}
      schemas={schemas}
      steps={copy.steps.map((step, index) => ({ ...step, icon: icons[index] }))}
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
