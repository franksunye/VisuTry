import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { COMBINATION_SEARCH_PAGES } from '@/config/search-combination-pages'
import type { Locale } from '@/i18n'
import { generateI18nSEO, generateStructuredData } from '@/lib/seo'

type Props = { params: { locale: string } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return generateI18nSEO({
    locale: params.locale as Locale,
    title: 'Glasses Guides by Face Shape, Frame Style & Fit Question | VisuTry',
    description:
      'Explore focused glasses decision guides by face shape, frame style, and fit question, then validate the shortlist with VisuTry tools.',
    pathname: '/glasses-guide',
    noIndex: params.locale !== 'en',
    availableLocales: ['en'] as const,
  })
}

export default function GlassesGuideHub({ params }: Props) {
  const locale = params.locale
  const groups = [
    {
      type: 'face-frame' as const,
      eyebrow: 'Face × frame',
      title: 'Frame styles for specific face shapes',
      description: 'Use these pages when you already have a frame direction in mind and want to test whether it makes sense for your face shape.',
    },
    {
      type: 'gender-style' as const,
      eyebrow: 'Styling intent',
      title: 'Styling guides by face shape',
      description: 'Use these pages as style-oriented shortlists, not rigid gender rules. Proportion and fit still lead the decision.',
    },
    {
      type: 'decision-question' as const,
      eyebrow: 'Decision questions',
      title: 'Direct answers to common glasses fit questions',
      description: 'Start with the question, get the short answer, then validate the choice with a photo or side-by-side comparison.',
    },
  ]

  const collectionSchema = generateStructuredData('breadcrumbList', {
    items: [
      { name: 'Home', url: `/${locale}` },
      { name: 'Glasses Guides', url: `/${locale}/glasses-guide` },
    ],
  })

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }} />
      <main className="mx-auto max-w-6xl px-4 py-10 md:py-14">
        <section className="max-w-3xl">
          <p className="mb-3 inline-flex rounded-lg border border-blue-200 bg-white px-3 py-1 text-sm font-semibold text-blue-700">
            Focused eyewear decisions
          </p>
          <h1 className="mb-4 text-3xl font-bold leading-tight text-gray-950 md:text-5xl">
            Glasses Guides by Face Shape, Frame Style & Fit Question
          </h1>
          <p className="text-lg leading-8 text-gray-600">
            These pages are built around one decision at a time. Read the short answer, then move directly into face-shape detection, personalized advice, virtual try-on, or frame compare.
          </p>
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
                      Open guide <ArrowRight className="h-4 w-4" />
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          )
        })}
      </main>
    </>
  )
}
