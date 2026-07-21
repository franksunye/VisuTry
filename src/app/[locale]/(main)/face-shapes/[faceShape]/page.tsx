import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowRight, CheckCircle2, Glasses, Ruler, Scissors } from 'lucide-react'
import {
  FACE_SHAPE_CONTENT,
  FACE_SHAPE_SLUGS,
  getFaceShapeContent,
} from '@/config/face-shape-content'
import type { Locale } from '@/i18n'
import { generateI18nSEO, generateStructuredData } from '@/lib/seo'
import { generateBreadcrumbSchema } from '@/lib/programmatic-seo'

interface FaceShapeGuidePageProps {
  params: { locale: string; faceShape: string }
}

export function generateStaticParams() {
  return FACE_SHAPE_SLUGS.map((faceShape) => ({ faceShape }))
}

export const dynamicParams = false
export const revalidate = 86400

export async function generateMetadata({ params }: FaceShapeGuidePageProps): Promise<Metadata> {
  const guide = getFaceShapeContent(params.faceShape)
  if (!guide) return { title: 'Face Shape Not Found' }

  return generateI18nSEO({
    locale: params.locale as Locale,
    title: `${guide.name} Face Shape: Features, Glasses and Hairstyles`,
    description: `${guide.shortDefinition} Learn how to identify a ${guide.name.toLowerCase()} face and choose glasses and hairstyles that work with its proportions.`,
    pathname: `/face-shapes/${guide.slug}`,
    noIndex: params.locale !== 'en',
    availableLocales: ['en'] as const,
  })
}

