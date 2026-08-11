import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowRight, CheckCircle2, Glasses, ScanFace } from 'lucide-react'
import { GrowthFunnelLink } from '@/components/analytics/GrowthFunnelLink'
import { ProductContinuationCtas } from '@/components/growth/ProductContinuationCtas'
import { B04VisualSeoSections, type B04VisualSeoPage } from '@/components/seo/B04VisualSeoSections'
import { FACE_SHAPE_SLUGS, type FaceShapeContentSlug } from '@/config/face-shape-content'
import { getFaceShapeSeoCopy } from '@/config/face-shape-seo-locales'
import { getTopPickPresetById, type GlassesPreset } from '@/config/glasses-presets'
import {
  getOrdinaryGlassesDetailCopy,
  interpolateOrdinaryGlassesCopy,
} from '@/config/ordinary-glasses-detail-locales'
import type { Locale } from '@/i18n'
import { generateI18nSEO, generateStructuredData } from '@/lib/seo'
import { generateBreadcrumbSchema, generateCollectionPageSchema, slugify } from '@/lib/programmatic-seo'

interface FaceShapePageProps {
  params: { locale: string; faceShape: string }
}

const presetIds: Record<FaceShapeContentSlug, readonly string[]> = {
  round: ['rectangle-classic', 'square-classic', 'geometric-classic', 'wayfarer-classic'],
  square: ['round-classic', 'oval-classic', 'rimless-light', 'aviator-classic'],
  oval: ['rectangle-classic', 'browline-classic', 'aviator-classic', 'square-classic'],
  heart: ['rimless-light', 'round-classic', 'cat-eye-classic', 'bottom-weighted-classic'],
  diamond: ['oval-classic', 'rimless-light', 'cat-eye-classic', 'browline-classic'],
  oblong: ['rectangle-classic', 'oversized-classic', 'browline-classic', 'oversized-square-classic'],
  triangle: ['browline-classic', 'cat-eye-classic', 'aviator-classic', 'geometric-classic'],
}

function isPreset(preset: GlassesPreset | undefined): preset is GlassesPreset {
  return Boolean(preset)
}

function normalizeFaceShapeSlug(value: string): FaceShapeContentSlug | null {
  const normalized = slugify(value).replace(/-face$/, '')
  if (FACE_SHAPE_SLUGS.includes(normalized as FaceShapeContentSlug)) {
    return normalized as FaceShapeContentSlug
  }
  if (normalized === 'heart-shaped') return 'heart'
  if (normalized === 'long') return 'oblong'
  if (normalized === 'pear') return 'triangle'
  return null
}

export function generateStaticParams() {
  return FACE_SHAPE_SLUGS.map((shape) => ({ faceShape: `${shape}-face` }))
}

export const dynamicParams = true
export const revalidate = 3600

export async function generateMetadata({ params }: FaceShapePageProps): Promise<Metadata> {
  const shape = normalizeFaceShapeSlug(params.faceShape)
  if (!shape) return { title: 'Face Shape Not Found', robots: { index: false, follow: false } }

  const seoCopy = getFaceShapeSeoCopy(params.locale)
  const detail = getOrdinaryGlassesDetailCopy(params.locale)
  const shapeName = seoCopy.shapeNames[shape]
  const templateShapeName = shapeName.toLocaleLowerCase(params.locale)

  return generateI18nSEO({
    locale: params.locale as Locale,
    title: interpolateOrdinaryGlassesCopy(detail.metaTitle, templateShapeName),
    description: interpolateOrdinaryGlassesCopy(detail.metaDescription, templateShapeName),
    pathname: `/style/${shape}-face`,
  })
}

