import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { COMBINATION_SEARCH_PAGES } from '@/config/search-combination-pages'
import { getGlassesGuideHubCopy } from '@/config/glasses-guide-hub-locales'
import type { Locale } from '@/i18n'
import { generateI18nSEO, generateStructuredData } from '@/lib/seo'

type Props = { params: { locale: string } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const copy = getGlassesGuideHubCopy(params.locale)
  return generateI18nSEO({
    locale: params.locale as Locale,
    title: copy.metaTitle,
    description: copy.metaDescription,
    pathname: '/glasses-guide',
    noIndex: params.locale !== 'en',
    availableLocales: ['en'] as const,
  })
}

export default function GlassesGuideHub({ params }: Props) {
  const locale = params.locale
  const copy = getGlassesGuideHubCopy(locale)
  const groups = [
    { type: 'face-frame' as const, ...copy.groups.faceFrame },
    { type: 'gender-style' as const, ...copy.groups.genderStyle },
    { type: 'decision-question' as const, ...copy.groups.decisionQuestion },
  ]

  const collectionSchema = generateStructuredData('breadcrumbList', {
    items: [
      { name: copy.breadcrumbHome, url: `/${locale}` },
      { name: copy.breadcrumbGuides, url: `/${locale}/glasses-guide` },
    ],
  })

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }} />
      <main className="mx-auto max-w-6xl px-4 py-10 md:py-14">
        <section className="max-w-3xl">
          <p className="mb-3 inline-flex rounded-lg border border-blue-200 bg-white px-3 py-1 text-sm font-semibold text-blue-700">
            {copy.badge}
          </p>
          <h1 className="mb-4 text-3xl font-bold leading-tight text-gray-950 md:text-5xl">
            {copy.title}
          </h1>
          <p className="text-lg leading-8 text-gray-600">{copy.intro}</p>
        </section>

        {groups.map((group) => {
          const pages = COMBINATION_SEARCH_PAGES.filter((page) => page.type === group.type)
          return (
            <section key={group.type} className="mt-12">
              <div className="mb-5 max-w-3xl">
                <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-blue-600">{group.eyebrow}</p>
                <h2 className="mb-2 text-2xl font-bold text-gray-950">{group.title}</h2>
                <p className="text-sm leading-6 text-gray-600">{group.description}</p>
              </div>

              {locale === 'en' ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {pages.map((page) => (
                    <Link
                      key={page.slug}
                      href={`/${locale}/glasses-guide/${page.slug}`}
                      className="group rounded-lg border border-gray-200 bg-white p-5 transition hover:border-blue-200 hover:shadow-sm"
                    >
                      <h3 className="mb-2 font-semibold text-gray-950 group-hover:text-blue-700">{page.title}</h3>
                      <p className="text-sm leading-6 text-gray-600">{page.metaDescription}</p>
                      <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-blue-700">
                        {copy.openGuide} <ArrowRight className="h-4 w-4" />
                      </span>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="rounded-lg border border-gray-200 bg-gray-50 p-5 text-sm leading-6 text-gray-600">
                  {copy.englishGuidesNote}
                </p>
              )}
            </section>
          )
        })}
      </main>
    </>
  )
}
