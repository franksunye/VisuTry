import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { AlertTriangle, ArrowRight, CheckCircle2, Scissors, Sparkles } from 'lucide-react'
import {
  FACE_SHAPE_CONTENT,
  FACE_SHAPE_SLUGS,
  getFaceShapeContent,
} from '@/config/face-shape-content'
import type { Locale } from '@/i18n'
import { generateI18nSEO, generateStructuredData } from '@/lib/seo'
import { generateBreadcrumbSchema } from '@/lib/programmatic-seo'

interface HairstyleGuidePageProps {
  params: { locale: string; faceShape: string }
}

export function generateStaticParams() {
  return FACE_SHAPE_SLUGS.map((slug) => ({ faceShape: `${slug}-face` }))
}

export const dynamicParams = false
export const dynamic = 'force-static'

export async function generateMetadata({ params }: HairstyleGuidePageProps): Promise<Metadata> {
  const guide = getFaceShapeContent(params.faceShape)
  if (!guide) return { title: 'Hairstyle Guide Not Found' }

  return generateI18nSEO({
    locale: params.locale as Locale,
    title: `Best Hairstyles for ${guide.name} Faces: Cuts and Styling`,
    description: `Explore hairstyles for ${guide.name.toLowerCase()} faces, including practical guidance on length, layers, fringe, parting, and where to place volume.`,
    pathname: `/hairstyles-for/${guide.styleSlug}`,
    noIndex: params.locale !== 'en',
    availableLocales: ['en'] as const,
  })
}

