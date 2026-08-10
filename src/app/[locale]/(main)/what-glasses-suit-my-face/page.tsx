import type { Metadata } from 'next'
import { Camera, Glasses, ScanFace } from 'lucide-react'
import { SearchToToolLanding } from '@/components/growth/SearchToToolLanding'
import { getSearchToToolRouteCopy } from '@/config/search-to-tool-route-copy'
import type { Locale } from '@/i18n'
import { generateStructuredData } from '@/lib/seo'
import { generateSearchToToolSEO } from '@/lib/search-to-tool-seo'
import { B01VisualSeoSections } from '@/components/seo/B01VisualSeoSections'

const pathname = '/what-glasses-suit-my-face'
const routeId = 'what-glasses-suit-my-face' as const

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

export default function WhatGlassesSuitMyFacePage({ params }: Props) {
  const locale = params.locale
  const copy = getSearchToToolRouteCopy(locale, routeId)
  const sourcePage = pathname
  const queryCluster = 'what-glasses-suit-my-face'

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
      ctaLabels={copy.ctaLabels}
      principles={copy.principles}
      faq={copy.faq}
      faqEyebrow={copy.faqEyebrow}
      faqTitle={copy.faqTitle}
    >
      <B01VisualSeoSections locale={locale} pagePath="/what-glasses-suit-my-face" />
    </SearchToToolLanding>
  )
}
