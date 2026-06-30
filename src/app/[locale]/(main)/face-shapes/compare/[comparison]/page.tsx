import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowRight, CheckCircle2, GitCompareArrows, ScanFace } from 'lucide-react'
import {
  FACE_SHAPE_COMPARISON_SLUGS,
  getFaceShapeComparison,
} from '@/config/face-shape-comparisons'
import { FACE_SHAPE_CONTENT } from '@/config/face-shape-content'
import type { Locale } from '@/i18n'
import { generateI18nSEO, generateStructuredData } from '@/lib/seo'
import { generateBreadcrumbSchema } from '@/lib/programmatic-seo'

interface FaceShapeComparisonPageProps {
  params: { locale: string; comparison: string }
}

export function generateStaticParams() {
  return FACE_SHAPE_COMPARISON_SLUGS.map((comparison) => ({ comparison }))
}

export const dynamicParams = false
export const revalidate = 86400

export async function generateMetadata({ params }: FaceShapeComparisonPageProps): Promise<Metadata> {
  const comparison = getFaceShapeComparison(params.comparison)
  if (!comparison) return { title: 'Face Shape Comparison Not Found' }

  const first = FACE_SHAPE_CONTENT[comparison.first]
  const second = FACE_SHAPE_CONTENT[comparison.second]
  return generateI18nSEO({
    locale: params.locale as Locale,
    title: `${first.name} vs ${second.name} Face Shape: Key Differences`,
    description: `Compare ${first.name.toLowerCase()} and ${second.name.toLowerCase()} face shapes by length, width, jawline, and outline. Use practical checks to decide which description fits better.`,
    pathname: `/face-shapes/compare/${comparison.slug}`,
  })
}

export default function FaceShapeComparisonPage({ params }: FaceShapeComparisonPageProps) {
  const comparison = getFaceShapeComparison(params.comparison)
  if (!comparison) notFound()

  const locale = params.locale
  const first = FACE_SHAPE_CONTENT[comparison.first]
  const second = FACE_SHAPE_CONTENT[comparison.second]
  const faqContent = [
    {
      question: `What is the main difference between ${first.name.toLowerCase()} and ${second.name.toLowerCase()} face shapes?`,
      answer: comparison.keyDifference,
    },
    {
      question: `Can a face be both ${first.name.toLowerCase()} and ${second.name.toLowerCase()}?`,
      answer: 'Yes. Face-shape categories overlap, and a primary plus secondary description can be more useful than forcing one label. Use the widest zones and jaw structure to identify the dominant pattern.',
    },
    {
      question: 'Does hairstyle or body weight change face shape?',
      answer: 'Hair can hide the outline and soft tissue can change how proportions appear, but neither should replace a straight-on comparison of forehead, cheekbones, jaw, and face length.',
    },
  ]
  const faqSchema = generateStructuredData('faqPage', { questions: faqContent })
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: `https://www.visutry.com/${locale}` },
    { name: 'Face Shapes', url: `https://www.visutry.com/${locale}/face-shapes` },
    { name: `${first.name} vs ${second.name}`, url: `https://www.visutry.com/${locale}/face-shapes/compare/${comparison.slug}` },
  ])

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <main className="mx-auto max-w-6xl px-4 py-8 md:py-12">
        <nav className="mb-6 flex flex-wrap items-center gap-2 text-sm text-gray-600" aria-label="Breadcrumb">
          <Link href={`/${locale}`} className="hover:text-gray-950">Home</Link>
          <span aria-hidden="true">/</span>
          <Link href={`/${locale}/face-shapes`} className="hover:text-gray-950">Face shapes</Link>
          <span aria-hidden="true">/</span>
          <span className="text-gray-950">{first.name} vs {second.name}</span>
        </nav>

        <section className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div>
            <p className="mb-3 inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700">
              <GitCompareArrows className="h-4 w-4" />
              High-confusion comparison
            </p>
            <h1 className="mb-4 text-3xl font-bold leading-tight text-gray-950 md:text-5xl">
              {first.name} vs {second.name} Face Shape
            </h1>
            <p className="mb-4 text-lg leading-8 text-gray-700">{comparison.summary}</p>
            <p className="mb-6 rounded-lg border border-blue-200 bg-white p-4 font-semibold leading-7 text-blue-950">
              {comparison.keyDifference}
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href={`/${locale}/face-shape-detector`}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700"
              >
                Try the free detector
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href={`/${locale}/face-shape-measurement`}
                className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-5 py-3 font-semibold text-gray-700 hover:bg-gray-50"
              >
                Measure manually
              </Link>
            </div>
          </div>

          <aside className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <ScanFace className="h-5 w-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-950">Three self-checks</h2>
            </div>
            <ul className="grid gap-3">
              {comparison.selfChecks.map((item) => (
                <li key={item} className="flex gap-2 text-sm leading-6 text-gray-700">
                  <CheckCircle2 className="mt-1 h-4 w-4 flex-shrink-0 text-green-600" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </aside>
        </section>

        <section className="mt-12">
          <h2 className="mb-5 text-2xl font-bold text-gray-950">Side-by-side differences</h2>
          <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
            <div className="min-w-[760px]">
              <div className="grid grid-cols-[0.8fr_1.25fr_1.25fr] gap-4 bg-gray-50 px-5 py-3 text-sm font-semibold text-gray-700">
                <span>Feature</span>
                <span>{first.name}</span>
                <span>{second.name}</span>
              </div>
              {comparison.signals.map((signal) => (
                <div key={signal.feature} className="grid grid-cols-[0.8fr_1.25fr_1.25fr] gap-4 border-t border-gray-200 px-5 py-4 text-sm leading-6">
                  <span className="font-semibold text-gray-950">{signal.feature}</span>
                  <span className="text-gray-700">{signal.first}</span>
                  <span className="text-gray-700">{signal.second}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-12 grid gap-5 lg:grid-cols-2">
          {[first, second].map((guide) => (
            <article key={guide.slug} className="rounded-lg border border-gray-200 bg-white p-6">
              <h2 className="mb-3 text-xl font-bold text-gray-950">If your face is mainly {guide.name.toLowerCase()}</h2>
              <p className="mb-4 text-sm leading-6 text-gray-600">{guide.definition}</p>
              <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold">
                <Link href={`/${locale}/face-shapes/${guide.slug}`} className="text-blue-700 hover:text-blue-900">Full shape guide</Link>
                <Link href={`/${locale}/style/${guide.styleSlug}`} className="text-blue-700 hover:text-blue-900">Glasses</Link>
                <Link href={`/${locale}/hairstyles-for/${guide.styleSlug}`} className="text-blue-700 hover:text-blue-900">Hairstyles</Link>
              </div>
            </article>
          ))}
        </section>

        <section className="mt-12">
          <h2 className="mb-5 text-2xl font-bold text-gray-950">{first.name} vs {second.name} FAQ</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {faqContent.map((item) => (
              <article key={item.question} className="rounded-lg border border-gray-200 bg-white p-5">
                <h3 className="mb-2 font-semibold text-gray-950">{item.question}</h3>
                <p className="text-sm leading-6 text-gray-600">{item.answer}</p>
              </article>
            ))}
          </div>
        </section>
      </main>
    </>
  )
}