export default function HairstyleGuidePage({ params }: HairstyleGuidePageProps) {
  const guide = getFaceShapeContent(params.faceShape)
  if (!guide) notFound()

  const locale = params.locale
  const relatedGuides = guide.oftenConfusedWith.map((slug) => FACE_SHAPE_CONTENT[slug])
  const faqContent = [
    {
      question: `What hairstyle is best for a ${guide.name.toLowerCase()} face?`,
      answer: `${guide.hairstyles.tryFirst.join(', ')} are useful starting points. The best version depends on hair texture, density, maintenance, and the features you want to emphasize.`,
    },
    {
      question: `Should a ${guide.name.toLowerCase()} face avoid any haircut?`,
      answer: `${guide.hairstyles.reconsider.join(' and ')} may reinforce the dominant proportion. They are not forbidden; adjust the parting, texture, fringe, or ending point if you like the cut.`,
    },
    {
      question: 'Is face shape enough to choose a haircut?',
      answer: 'No. Face shape helps with visual balance, but a stylist must also consider texture, density, growth pattern, condition, maintenance, and lifestyle.',
    },
  ]
  const faqSchema = generateStructuredData('faqPage', { questions: faqContent })
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: `https://www.visutry.com/${locale}` },
    { name: 'Hairstyles by Face Shape', url: `https://www.visutry.com/${locale}/hairstyles-for-face-shape` },
    { name: `${guide.name} Face Hairstyles`, url: `https://www.visutry.com/${locale}/hairstyles-for/${guide.styleSlug}` },
  ])

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <main className="mx-auto max-w-6xl px-4 py-8 md:py-12">
        <nav className="mb-6 flex flex-wrap items-center gap-2 text-sm text-gray-600" aria-label="Breadcrumb">
          <Link href={`/${locale}`} className="hover:text-gray-950">Home</Link>
          <span aria-hidden="true">/</span>
          <Link href={`/${locale}/hairstyles-for-face-shape`} className="hover:text-gray-950">Hairstyles by face shape</Link>
          <span aria-hidden="true">/</span>
          <span className="text-gray-950">{guide.name}</span>
        </nav>

        <section className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
          <div>
            <p className="mb-3 inline-flex rounded-lg border border-violet-200 bg-violet-50 px-3 py-1 text-sm font-semibold text-violet-700">
              {guide.name} face hairstyle guide
            </p>
            <h1 className="mb-4 text-3xl font-bold leading-tight text-gray-950 md:text-5xl">
              Best Hairstyles for {guide.name} Faces
            </h1>
            <p className="mb-4 text-lg leading-8 text-gray-700">{guide.hairstyles.rationale}</p>
            <p className="mb-6 leading-7 text-gray-600">
              The goal is not to hide your face shape. Use length, texture, fringe, and volume to
              create the balance—or emphasis—you prefer.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href={`/${locale}/face-shapes/${guide.slug}`}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-violet-600 px-5 py-3 font-semibold text-white hover:bg-violet-700"
              >
                Check {guide.name.toLowerCase()} face features
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href={`/${locale}/style/${guide.styleSlug}`}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 px-5 py-3 font-semibold text-gray-700 hover:bg-gray-50"
              >
                See matching glasses
              </Link>
            </div>
          </div>

          <aside className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-violet-600" />
              <h2 className="text-lg font-semibold text-gray-950">Styling principles</h2>
            </div>
            <ul className="grid gap-3">
              {guide.hairstyles.principles.map((item) => (
                <li key={item} className="flex gap-2 text-sm leading-6 text-gray-700">
                  <CheckCircle2 className="mt-1 h-4 w-4 flex-shrink-0 text-green-600" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </aside>
        </section>

        <section className="mt-12">
          <h2 className="mb-5 text-2xl font-bold text-gray-950">Cuts and styles to try first</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {guide.hairstyles.tryFirst.map((item, index) => (
              <article key={item} className="rounded-lg border border-gray-200 bg-white p-5">
                <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-full bg-violet-100 text-sm font-bold text-violet-700">
                  {index + 1}
                </div>
                <h3 className="font-semibold text-gray-950">{item}</h3>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-12 grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
          <article className="rounded-lg border border-gray-200 bg-white p-6">
            <div className="mb-4 flex items-center gap-2">
              <Scissors className="h-5 w-5 text-violet-600" />
              <h2 className="text-xl font-bold text-gray-950">How to adapt the recommendation</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                { title: 'Fine or low-density hair', text: 'Use fewer, more intentional layers so the ends retain visible fullness.' },
                { title: 'Thick or dense hair', text: 'Ask for internal weight removal and controlled layers rather than adding width everywhere.' },
                { title: 'Wavy or curly hair', text: 'Judge the cut at its dry, natural shape because curl shrinkage changes the ending point and volume.' },
                { title: 'Low-maintenance routine', text: 'Prioritize a cut that works with your natural part and texture before optimizing face-shape theory.' },
              ].map((item) => (
                <div key={item.title}>
                  <h3 className="mb-1 font-semibold text-gray-950">{item.title}</h3>
                  <p className="text-sm leading-6 text-gray-600">{item.text}</p>
                </div>
              ))}
            </div>
          </article>

          <aside className="rounded-lg border border-amber-200 bg-amber-50 p-6">
            <div className="mb-3 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-700" />
              <h2 className="text-lg font-semibold text-amber-950">Reconsider, not “never”</h2>
            </div>
            <ul className="mb-4 grid gap-2 text-sm leading-6 text-amber-900">
              {guide.hairstyles.reconsider.map((item) => (
                <li key={item}>• {item}</li>
              ))}
            </ul>
            <p className="text-sm leading-6 text-amber-900">
              If you like one of these styles, ask how a different part, fringe, layer position, or
              finish could keep the look while changing its visual emphasis.
            </p>
          </aside>
        </section>

        <section className="mt-12">
          <h2 className="mb-5 text-2xl font-bold text-gray-950">Related face-shape hairstyle guides</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {relatedGuides.map((related) => (
              <Link
                key={related.slug}
                href={`/${locale}/hairstyles-for/${related.styleSlug}`}
                className="group rounded-lg border border-gray-200 bg-white p-5 hover:border-violet-300 hover:shadow-sm"
              >
                <h3 className="mb-2 text-lg font-semibold text-gray-950 group-hover:text-violet-700">Hairstyles for {related.name} faces</h3>
                <p className="text-sm leading-6 text-gray-600">{related.hairstyles.rationale}</p>
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-12">
          <h2 className="mb-5 text-2xl font-bold text-gray-950">{guide.name} face hairstyle FAQ</h2>
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