export default function FaceShapePage({ params }: FaceShapePageProps) {
  const shape = normalizeFaceShapeSlug(params.faceShape)
  if (!shape) notFound()

  const locale = params.locale
  const seoCopy = getFaceShapeSeoCopy(locale)
  const detail = getOrdinaryGlassesDetailCopy(locale)
  const shapeName = seoCopy.shapeNames[shape]
  const templateShapeName = shapeName.toLocaleLowerCase(locale)
  const pagePath = `/style/${shape}-face`
  const b04PagePath: B04VisualSeoPage | null = ['round', 'oval', 'square'].includes(shape)
    ? pagePath as B04VisualSeoPage
    : null
  const pageUrl = `https://www.visutry.com/${locale}${pagePath}`
  const presets = presetIds[shape].map(getTopPickPresetById).filter(isPreset)
  const title = interpolateOrdinaryGlassesCopy(detail.title, templateShapeName)
  const description = interpolateOrdinaryGlassesCopy(detail.description, templateShapeName)
  const faqContent = [
    {
      question: interpolateOrdinaryGlassesCopy(detail.faqBest, templateShapeName),
      answer: `${seoCopy.glasses.tryFirst[shape]}. ${seoCopy.glasses.reasons[shape]}`,
    },
    {
      question: interpolateOrdinaryGlassesCopy(detail.faqAvoid, templateShapeName),
      answer: `${seoCopy.glasses.avoidFirst[shape]}. ${detail.guidance}`,
    },
    {
      question: detail.faqAi,
      answer: `${seoCopy.detector.metaDescription} ${seoCopy.glasses.intro}`,
    },
  ]
  const faqSchema = generateStructuredData('faqPage', { questions: faqContent })
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: detail.home, url: `https://www.visutry.com/${locale}` },
    { name: seoCopy.glasses.title, url: `https://www.visutry.com/${locale}/glasses-for-face-shape` },
    { name: shapeName, url: pageUrl },
  ])
  const collectionSchema = generateCollectionPageSchema({
    name: title,
    description,
    url: pageUrl,
    itemCount: presets.length,
  })

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

      <main className="mx-auto max-w-6xl px-4 py-8 md:py-12">
        <nav className="mb-6 flex flex-wrap items-center gap-2 text-sm text-gray-600" aria-label="Breadcrumb">
          <Link href={`/${locale}`} className="hover:text-gray-900">{detail.home}</Link>
          <span aria-hidden="true">/</span>
          <Link href={`/${locale}/glasses-for-face-shape`} className="hover:text-gray-900">
            {seoCopy.glasses.title}
          </Link>
          <span aria-hidden="true">/</span>
          <span className="text-gray-900">{shapeName}</span>
        </nav>

        <section className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <div>
            <p className="mb-3 inline-flex rounded-lg border border-blue-200 bg-white px-3 py-1 text-sm font-semibold text-blue-700">
              {detail.badge}
            </p>
            <h1 className="mb-4 text-3xl font-bold leading-tight text-gray-950 md:text-5xl">{title}</h1>
            <p className="mb-6 text-lg leading-8 text-gray-600">{description}</p>
            <ProductContinuationCtas
              locale={locale}
              sourcePage={pagePath}
              queryCluster="glasses-by-face-shape"
              contentCluster="search-tool"
              ctaLocation="hero"
              labels={{
                detector: seoCopy.glasses.detectorCta,
                tryOn: seoCopy.glasses.tryOnCta,
                compare: 'Compare frames',
              }}
            />
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <ScanFace className="h-5 w-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-950">
                {interpolateOrdinaryGlassesCopy(detail.characteristicsTitle, templateShapeName)}
              </h2>
            </div>
            <p className="mb-5 text-sm leading-6 text-gray-600">{detail.characteristicsText}</p>
            <div className="rounded-lg bg-blue-50 p-4 text-sm leading-6 text-blue-900">{detail.guidance}</div>
          </div>
        </section>

        {b04PagePath ? <B04VisualSeoSections locale={locale} pagePath={b04PagePath} stage="hero" /> : null}

        <section className="mt-12 grid gap-5 md:grid-cols-3">
          <article className="rounded-lg border border-gray-200 bg-white p-5">
            <div className="mb-3 flex items-center gap-2">
              <Glasses className="h-5 w-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-950">{detail.tryFirstTitle}</h2>
            </div>
            <p className="text-sm leading-6 text-gray-700">{seoCopy.glasses.tryFirst[shape]}</p>
          </article>
          <article className="rounded-lg border border-gray-200 bg-white p-5">
            <h2 className="mb-3 text-lg font-semibold text-gray-950">{detail.avoidFirstTitle}</h2>
            <p className="text-sm leading-6 text-gray-700">{seoCopy.glasses.avoidFirst[shape]}</p>
          </article>
          <article className="rounded-lg border border-gray-200 bg-white p-5">
            <h2 className="mb-3 text-lg font-semibold text-gray-950">{detail.whyTitle}</h2>
            <p className="text-sm leading-6 text-gray-600">{seoCopy.glasses.reasons[shape]}</p>
          </article>
        </section>

        <section className="mt-12">
          <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="mb-2 text-sm font-semibold uppercase tracking-normal text-blue-600">{detail.recommendedEyebrow}</p>
              <h2 className="text-2xl font-bold text-gray-950">
                {interpolateOrdinaryGlassesCopy(detail.recommendedTitle, templateShapeName)}
              </h2>
            </div>
            <Link href={`/${locale}/try-on/glasses`} className="text-sm font-semibold text-blue-700 hover:text-blue-900">
              {detail.tryAny}
            </Link>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {presets.map((preset, index) => (
              <GrowthFunnelLink
                key={preset.id}
                href={`/${locale}/try-on/glasses`}
                sourcePage={pagePath}
                destination="glasses-try-on"
                ctaLocation={`recommended-style-${index + 1}`}
                queryCluster="glasses-by-face-shape"
                className="group overflow-hidden rounded-lg border border-gray-200 bg-white transition hover:shadow-lg"
              >
                <div className="relative h-48 overflow-hidden bg-gray-100">
                  <Image
                    src={`/${preset.assetPath}`}
                    alt={`${detail.recommendedEyebrow} ${index + 1} · ${shapeName}`}
                    width={360}
                    height={240}
                    className="h-full w-full object-cover transition group-hover:scale-105"
                  />
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-950 group-hover:text-blue-700">
                    {detail.recommendedEyebrow} {index + 1}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-gray-600">{seoCopy.glasses.reasons[shape]}</p>
                  <p className="mt-3 text-sm font-semibold text-blue-700">{detail.tryStyle}</p>
                </div>
              </GrowthFunnelLink>
            ))}
          </div>
        </section>

        {b04PagePath ? <B04VisualSeoSections locale={locale} pagePath={b04PagePath} stage="compare" /> : null}

        <section className="mt-12 rounded-lg border border-gray-200 bg-white p-6">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="mb-2 text-sm font-semibold uppercase tracking-normal text-blue-600">{detail.workflowEyebrow}</p>
              <h2 className="text-2xl font-bold text-gray-950">
                {interpolateOrdinaryGlassesCopy(detail.workflowTitle, templateShapeName)}
              </h2>
            </div>
            <GrowthFunnelLink
              href={`/${locale}/face-analysis`}
              sourcePage={pagePath}
              destination="face-analysis"
              ctaLocation="workflow-primary"
              queryCluster="glasses-by-face-shape"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-gray-950 px-4 py-3 text-sm font-semibold text-white hover:bg-gray-800"
            >
              {detail.advisorCta}<ArrowRight className="h-4 w-4" />
            </GrowthFunnelLink>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {seoCopy.glasses.steps.map((step) => (
              <article key={step.title} className="rounded-lg border border-gray-200 p-5">
                <h3 className="mb-2 font-semibold text-gray-950">{step.title}</h3>
                <p className="text-sm leading-6 text-gray-700">{step.text}</p>
              </article>
            ))}
          </div>
        </section>

        {b04PagePath ? <B04VisualSeoSections locale={locale} pagePath={b04PagePath} stage="fit" /> : null}

        <section className="mt-12">
          <h2 className="mb-5 text-2xl font-bold text-gray-950">
            {interpolateOrdinaryGlassesCopy(detail.faqTitle, templateShapeName)}
          </h2>
          <div className="grid gap-4 md:grid-cols-3">
            {faqContent.map((item) => (
              <article key={item.question} className="rounded-lg border border-gray-200 bg-white p-5">
                <h3 className="mb-2 text-base font-semibold text-gray-950">{item.question}</h3>
                <p className="text-sm leading-6 text-gray-600">{item.answer}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-12">
          <h2 className="mb-5 text-2xl font-bold text-gray-950">{detail.otherTitle}</h2>
          <div className="flex flex-wrap gap-3">
            {FACE_SHAPE_SLUGS.filter((item) => item !== shape).map((item) => (
              <Link
                key={item}
                href={`/${locale}/style/${item}-face`}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:border-blue-300 hover:text-blue-700"
              >
                {seoCopy.shapeNames[item]}
              </Link>
            ))}
          </div>
          {locale === 'en' && (
            <div className="mt-5">
              <Link href={`/${locale}/glasses-guide`} className="text-sm font-semibold text-blue-700 hover:text-blue-900">
                Explore more glasses guides →
              </Link>
            </div>
          )}
        </section>
      </main>
    </>
  )
}
