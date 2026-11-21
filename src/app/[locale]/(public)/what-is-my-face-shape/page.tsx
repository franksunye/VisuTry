import type { Metadata } from 'next'
import { Camera, ScanFace, Sparkles } from 'lucide-react'
import { SearchToToolLanding } from '@/components/growth/SearchToToolLanding'
import { getSearchToToolLandingCopy } from '@/config/search-to-tool-locales'
import type { Locale } from '@/i18n'
import { generateStructuredData } from '@/lib/seo'
import { generateSearchToToolSEO } from '@/lib/search-to-tool-seo'
import { B01VisualSeoSections } from '@/components/seo/B01VisualSeoSections'
import Link from '@/components/layout/PublicLink'
import { FACE_SHAPE_COMPARISONS } from '@/config/face-shape-comparisons'
import { EN_FACE_IDENTIFICATION } from '@/config/english-search-entry-content'

const pathname = '/what-is-my-face-shape'
const routeId = 'what-is-my-face-shape' as const

type Props = { params: { locale: string } }

export const dynamic = 'force-static'

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const copy = getSearchToToolLandingCopy(params.locale, routeId)
  return generateSearchToToolSEO({
    locale: params.locale as Locale,
    title: copy.metaTitle,
    description: copy.metaDescription,
    pathname,
  })
}

export default function WhatIsMyFaceShapePage({ params }: Props) {
  const locale = params.locale
  const baseCopy = getSearchToToolLandingCopy(locale, routeId)
  const copy = locale === 'en' ? { ...baseCopy, ...EN_FACE_IDENTIFICATION } : baseCopy
  const sourcePage = pathname
  const queryCluster = 'what-is-my-face-shape'

  const schemas = [
    generateStructuredData('faqPage', { questions: copy.faq }),
    generateStructuredData('howTo', {
      name: locale === 'en' ? 'How to identify your face shape' : copy.howTo.name,
      description: locale === 'en' ? copy.intro : copy.howTo.description,
      totalTime: 'PT2M',
      steps: locale === 'en'
        ? copy.steps.map(({ title, text }) => ({ name: title, text }))
        : copy.howTo.steps,
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
        { ...copy.steps[1], icon: ScanFace },
        { ...copy.steps[2], icon: Sparkles },
      ]}
      includeCtas={['detector', 'advisor', 'try_on']}
      bottomCtas={['detector']}
      ctaLabels={copy.ctaLabels}
      principles={locale === 'en' ? undefined : copy.principles}
      faq={copy.faq}
      faqEyebrow={copy.faqEyebrow}
      faqTitle={copy.faqTitle}
    >
      <B01VisualSeoSections locale={locale} pagePath="/what-is-my-face-shape" />
      {locale === 'en' && (
        <section className="mt-12" aria-labelledby="compare-face-shapes">
          <h2 id="compare-face-shapes" className="text-2xl font-bold text-gray-950">Between two face shapes?</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {Object.values(FACE_SHAPE_COMPARISONS).map((comparison) => (
              <article key={comparison.slug} className="rounded-lg border border-gray-200 bg-white p-5">
                <h3 className="font-semibold capitalize text-gray-950">{comparison.first} vs {comparison.second}</h3>
                <p className="mt-2 text-sm leading-6 text-gray-600">{comparison.keyDifference}</p>
                <Link href={`/en/face-shapes/compare/${comparison.slug}`} className="mt-3 inline-block text-sm font-semibold text-blue-700 hover:text-blue-900">
                  Compare the signs →
                </Link>
              </article>
            ))}
          </div>
          <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold">
            <Link href="/en/face-shape-measurement" className="text-blue-700 hover:text-blue-900">How to measure your face</Link>
            <Link href="/en/glasses-for-face-shape" className="text-blue-700 hover:text-blue-900">Find glasses for your face shape</Link>
          </div>
        </section>
      )}
    </SearchToToolLanding>
  )
}
