import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowRight, Glasses, ScanFace, SlidersHorizontal } from 'lucide-react'
import { SearchToToolLanding } from '@/components/growth/SearchToToolLanding'
import {
  COMBINATION_SEARCH_PAGES,
  getCombinationSearchPage,
} from '@/config/search-combination-pages'
import type { Locale } from '@/i18n'
import { generateI18nSEO, generateStructuredData } from '@/lib/seo'

type Props = {
  params: { locale: string; slug: string }
}

export function generateStaticParams() {
  return COMBINATION_SEARCH_PAGES.map((page) => ({ slug: page.slug }))
}

export const dynamicParams = false
export const revalidate = 3600

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const page = getCombinationSearchPage(params.slug)
  if (!page) {
    return { title: 'Guide Not Found', robots: { index: false, follow: false } }
  }

  return generateI18nSEO({
    locale: params.locale as Locale,
    title: `${page.title} | VisuTry`,
    description: page.metaDescription,
    pathname: `/glasses-guide/${page.slug}`,
    noIndex: params.locale !== 'en',
    availableLocales: ['en'] as const,
  })
}

export default function CombinationSearchPage({ params }: Props) {
  const page = getCombinationSearchPage(params.slug)
  if (!page) notFound()

  const locale = params.locale
  const pathname = `/glasses-guide/${page.slug}`
  const relatedPages = COMBINATION_SEARCH_PAGES
    .filter((item) => item.slug !== page.slug && item.type === page.type)
    .slice(0, 4)

  const schemas = [
    generateStructuredData('faqPage', { questions: page.faq }),
    generateStructuredData('howTo', {
      name: page.title,
      description: page.metaDescription,
      totalTime: 'PT5M',
      steps: [
        { name: 'Start with the decision question', text: page.primaryAnswer },
        { name: 'Check proportion and fit', text: page.watchFor },
        { name: 'Validate on your photo', text: page.decisionTip },
      ],
    }),
  ]

  return (
    <SearchToToolLanding
      locale={locale}
      sourcePage={pathname}
      queryCluster={page.queryCluster}
      contentCluster={`combination-search:${page.type}`}
      eyebrow={page.eyebrow}
      title={page.title}
      intro={page.intro}
      schemas={schemas}
      steps={[
        {
          title: 'Shortlist the direction',
          text: page.primaryAnswer,
          icon: Glasses,
        },
        {
          title: 'Check proportion',
          text: page.watchFor,
          icon: SlidersHorizontal,
        },
        {
          title: 'Validate on your photo',
          text: page.decisionTip,
          icon: ScanFace,
        },
      ]}
      includeCtas={[...page.includeCtas]}
      bottomCtas={[...page.bottomCtas]}
      ctaLabels={page.ctaLabels}
      principles={[
        page.whyItWorks,
        page.watchFor,
        'Virtual try-on helps with visual proportion; confirm exact dimensions, comfort, and prescription requirements before purchase.',
      ]}
      faq={page.faq}
      faqEyebrow="Validate the decision"
      faqTitle="Common questions before you choose"
    >
      <section className="mt-12 grid gap-5 md:grid-cols-3">
        <article className="rounded-lg border border-gray-200 bg-white p-5">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-blue-600">Quick answer</p>
          <h2 className="mb-3 text-lg font-semibold text-gray-950">What to try first</h2>
          <p className="text-sm leading-6 text-gray-700">{page.primaryAnswer}</p>
        </article>
        <article className="rounded-lg border border-gray-200 bg-white p-5">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-blue-600">Why</p>
          <h2 className="mb-3 text-lg font-semibold text-gray-950">Why this direction can work</h2>
          <p className="text-sm leading-6 text-gray-700">{page.whyItWorks}</p>
        </article>
        <article className="rounded-lg border border-gray-200 bg-white p-5">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-blue-600">Watch for</p>
          <h2 className="mb-3 text-lg font-semibold text-gray-950">What can make it look wrong</h2>
          <p className="text-sm leading-6 text-gray-700">{page.watchFor}</p>
        </article>
      </section>

      <section className="mt-12 rounded-lg border border-blue-100 bg-blue-50 p-6">
        <p className="mb-2 text-sm font-semibold text-blue-700">Decision tip</p>
        <h2 className="mb-3 text-2xl font-bold text-gray-950">Do not decide from the label alone</h2>
        <p className="max-w-3xl text-sm leading-7 text-gray-700">{page.decisionTip}</p>
        {page.relatedOwnerPath && (
          <Link
            href={`/${locale}${page.relatedOwnerPath}`}
            className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-blue-700 hover:text-blue-900"
          >
            Open the broader face-shape frame guide <ArrowRight className="h-4 w-4" />
          </Link>
        )}
      </section>

      <section className="mt-12">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-blue-600">Explore related decisions</p>
            <h2 className="text-2xl font-bold text-gray-950">More focused glasses guides</h2>
          </div>
          <Link href={`/${locale}/glasses-guide`} className="text-sm font-semibold text-blue-700 hover:text-blue-900">
            View all guides
          </Link>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {relatedPages.map((related) => (
            <Link
              key={related.slug}
              href={`/${locale}/glasses-guide/${related.slug}`}
              className="rounded-lg border border-gray-200 bg-white p-5 transition hover:border-blue-200 hover:shadow-sm"
            >
              <h3 className="mb-2 font-semibold text-gray-950">{related.title}</h3>
              <p className="text-sm leading-6 text-gray-600">{related.metaDescription}</p>
            </Link>
          ))}
        </div>
      </section>
    </SearchToToolLanding>
  )
}
