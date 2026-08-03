import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { CheckCircle2 } from 'lucide-react'
import {
  ProductContinuationCtas,
  type ProductContinuationAction,
} from '@/components/growth/ProductContinuationCtas'
import { getSearchToToolShellCopy } from '@/config/search-to-tool-shell-locales'

export type SearchToToolFaqItem = {
  question: string
  answer: string
}

export type SearchToToolStep = {
  title: string
  text: string
  icon?: LucideIcon
}

export type SearchToToolLandingProps = {
  locale: string
  sourcePage: string
  queryCluster: string
  contentCluster?: string
  eyebrow: string
  title: string
  intro: string
  schemas?: object[]
  visual?: ReactNode
  steps?: readonly SearchToToolStep[]
  /** Content rendered under the hero CTAs (related links, notes). */
  afterCtas?: ReactNode
  /** Middle-of-page content unique to the query cluster. */
  children?: ReactNode
  faq?: readonly SearchToToolFaqItem[]
  faqTitle?: string
  faqEyebrow?: string
  ctaLabels?: {
    detector?: string
    tryOn?: string
    compare?: string
    advisor?: string
  }
  /** Defaults to Detector + Try-On + Compare. */
  includeCtas?: ProductContinuationAction[]
  /** FAQ/footer continuation actions. Defaults to Detector for compatibility. */
  bottomCtas?: ProductContinuationAction[]
  principles?: readonly string[]
}

/**
 * Reusable Search→Tool landing shell: hero, tracked product CTAs, optional
 * steps/visual, cluster-specific body, FAQ, and schema JSON-LD.
 */
export function SearchToToolLanding({
  locale,
  sourcePage,
  queryCluster,
  contentCluster = 'search-tool',
  eyebrow,
  title,
  intro,
  schemas = [],
  visual,
  steps,
  afterCtas,
  children,
  faq,
  faqTitle,
  faqEyebrow,
  ctaLabels,
  includeCtas = ['detector', 'try_on', 'compare'],
  bottomCtas = ['detector'],
  principles,
}: SearchToToolLandingProps) {
  const shellCopy = getSearchToToolShellCopy(locale)
  const resolvedFaqTitle = faqTitle ?? shellCopy.commonQuestions
  const resolvedFaqEyebrow = faqEyebrow ?? shellCopy.nextStep

  return (
    <>
      {schemas.map((schema, index) => (
        <script
          // Schema order is stable for a given page definition.
          key={`schema-${index}`}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}

      <main className="mx-auto max-w-6xl px-4 py-8 md:py-12">
        <section className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <div>
            <p className="mb-3 inline-flex rounded-lg border border-blue-200 bg-white px-3 py-1 text-sm font-semibold text-blue-700">
              {eyebrow}
            </p>
            <h1 className="mb-4 text-3xl font-bold leading-tight text-gray-950 md:text-5xl">
              {title}
            </h1>
            <p className="mb-6 text-lg leading-8 text-gray-600">{intro}</p>
            <ProductContinuationCtas
              locale={locale}
              sourcePage={sourcePage}
              queryCluster={queryCluster}
              contentCluster={contentCluster}
              ctaLocation="hero"
              labels={ctaLabels}
              include={includeCtas}
            />
            {afterCtas}
          </div>

          {visual ? (
            visual
          ) : steps && steps.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-3">
              {steps.map((item) => {
                const Icon = item.icon
                return (
                  <div
                    key={item.title}
                    className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm"
                  >
                    {Icon && (
                      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                        <Icon className="h-5 w-5" />
                      </div>
                    )}
                    <h2 className="mb-2 text-base font-semibold text-gray-950">{item.title}</h2>
                    <p className="text-sm leading-6 text-gray-600">{item.text}</p>
                  </div>
                )
              })}
            </div>
          ) : null}
        </section>

        {children}

        {principles && principles.length > 0 && (
          <section className="mt-12 grid gap-5 md:grid-cols-3">
            {principles.map((item) => (
              <div key={item} className="flex gap-3 rounded-lg border border-gray-200 bg-white p-5">
                <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-600" />
                <p className="text-sm leading-6 text-gray-700">{item}</p>
              </div>
            ))}
          </section>
        )}

        {faq && faq.length > 0 && (
          <section className="mt-12 rounded-lg border border-gray-200 bg-white p-6">
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="mb-2 text-sm font-semibold uppercase tracking-normal text-blue-600">
                  {resolvedFaqEyebrow}
                </p>
                <h2 className="text-2xl font-bold text-gray-950">{resolvedFaqTitle}</h2>
              </div>
              {bottomCtas.length > 0 && (
                <ProductContinuationCtas
                  locale={locale}
                  sourcePage={sourcePage}
                  queryCluster={queryCluster}
                  contentCluster={contentCluster}
                  ctaLocation="faq"
                  labels={ctaLabels}
                  include={bottomCtas}
                  layout="compact"
                />
              )}
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {faq.map((item) => (
                <div key={item.question} className="rounded-lg border border-gray-200 p-5">
                  <h3 className="mb-2 text-base font-semibold text-gray-950">{item.question}</h3>
                  <p className="text-sm leading-6 text-gray-600">{item.answer}</p>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </>
  )
}
