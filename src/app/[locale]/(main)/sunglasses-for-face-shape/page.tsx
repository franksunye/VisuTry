import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, CheckCircle2, Glasses, ScanFace, Sun } from 'lucide-react'
import { SUNGLASSES_FACE_SHAPE_GUIDES } from '@/config/sunglasses-face-shape-content'
import { FACE_SHAPE_SLUGS } from '@/config/face-shape-content'
import { getTopPickPresetById } from '@/config/glasses-presets'
import type { Locale } from '@/i18n'
import { generateI18nSEO, generateStructuredData } from '@/lib/seo'
import { generateBreadcrumbSchema } from '@/lib/programmatic-seo'
import { getFaceShapeSeoCopy, interpolateSeoCopy } from '@/config/face-shape-seo-locales'

interface SunglassesHubPageProps {
  params: { locale: string }
}

export async function generateMetadata({ params }: SunglassesHubPageProps): Promise<Metadata> {
  const copy = getFaceShapeSeoCopy(params.locale)
  return generateI18nSEO({
    locale: params.locale as Locale,
    title: copy.sunglasses.metaTitle,
    description: copy.sunglasses.metaDescription,
    pathname: '/sunglasses-for-face-shape',
  })
}

export default function SunglassesForFaceShapePage({ params }: SunglassesHubPageProps) {
  const locale = params.locale
  const copy = getFaceShapeSeoCopy(locale)
  const faqSchema = generateStructuredData('faqPage', { questions: copy.sunglasses.faq })
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: `https://www.visutry.com/${locale}` },
    { name: copy.sunglasses.title, url: `https://www.visutry.com/${locale}/sunglasses-for-face-shape` },
  ])

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

      <main className="mx-auto max-w-6xl px-4 py-8 md:py-12">
        <nav className="mb-6 flex items-center gap-2 text-sm text-gray-600" aria-label="Breadcrumb">
          <Link href={`/${locale}`} className="hover:text-gray-950">Home</Link>
          <span aria-hidden="true">/</span>
          <span className="text-gray-950">{copy.sunglasses.title}</span>
        </nav>

        <section className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div>
            <p className="mb-3 inline-flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-1 text-sm font-semibold text-amber-800">
              <Sun className="h-4 w-4" />
              {copy.sunglasses.eyebrow}
            </p>
            <h1 className="mb-4 text-3xl font-bold leading-tight text-gray-950 md:text-5xl">
              {copy.sunglasses.title}
            </h1>
            <p className="mb-6 max-w-3xl text-lg leading-8 text-gray-600">
              {copy.sunglasses.intro}
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href={`/${locale}/face-shape-detector`}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700"
              >
                {copy.sunglasses.detectorCta}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href={`/${locale}/style-explorer`}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 px-5 py-3 font-semibold text-gray-700 hover:bg-gray-50"
              >
                {copy.sunglasses.explorerCta}
              </Link>
            </div>
          </div>

          <aside className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-xl font-bold text-gray-950">{copy.sunglasses.processTitle}</h2>
            <div className="grid gap-4">
              {copy.sunglasses.process.map(({ title, text }, index) => {
                const Icon = [ScanFace, Glasses, CheckCircle2][index]
                return (
                <div key={title} className="flex gap-3">
                  <Icon className="mt-1 h-5 w-5 flex-shrink-0 text-blue-600" />
                  <div>
                    <h3 className="font-semibold text-gray-950">{title}</h3>
                    <p className="mt-1 text-sm leading-6 text-gray-600">{text}</p>
                  </div>
                </div>
                )
              })}
            </div>
          </aside>
        </section>

        <section className="mt-12">
          <div className="mb-6 max-w-3xl">
            <h2 className="mb-3 text-2xl font-bold text-gray-950">{copy.sunglasses.guidesTitle}</h2>
            <p className="leading-7 text-gray-600">
              {copy.sunglasses.guidesIntro}
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {FACE_SHAPE_SLUGS.map((shape) => {
              const guide = SUNGLASSES_FACE_SHAPE_GUIDES[shape]
              const preset = getTopPickPresetById(guide.bestStyles[0].presetId)
              return (
                <article key={shape} className="flex flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
                  {preset && (
                    <div className="relative h-48 overflow-hidden bg-gray-100">
                      <Image
                        src={`/${preset.assetPath}`}
                        alt={`${preset.name} · ${copy.shapeNames[shape]}`}
                        width={640}
                        height={420}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  )}
                  <div className="flex flex-1 flex-col p-5">
                    <p className="mb-2 text-sm font-semibold uppercase text-blue-600">{copy.shapeNames[shape]}</p>
                    <h3 className="mb-3 text-xl font-bold text-gray-950">{interpolateSeoCopy(copy.sunglasses.cardTitleTemplate, { shape: copy.shapeNames[shape] })}</h3>
                    <p className="mb-5 flex-1 text-sm leading-6 text-gray-600">{copy.sunglasses.goals[shape]}</p>
                    <Link
                      href={`/${locale}/sunglasses-for/${guide.slug}`}
                      className="inline-flex items-center gap-1 font-semibold text-blue-700 hover:text-blue-900"
                    >
                      {copy.sunglasses.cardLink} <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </article>
              )
            })}
          </div>
        </section>

        <section className="mt-12 grid gap-5 lg:grid-cols-2">
          <article className="rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="mb-3 text-xl font-bold text-gray-950">{copy.sunglasses.howToTitle}</h2>
            <ol className="grid gap-3 text-sm leading-6 text-gray-700">
              {copy.sunglasses.howToSteps.map((step, index) => <li key={step}><strong>{index + 1}.</strong> {step}</li>)}
            </ol>
          </article>
          <article className="rounded-lg border border-amber-200 bg-amber-50 p-6">
            <h2 className="mb-3 text-xl font-bold text-amber-950">{copy.sunglasses.safetyTitle}</h2>
            <p className="text-sm leading-6 text-amber-900">
              {copy.sunglasses.safetyText}
            </p>
          </article>
        </section>

        <section className="mt-12">
          <h2 className="mb-5 text-2xl font-bold text-gray-950">{copy.sunglasses.faqTitle}</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {copy.sunglasses.faq.map((item) => (
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