export default function FaceShapeGuidePage({ params }: FaceShapeGuidePageProps) {
  const guide = getFaceShapeContent(params.faceShape)
  if (!guide) notFound()

  const locale = params.locale
  const relatedGuides = guide.oftenConfusedWith.map((slug) => FACE_SHAPE_CONTENT[slug])
  const faqContent = [
    {
      question: `How do I know if my face shape is ${guide.name.toLowerCase()}?`,
      answer: `${guide.shortDefinition} Compare face length, forehead, cheekbones, jaw width, and jaw curvature together rather than relying on one feature.`,
    },
    {
      question: `What glasses suit a ${guide.name.toLowerCase()} face?`,
      answer: `${guide.glasses.tryFirst.join(', ')} are useful starting points. Frame width and lens depth still need to be checked on your own photo.`,
    },
    {
      question: `What hairstyles suit a ${guide.name.toLowerCase()} face?`,
      answer: `${guide.hairstyles.tryFirst.join(', ')} are practical options. Texture, hair type, maintenance, and personal preference matter as much as face shape.`,
    },
  ]
  const faqSchema = generateStructuredData('faqPage', { questions: faqContent })
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: `https://www.visutry.com/${locale}` },
    { name: 'Face Shapes', url: `https://www.visutry.com/${locale}/face-shapes` },
    { name: `${guide.name} Face`, url: `https://www.visutry.com/${locale}/face-shapes/${guide.slug}` },
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
          <span className="text-gray-950">{guide.name}</span>
        </nav>

        <section className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
          <div>
            <p className="mb-3 inline-flex rounded-lg border border-blue-200 bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700">
              {guide.name} face shape guide
            </p>
            <h1 className="mb-4 text-3xl font-bold leading-tight text-gray-950 md:text-5xl">
              {guide.name} Face Shape: How to Identify It
            </h1>
            <p className="mb-4 text-lg leading-8 text-gray-700">{guide.shortDefinition}</p>
            <p className="mb-6 leading-7 text-gray-600">{guide.definition}</p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href={`/${locale}/face-shape-detector`}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700"
              >
                Try the free detector
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href={`/${locale}/style/${guide.styleSlug}`}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 px-5 py-3 font-semibold text-gray-700 hover:bg-gray-50"
              >
                Glasses for {guide.name.toLowerCase()} faces
              </Link>
            </div>
          </div>

          <aside className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <Ruler className="h-5 w-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-950">Quick identification checklist</h2>
            </div>
            <ul className="grid gap-3">
              {guide.identify.map((item) => (
                <li key={item} className="flex gap-2 text-sm leading-6 text-gray-700">
                  <CheckCircle2 className="mt-1 h-4 w-4 flex-shrink-0 text-green-600" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </aside>
        </section>

        <section className="mt-12">
          <div className="mb-5 max-w-3xl">
            <h2 className="mb-3 text-2xl font-bold text-gray-950">Measurements that matter most</h2>
            <p className="leading-7 text-gray-600">
              Use a straight-on image with a neutral expression. Pull hair away from the outline and
              compare proportions, not millimeters taken from an uncalibrated photo.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {guide.measurements.map((item) => (
              <article key={item.label} className="rounded-lg border border-gray-200 bg-white p-5">
                <h3 className="mb-2 font-semibold text-gray-950">{item.label}</h3>
                <p className="text-sm leading-6 text-gray-600">{item.guidance}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-12 rounded-lg border border-blue-200 bg-blue-50 p-6">
          <h2 className="mb-2 text-xl font-bold text-blue-950">The practical styling goal</h2>
          <p className="leading-7 text-blue-900">{guide.balanceGoal}</p>
        </section>

        <section className="mt-12 grid gap-5 lg:grid-cols-2">
          <article className="rounded-lg border border-gray-200 bg-white p-6">
            <div className="mb-4 flex items-center gap-2">
              <Glasses className="h-5 w-5 text-blue-600" />
              <h2 className="text-xl font-bold text-gray-950">Glasses for {guide.name.toLowerCase()} faces</h2>
            </div>
            <p className="mb-4 text-sm leading-6 text-gray-600">{guide.glasses.rationale}</p>
            <ul className="mb-5 grid gap-2 text-sm text-gray-700">
              {guide.glasses.tryFirst.map((item) => (
                <li key={item} className="flex gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <Link href={`/${locale}/style/${guide.styleSlug}`} className="inline-flex items-center gap-1 font-semibold text-blue-700 hover:text-blue-900">
              Open the full glasses guide <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href={`/${locale}/sunglasses-for/${guide.styleSlug}`} className="mt-3 inline-flex items-center gap-1 font-semibold text-blue-700 hover:text-blue-900">
              Compare sunglasses for this face shape <ArrowRight className="h-4 w-4" />
            </Link>
          </article>

          <article className="rounded-lg border border-gray-200 bg-white p-6">
            <div className="mb-4 flex items-center gap-2">
              <Scissors className="h-5 w-5 text-blue-600" />
              <h2 className="text-xl font-bold text-gray-950">Hairstyles for {guide.name.toLowerCase()} faces</h2>
            </div>
            <p className="mb-4 text-sm leading-6 text-gray-600">{guide.hairstyles.rationale}</p>
            <ul className="mb-5 grid gap-2 text-sm text-gray-700">
              {guide.hairstyles.tryFirst.map((item) => (
                <li key={item} className="flex gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <Link href={`/${locale}/hairstyles-for/${guide.styleSlug}`} className="inline-flex items-center gap-1 font-semibold text-blue-700 hover:text-blue-900">
              Open the full hairstyle guide <ArrowRight className="h-4 w-4" />
            </Link>
          </article>
        </section>

        <section className="mt-12">
          <h2 className="mb-5 text-2xl font-bold text-gray-950">Often confused with {guide.name.toLowerCase()}</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {relatedGuides.map((related) => (
              <Link
                key={related.slug}
                href={`/${locale}/face-shapes/${related.slug}`}
                className="group rounded-lg border border-gray-200 bg-white p-5 hover:border-blue-300 hover:shadow-sm"
              >
                <h3 className="mb-2 text-lg font-semibold text-gray-950 group-hover:text-blue-700">{related.name} face</h3>
                <p className="text-sm leading-6 text-gray-600">{related.shortDefinition}</p>
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-12">
          <h2 className="mb-5 text-2xl font-bold text-gray-950">{guide.name} face FAQ</h2>
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
