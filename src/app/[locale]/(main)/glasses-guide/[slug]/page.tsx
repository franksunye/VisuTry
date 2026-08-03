import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowRight, Glasses, ScanFace, SlidersHorizontal } from 'lucide-react'
import { SearchToToolLanding } from '@/components/growth/SearchToToolLanding'
import { COMBINATION_SEARCH_PAGES } from '@/config/search-combination-pages'
import {
  getCombinationGuideShellCopy,
  getLocalizedCombinationSearchPage,
  getLocalizedCombinationSearchPages,
} from '@/config/search-combination-locales'
import type { Locale } from '@/i18n'
import { generateStructuredData } from '@/lib/seo'
import { generateSearchToToolSEO } from '@/lib/search-to-tool-seo'

type Props = {
  params: { locale: string; slug: string }
}

export function generateStaticParams() {
  return COMBINATION_SEARCH_PAGES.map((page) => ({ slug: page.slug }))
}

export const dynamicParams = false
export const revalidate = 3600

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const page = getLocalizedCombinationSearchPage(params.locale, params.slug)
  if (!page) {
    return { title: 'Guide Not Found', robots: { index: false, follow: false } }
  }

  return generateSearchToToolSEO({
    locale: params.locale as Locale,
    title: `${page.title} | VisuTry`,
    description: page.metaDescription,
    pathname: `/glasses-guide/${page.slug}`,
  })
}

export default function CombinationSearchPage({ params }: Props) {
  const page = getLocalizedCombinationSearchPage(params.locale, params.slug)
  if (!page) notFound()

  const locale = params.locale
  const shell = getCombinationGuideShellCopy(locale)
  const pathname = `/glasses-guide/${page.slug}`
  const localizedPages = getLocalizedCombinationSearchPages(locale)
  const relatedPages = localizedPages
    .filter((item) => item.slug !== page.slug && item.type === page.type)
    .slice(0, 4)

  const schemas = [
    generateStructuredData('faqPage', { questions: page.faq }),
    generateStructuredData('howTo', {
      name: page.title,
      description: page.metaDescription,
      totalTime: 'PT5M',
      steps: [
        { name: shell.howToStart, text: page.primaryAnswer },
        { name: shell.howToCheck, text: page.watchFor },
        { name: shell.howToValidate, text: page.decisionTip },
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
          title: shell.stepShortlist,
          text: page.primaryAnswer,
          icon: Glasses,
        },
        {
          title: shell.stepCheck,
          text: page.watchFor,
          icon: SlidersHorizontal,
        },
        {
          title: shell.stepValidate,
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
        shell.visualDisclaimer,
      ]}
      faq={page.faq}
      faqEyebrow={shell.faqEyebrow}
      faqTitle={shell.faqTitle}
    >
      <section className="mt-12 grid gap-5 md:grid-cols-3">
        <article className="rounded-lg border border-gray-200 bg-white p-5">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-blue-600">{shell.quickAnswer}</p>
          <h2 className="mb-3 text-lg font-semibold text-gray-950">{shell.whatToTryFirst}</h2>
          <p className="text-sm leading-6 text-gray-700">{page.primaryAnswer}</p>
        </article>
        <article className="rounded-lg border border-gray-200 bg-white p-5">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-blue-600">{shell.why}</p>
          <h2 className="mb-3 text-lg font-semibold text-gray-950">{shell.whyDirection}</h2>
          <p className="text-sm leading-6 text-gray-700">{page.whyItWorks}</p>
        </article>
        <article className="rounded-lg border border-gray-200 bg-white p-5">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-blue-600">{shell.watchFor}</p>
          <h2 className="mb-3 text-lg font-semibold text-gray-950">{shell.whatCanGoWrong}</h2>
          <p className="text-sm leading-6 text-gray-700">{page.watchFor}</p>
        </article>
      </section>

      <section className="mt-12 rounded-lg border border-blue-100 bg-blue-50 p-6">
        <p className="mb-2 text-sm font-semibold text-blue-700">{shell.decisionTip}</p>
        <h2 className="mb-3 text-2xl font-bold text-gray-950">{shell.doNotDecideFromLabel}</h2>
        <p className="max-w-3xl text-sm leading-7 text-gray-700">{page.decisionTip}</p>
        {page.relatedOwnerPath && (
          <Link
            href={`/${locale}${page.relatedOwnerPath}`}
            className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-blue-700 hover:text-blue-900"
          >
            {shell.openBroaderGuide} <ArrowRight className="h-4 w-4" />
          </Link>
        )}
      </section>

      <section className="mt-12">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-blue-600">{shell.exploreRelated}</p>
            <h2 className="text-2xl font-bold text-gray-950">{shell.moreFocusedGuides}</h2>
          </div>
          <Link href={`/${locale}/glasses-guide`} className="text-sm font-semibold text-blue-700 hover:text-blue-900">
            {shell.viewAllGuides}
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
