import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Camera, CheckCircle2, Glasses, ScanFace } from 'lucide-react'
import { Locale } from '@/i18n'
import { generateI18nSEO, generateStructuredData } from '@/lib/seo'
import { FACE_SHAPE_SLUGS } from '@/config/face-shape-content'
import { getFaceShapeSeoCopy } from '@/config/face-shape-seo-locales'

type Props = {
  params: { locale: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const copy = getFaceShapeSeoCopy(params.locale)
  return generateI18nSEO({
    locale: params.locale as Locale,
    title: copy.glasses.metaTitle,
    description: copy.glasses.metaDescription,
    pathname: '/glasses-for-face-shape',
  })
}

export default function GlassesForFaceShapePage({ params }: Props) {
  const locale = params.locale
  const copy = getFaceShapeSeoCopy(locale)
  const faqSchema = generateStructuredData('faqPage', { questions: copy.glasses.faq })
  const howToSchema = generateStructuredData('howTo', {
    name: copy.glasses.title,
    description: copy.glasses.intro,
    totalTime: 'PT5M',
    steps: copy.glasses.steps.map((step) => ({ name: step.title, text: step.text })),
  })

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSchema) }}
      />

      <main className="mx-auto max-w-6xl px-4 py-8 md:py-12">
        <section className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <div>
            <p className="mb-3 inline-flex rounded-lg border border-blue-200 bg-white px-3 py-1 text-sm font-semibold text-blue-700">
              {copy.glasses.eyebrow}
            </p>
            <h1 className="mb-4 text-3xl font-bold leading-tight text-gray-950 md:text-5xl">
              {copy.glasses.title}
            </h1>
            <p className="mb-6 text-lg leading-8 text-gray-600">
              {copy.glasses.intro}
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href={`/${locale}/face-shape-detector`}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700"
              >
                {copy.glasses.detectorCta}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href={`/${locale}/try-on/glasses`}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 px-5 py-3 font-semibold text-gray-700 hover:bg-gray-50"
              >
                {copy.glasses.tryOnCta}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold">
              <Link href={locale === 'en' ? `/${locale}/face-shapes` : `/${locale}/face-shape-detector`} className="text-blue-700 hover:text-blue-900">
                {copy.glasses.faceShapesLink}
              </Link>
              {locale === 'en' && (
                <Link href={`/${locale}/hairstyles-for-face-shape`} className="text-blue-700 hover:text-blue-900">
                  {copy.glasses.hairstylesLink}
                </Link>
              )}
              <Link href={`/${locale}/sunglasses-for-face-shape`} className="text-blue-700 hover:text-blue-900">
                {copy.glasses.sunglassesLink}
              </Link>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {copy.glasses.steps.map((item, index) => {
              const icon = [ScanFace, Glasses, Camera][index]
              const Icon = icon
              return (
                <div key={item.title} className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h2 className="mb-2 text-base font-semibold text-gray-950">{item.title}</h2>
                  <p className="text-sm leading-6 text-gray-600">{item.text}</p>
                </div>
              )
            })}
          </div>
        </section>

        <section className="mt-12">
          <div className="mb-5 max-w-3xl">
            <h2 className="mb-3 text-2xl font-bold text-gray-950">
              {copy.glasses.guideTitle}
            </h2>
            <p className="text-sm leading-6 text-gray-600">
              {copy.glasses.guideIntro}
            </p>
          </div>

          <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
            <div className="min-w-[900px]">
              <div className="grid grid-cols-[0.9fr_1.45fr_1.2fr_1.55fr] gap-4 bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-700">
                {copy.glasses.columns.map((column) => <span key={column}>{column}</span>)}
              </div>
              {FACE_SHAPE_SLUGS.map((shape) => (
                <div
                  key={shape}
                  className="grid grid-cols-[0.9fr_1.45fr_1.2fr_1.55fr] gap-4 border-t border-gray-200 px-4 py-4 text-sm"
                >
                  <Link href={locale === 'en' ? `/${locale}/style/${shape}-face` : `/${locale}/face-shape-detector`} className="font-semibold text-blue-700 hover:text-blue-900">
                    {copy.shapeNames[shape]}
                  </Link>
                  <span className="text-gray-700">{copy.glasses.tryFirst[shape]}</span>
                  <span className="text-gray-600">{copy.glasses.avoidFirst[shape]}</span>
                  <span className="text-gray-600">{copy.glasses.reasons[shape]}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-12 grid gap-5 md:grid-cols-3">
          {copy.glasses.principles.map((item) => (
            <div key={item} className="flex gap-3 rounded-lg border border-gray-200 bg-white p-5">
              <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-600" />
              <p className="text-sm leading-6 text-gray-700">{item}</p>
            </div>
          ))}
        </section>

        <section className="mt-12 rounded-lg border border-gray-200 bg-white p-6">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="mb-2 text-sm font-semibold uppercase tracking-normal text-blue-600">
                {copy.glasses.nextEyebrow}
              </p>
              <h2 className="text-2xl font-bold text-gray-950">
                {copy.glasses.nextTitle}
              </h2>
            </div>
            <Link
              href={`/${locale}/face-shape-detector`}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-gray-950 px-4 py-3 text-sm font-semibold text-white hover:bg-gray-800"
            >
              {copy.glasses.detectorCta}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {copy.glasses.faq.map((item) => (
              <div key={item.question} className="rounded-lg border border-gray-200 p-5">
                <h3 className="mb-2 text-base font-semibold text-gray-950">{item.question}</h3>
                <p className="text-sm leading-6 text-gray-600">{item.answer}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </>
  )
}
