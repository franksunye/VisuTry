import type { Metadata } from 'next'
import { Camera, Glasses, ScanFace } from 'lucide-react'
import { SearchToToolLanding } from '@/components/growth/SearchToToolLanding'
import { getSearchToToolLandingCopy } from '@/config/search-to-tool-locales'
import type { Locale } from '@/i18n'
import { generateI18nSEO, generateStructuredData } from '@/lib/seo'

const pathname = '/what-glasses-suit-my-face'
const routeId = 'what-glasses-suit-my-face' as const
const icons = [ScanFace, Glasses, Camera] as const

type Props = { params: { locale: string } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const copy = getSearchToToolLandingCopy(params.locale, routeId)
  return generateI18nSEO({ locale: params.locale as Locale, title: copy.metaTitle, description: copy.metaDescription, pathname })
}

export default function WhatGlassesSuitMyFacePage({ params }: Props) {
  const locale = params.locale
  const copy = getSearchToToolLandingCopy(locale, routeId)
  const schemas = [
    generateStructuredData('faqPage', { questions: copy.faq }),
    generateStructuredData('howTo', {
      name: copy.title,
      description: copy.intro,
      totalTime: 'PT5M',
      steps: copy.steps.map((step) => ({ name: step.title, text: step.text })),
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
      ctaLabels={copy.ctaLabels}
      principles={copy.principles}
      faq={copy.faq}
      faqEyebrow={copy.faqEyebrow}
      faqTitle={copy.faqTitle}
    />
  )
}
