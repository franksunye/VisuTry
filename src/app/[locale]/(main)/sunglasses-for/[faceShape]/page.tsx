import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowRight, CheckCircle2, Glasses, Ruler, ShieldCheck, Sun } from 'lucide-react'
import { getTopPickPresetById, type GlassesPreset } from '@/config/glasses-presets'
import {
  getSunglassesFaceShapeGuide,
  SUNGLASSES_FACE_SHAPE_GUIDES,
  SUNGLASSES_FACE_SHAPE_SLUGS,
} from '@/config/sunglasses-face-shape-content'
import type { Locale } from '@/i18n'
import { generateI18nSEO, generateStructuredData } from '@/lib/seo'
import { generateBreadcrumbSchema, generateCollectionPageSchema } from '@/lib/programmatic-seo'
import { getFaceShapeSeoCopy, interpolateSeoCopy } from '@/config/face-shape-seo-locales'

interface SunglassesGuidePageProps {
  params: { locale: string; faceShape: string }
}

function isPreset(preset: GlassesPreset | undefined): preset is GlassesPreset {
  return Boolean(preset)
}

function getStyleKey(presetId: string): string {
  if (presetId.includes('wayfarer')) return 'wayfarer'
  if (presetId.includes('aviator')) return 'aviator'
  if (presetId.includes('cat-eye')) return 'cat-eye'
  if (presetId.includes('oversized')) return 'oversized'
  if (presetId.includes('narrow-rectangle')) return 'rectangle'
  if (presetId.includes('flat-top')) return 'flat-top'
  if (presetId.includes('round')) return 'round'
  if (presetId.includes('shield')) return 'shield'
  return 'rectangle'
}

export function generateStaticParams() {
  return SUNGLASSES_FACE_SHAPE_SLUGS.map((faceShape) => ({ faceShape }))
}

export const dynamicParams = false
export const revalidate = 86400

export async function generateMetadata({ params }: SunglassesGuidePageProps): Promise<Metadata> {
  const guide = getSunglassesFaceShapeGuide(params.faceShape)
  if (!guide) return { title: 'Sunglasses Guide Not Found' }
  const copy = getFaceShapeSeoCopy(params.locale)
  const shapeName = copy.shapeNames[guide.faceShape]

  return generateI18nSEO({
    locale: params.locale as Locale,
    title: interpolateSeoCopy(copy.detail.metaTitleTemplate, { shape: shapeName }),
    description: interpolateSeoCopy(copy.detail.metaDescriptionTemplate, { shape: shapeName }),
    pathname: `/sunglasses-for/${guide.slug}`,
  })
}

