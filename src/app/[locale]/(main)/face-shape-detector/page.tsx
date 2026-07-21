import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, CheckCircle2, LockKeyhole, ScanFace, ShieldCheck } from 'lucide-react'
import { FreeFaceShapeDetector } from '@/components/face-shape/FreeFaceShapeDetector'
import type { Locale } from '@/i18n'
import { generateI18nSEO, generateStructuredData } from '@/lib/seo'
import { getFaceShapeSeoCopy } from '@/config/face-shape-seo-locales'

interface FaceShapeDetectorPageProps {
  params: { locale: string }
}

export const dynamic = 'force-static'

export async function generateMetadata({ params }: FaceShapeDetectorPageProps): Promise<Metadata> {
  const copy = getFaceShapeSeoCopy(params.locale)
  return generateI18nSEO({
    locale: params.locale as Locale,
    title: copy.detector.metaTitle,
    description: copy.detector.metaDescription,
    pathname: '/face-shape-detector',
  })
}

export default function FaceShapeDetectorPage({ params }: FaceShapeDetectorPageProps) {
  const locale = params.locale
  const copy = getFaceShapeSeoCopy(locale)
  const faqSchema = generateStructuredData('faqPage', { questions: copy.detector.faq })
  const appSchema = generateStructuredData('softwareApplication', {
    name: copy.detector.title,
    url: `https://www.visutry.com/${locale}/face-shape-detector`,
    applicationCategory: 'LifestyleApplication',
    operatingSystem: 'Web Browser',
    description: copy.detector.metaDescription,
    featureList: [
      'No login or credits required',
      'Photo processed in browser memory',
      'Seven face-shape categories',
      'Live facial landmark mesh',
      'Six visualized measurement details',
      'Input quality and pose checks',
    ],
  })
  const howToSchema = generateStructuredData('howTo', {
    name: copy.detector.title,
    description: copy.detector.intro,
    totalTime: 'PT1M',
    steps: [
      ...copy.detector.tips.slice(0, 3).map((text, index) => ({ name: `${index + 1}`, text })),
    ],
  })

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(appSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSchema) }} />
      <main className="bg-gradient-to-b from-blue-50 via-white to-white">
        <section className="mx-auto max-w-6xl px-4 py-10 md:py-14">
          <div className="mx-auto mb-9 max-w-4xl text-center">
            <p className="mb-3 inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-white px-3 py-1 text-sm font-semibold text-blue-700 shadow-sm">
              <ScanFace className="h-4 w-4" />
              {copy.detector.badge}
            </p>
            <h1 className="mb-4 text-4xl font-bold leading-tight text-gray-950 md:text-6xl">
              {copy.detector.title}
            </h1>
            <p className="mx-auto max-w-3xl text-lg leading-8 text-gray-600">
              {copy.detector.intro}
            </p>
          </div>

          <FreeFaceShapeDetector locale={locale} />

          <section className="mt-10 grid gap-4 md:grid-cols-3">
            {copy.detector.trust.map(({ title, text }, index) => {
              const Icon = [LockKeyhole, ScanFace, ShieldCheck][index]
              return (
              <article key={title} className="rounded-lg border border-gray-200 bg-white p-5">
                <Icon className="mb-3 h-5 w-5 text-blue-600" />
                <h2 className="mb-2 font-semibold text-gray-950">{title}</h2>
                <p className="text-sm leading-6 text-gray-600">{text}</p>
              </article>
              )
            })}
          </section>

          <section className="mt-12 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
            <article className="rounded-lg border border-gray-200 bg-white p-6">
              <h2 className="mb-4 text-2xl font-bold text-gray-950">{copy.detector.tipsTitle}</h2>
              <ul className="grid gap-3 text-sm leading-6 text-gray-700">
                {copy.detector.tips.map((item) => (
                  <li key={item} className="flex gap-2">
                    <CheckCircle2 className="mt-1 h-4 w-4 flex-shrink-0 text-green-600" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </article>

            <article className="rounded-lg border border-gray-200 bg-gray-50 p-6">
              <h2 className="mb-3 text-2xl font-bold text-gray-950">{copy.detector.manualTitle}</h2>
              <p className="mb-5 text-sm leading-6 text-gray-600">
                {copy.detector.manualText}
              </p>
              <Link href={`/${locale}/face-shape-measurement`} className="inline-flex items-center gap-2 font-semibold text-blue-700 hover:text-blue-900">
                {copy.detector.manualLink} <ArrowRight className="h-4 w-4" />
              </Link>
            </article>
          </section>

          <section className="mt-12">
            <h2 className="mb-5 text-2xl font-bold text-gray-950">{copy.detector.faqTitle}</h2>
            <div className="grid gap-4 md:grid-cols-2">
              {copy.detector.faq.map((item) => (
                <article key={item.question} className="rounded-lg border border-gray-200 bg-white p-5">
                  <h3 className="mb-2 font-semibold text-gray-950">{item.question}</h3>
                  <p className="text-sm leading-6 text-gray-600">{item.answer}</p>
                </article>
              ))}
            </div>
          </section>
        </section>
      </main>
    </>
  )
}