export default function SunglassesGuidePage({ params }: SunglassesGuidePageProps) {
  const guide = getSunglassesFaceShapeGuide(params.faceShape)
  if (!guide) notFound()

  const locale = params.locale
  const copy = getFaceShapeSeoCopy(locale)
  const shapeName = copy.shapeNames[guide.faceShape]
  const description = interpolateSeoCopy(copy.detail.descriptionTemplate, { shape: shapeName })
  const presets = guide.bestStyles.map((item) => getTopPickPresetById(item.presetId)).filter(isPreset)
  const otherGuides = Object.values(SUNGLASSES_FACE_SHAPE_GUIDES).filter((item) => item.slug !== guide.slug)
  const faqContent = [
    { question: copy.detail.stylesTitle, answer: description },
    { question: copy.detail.fitTitle, answer: copy.detail.fitChecks.join(' ') },
    { question: copy.detail.lensTitle, answer: `${copy.detail.lensText} ${copy.detail.lensDisclaimer}` },
  ]
  const faqSchema = generateStructuredData('faqPage', { questions: faqContent })
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: `https://www.visutry.com/${locale}` },
    { name: copy.sunglasses.title, url: `https://www.visutry.com/${locale}/sunglasses-for-face-shape` },
    { name: shapeName, url: `https://www.visutry.com/${locale}/sunglasses-for/${guide.slug}` },
  ])
  const collectionSchema = generateCollectionPageSchema({
    name: interpolateSeoCopy(copy.detail.titleTemplate, { shape: shapeName }),
    description,
    url: `https://www.visutry.com/${locale}/sunglasses-for/${guide.slug}`,
    itemCount: presets.length,
  })

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }} />

      <main className="mx-auto max-w-6xl px-4 py-8 md:py-12">
        <nav className="mb-6 flex flex-wrap items-center gap-2 text-sm text-gray-600" aria-label="Breadcrumb">
          <Link href={`/${locale}`} className="hover:text-gray-950">Home</Link>
          <span aria-hidden="true">/</span>
          <Link href={`/${locale}/sunglasses-for-face-shape`} className="hover:text-gray-950">{copy.sunglasses.title}</Link>
          <span aria-hidden="true">/</span>
          <span className="text-gray-950">{shapeName}</span>
        </nav>

        <section className="grid gap-8 lg:grid-cols-[1.02fr_0.98fr] lg:items-center">
          <div>
            <p className="mb-3 inline-flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-1 text-sm font-semibold text-amber-800">
              <Sun className="h-4 w-4" />
              {interpolateSeoCopy(copy.detail.eyebrowTemplate, { shape: shapeName })}
            </p>
            <h1 className="mb-4 text-3xl font-bold leading-tight text-gray-950 md:text-5xl">
              {interpolateSeoCopy(copy.detail.titleTemplate, { shape: shapeName })}
            </h1>
            <p className="mb-4 text-lg leading-8 text-gray-700">{description}</p>
            <p className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4 font-semibold leading-7 text-blue-950">
              {copy.detail.goalLabel}: {copy.sunglasses.goals[guide.faceShape]}
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href={`/${locale}/face-shape-detector`}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700"
              >
                {copy.detail.detectorCta}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href={`/${locale}/style-explorer`}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 px-5 py-3 font-semibold text-gray-700 hover:bg-gray-50"
              >
                {copy.detail.explorerCta}
              </Link>
            </div>
          </div>

          {presets[0] && (
            <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
              <Image
                src={`/${presets[0].assetPath}`}
                alt={`${presets[0].name} · ${shapeName}`}
                width={760}
                height={520}
                className="h-auto w-full object-cover"
                priority
              />
              <div className="p-4">
                <p className="font-semibold text-gray-950">{copy.detail.featuredLabel}: {presets[0].name}</p>
                <p className="mt-1 text-sm text-gray-600">{copy.detail.featuredNote}</p>
              </div>
            </div>
          )}
        </section>

        <section className="mt-12">
          <div className="mb-5 max-w-3xl">
            <h2 className="mb-3 text-2xl font-bold text-gray-950">{copy.detail.stylesTitle}</h2>
            <p className="leading-7 text-gray-600">
              {copy.detail.stylesIntro}
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {guide.bestStyles.map((style) => {
              const preset = getTopPickPresetById(style.presetId)
              if (!preset) return null
              return (
                <article key={style.name} className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
                  <div className="relative h-44 overflow-hidden bg-gray-100">
                    <Image
                      src={`/${preset.assetPath}`}
                      alt={`${preset.name} · ${shapeName}`}
                      width={480}
                      height={320}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-950">{copy.detail.styleNames[getStyleKey(style.presetId)] ?? preset.name}</h3>
                    <p className="mt-2 text-sm leading-6 text-gray-600">{copy.sunglasses.goals[guide.faceShape]}</p>
                    <Link href={`/${locale}/style-explorer`} className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-blue-700 hover:text-blue-900">
                      {copy.detail.styleLink} <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </article>
              )
            })}
          </div>
        </section>

        <section className="mt-12 grid gap-5 lg:grid-cols-3">
          <article className="rounded-lg border border-gray-200 bg-white p-6">
            <div className="mb-4 flex items-center gap-2">
              <Ruler className="h-5 w-5 text-blue-600" />
              <h2 className="text-xl font-bold text-gray-950">{copy.detail.fitTitle}</h2>
            </div>
            <ul className="grid gap-3 text-sm leading-6 text-gray-700">
              {copy.detail.fitChecks.map((item) => (
                <li key={item} className="flex gap-2">
                  <CheckCircle2 className="mt-1 h-4 w-4 flex-shrink-0 text-green-600" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </article>
          <article className="rounded-lg border border-gray-200 bg-white p-6">
            <div className="mb-4 flex items-center gap-2">
              <Glasses className="h-5 w-5 text-blue-600" />
              <h2 className="text-xl font-bold text-gray-950">{copy.detail.reconsiderTitle}</h2>
            </div>
            <ul className="grid gap-3 text-sm leading-6 text-gray-700">
              {copy.detail.reconsider.map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="mt-3 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-gray-400" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </article>
          <article className="rounded-lg border border-amber-200 bg-amber-50 p-6">
            <div className="mb-4 flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-amber-700" />
              <h2 className="text-xl font-bold text-amber-950">{copy.detail.lensTitle}</h2>
            </div>
            <p className="text-sm leading-6 text-amber-900">{copy.detail.lensText}</p>
            <p className="mt-3 text-sm leading-6 text-amber-900">
              {copy.detail.lensDisclaimer}
            </p>
          </article>
        </section>

        <section className="mt-12 rounded-lg border border-blue-200 bg-blue-50 p-6 md:p-8">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="max-w-2xl">
              <p className="mb-2 text-sm font-semibold uppercase text-blue-700">{copy.detail.conversionEyebrow}</p>
              <h2 className="mb-2 text-2xl font-bold text-blue-950">{copy.detail.conversionTitle}</h2>
              <p className="leading-7 text-blue-900">
                {copy.detail.conversionText}
              </p>
            </div>
            <Link
              href={`/${locale}/style-explorer`}
              className="inline-flex flex-shrink-0 items-center justify-center gap-2 rounded-lg bg-blue-700 px-5 py-3 font-semibold text-white hover:bg-blue-800"
            >
              {copy.detail.conversionCta} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>

        <section className="mt-12">
          <h2 className="mb-5 text-2xl font-bold text-gray-950">{interpolateSeoCopy(copy.detail.faqTitleTemplate, { shape: shapeName })}</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {faqContent.map((item) => (
              <article key={item.question} className="rounded-lg border border-gray-200 bg-white p-5">
                <h3 className="mb-2 font-semibold text-gray-950">{item.question}</h3>
                <p className="text-sm leading-6 text-gray-600">{item.answer}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-12">
          <h2 className="mb-5 text-2xl font-bold text-gray-950">{copy.detail.otherTitle}</h2>
          <div className="flex flex-wrap gap-3">
            {otherGuides.map((item) => (
              <Link
                key={item.slug}
                href={`/${locale}/sunglasses-for/${item.slug}`}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:border-blue-300 hover:text-blue-700"
              >
                {copy.shapeNames[item.faceShape]}
              </Link>
            ))}
          </div>
        </section>
      </main>
    </>
  )
}
