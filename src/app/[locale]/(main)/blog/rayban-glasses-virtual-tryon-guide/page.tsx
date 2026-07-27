import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, CheckCircle2, ScanFace } from 'lucide-react'
import { GrowthFunnelLink } from '@/components/analytics/GrowthFunnelLink'
import { BRAND_TRY_ON_CONTENT, CURATED_BRAND_SLUGS } from '@/config/brand-try-on-content'
import type { Locale } from '@/i18n'
import { generateI18nSEO, generateStructuredData } from '@/lib/seo'
import { generateBreadcrumbSchema, generateCollectionPageSchema } from '@/lib/programmatic-seo'

export const dynamic = 'force-static'

const pagePath = '/blog/rayban-glasses-virtual-tryon-guide'
const title = 'Ray-Ban Virtual Try-On Guide: Compare Iconic Frame Styles'
const description = 'Compare Ray-Ban Wayfarer, Aviator, Clubmaster, round, and rectangular style directions on your photo, then confirm the exact model and fit before buying.'
const coverImage = '/Ray-Ban RB5154 Clubmaster - Browline Black Frame Eyeglasses.jpg'

const styles = [
  { name: 'Wayfarer direction', image: '/assets/glasses-presets/style-explorer/sun-wayfarer-black.jpg', text: 'A strong trapezoid-like front with a clear brow line. It adds definition and works as the most recognizable starting point for a Ray-Ban style comparison.', fit: 'Compare first on round, oval, and heart-shaped faces.' },
  { name: 'Aviator direction', image: '/assets/glasses-presets/style-explorer/sun-aviator-gold.jpg', text: 'Thin metal, a double bridge, and a curved lens shape create a lighter look than thick acetate frames.', fit: 'The curved outline can soften square and angular features.' },
  { name: 'Clubmaster direction', image: '/assets/glasses-presets/style-explorer/optical-slim-browline.jpg', text: 'A defined upper rim and lighter lower lens combine vintage structure with an optical-friendly profile.', fit: 'Worth testing on oval, diamond, oblong, and softly rounded faces.' },
  { name: 'Round direction', image: '/assets/glasses-presets/style-explorer/sun-round-tortoise.jpg', text: 'A curved silhouette creates a softer, more vintage impression than Wayfarer-style frames.', fit: 'A useful contrast for square, rectangular, and angular faces.' },
]

const faqs = [
  { question: 'Can I try Ray-Ban glasses on virtually with VisuTry?', answer: 'You can use VisuTry to compare Wayfarer, Aviator, browline, round, and other close style directions on your photo. These are independent visual references, not an official Ray-Ban catalog.' },
  { question: 'Which Ray-Ban style is best for a round face?', answer: 'Angular Wayfarer or browline directions are useful first tests because their stronger lines can add definition. Frame width and personal preference still matter more than any single face-shape rule.' },
  { question: 'Which Ray-Ban style is best for a square face?', answer: 'Aviator and round directions can provide contrast with an angular jaw. Also compare lens width and bridge placement to avoid choosing on shape alone.' },
  { question: 'Does virtual try-on confirm the exact size?', answer: 'No. It helps compare appearance. Confirm lens width, bridge width, temple length, and total frame width with Ray-Ban or an authorized retailer before buying.' },
]

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  return generateI18nSEO({
    locale: params.locale as Locale,
    title: `${title} | VisuTry`,
    description,
    image: coverImage,
    pathname: pagePath,
    type: 'article',
    noIndex: params.locale !== 'en',
    availableLocales: ['en'] as const,
  })
}

export default function RayBanGuidePage({ params }: { params: { locale: string } }) {
  const locale = params.locale
  const pageUrl = `https://www.visutry.com/${locale}${pagePath}`
  const schemas = [
    generateStructuredData('article', {
      title,
      description,
      publishedAt: '2025-10-16T10:00:00Z',
      modifiedAt: '2026-07-27T10:00:00Z',
      author: 'VisuTry Team',
      image: coverImage,
    }),
    generateStructuredData('faqPage', { questions: faqs }),
    generateBreadcrumbSchema([
      { name: 'Home', url: `https://www.visutry.com/${locale}` },
      { name: 'Blog', url: `https://www.visutry.com/${locale}/blog` },
      { name: 'Ray-Ban virtual try-on guide', url: pageUrl },
    ]),
    generateCollectionPageSchema({ name: title, description, url: pageUrl, itemCount: styles.length }),
  ]

  return (
    <>
      {schemas.map((schema, index) => <script key={index} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />)}
      <main className="mx-auto max-w-6xl px-4 py-8 md:py-12">
        <nav className="mb-7 flex items-center gap-2 text-sm text-gray-600" aria-label="Breadcrumb">
          <Link href={`/${locale}`} className="hover:text-gray-950">Home</Link><span>/</span>
          <Link href={`/${locale}/blog`} className="hover:text-gray-950">Blog</Link><span>/</span>
          <span className="text-gray-950">Ray-Ban virtual try-on</span>
        </nav>

        <section className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div>
            <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-blue-700">Updated July 27, 2026 · 7 min read</p>
            <h1 className="text-3xl font-bold leading-tight text-gray-950 md:text-5xl">{title}</h1>
            <p className="mt-5 text-lg leading-8 text-gray-600">{description}</p>
            <p className="mt-4 leading-7 text-gray-700">Start by comparing clearly different silhouettes. Once one direction feels right, use it to narrow the official catalog by shape and measurements.</p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <GrowthFunnelLink
                href={`/${locale}/try-on/glasses`}
                sourcePage={pagePath}
                destination="glasses-try-on"
                ctaLocation="hero-primary"
                queryCluster="brand-virtual-try-on:ray-ban"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700"
              >Try glasses on your photo <ArrowRight className="h-4 w-4" /></GrowthFunnelLink>
              <GrowthFunnelLink
                href={`/${locale}/face-shape-detector`}
                sourcePage={pagePath}
                destination="face-shape-detector"
                ctaLocation="hero-secondary"
                queryCluster="brand-virtual-try-on:ray-ban"
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 px-5 py-3 font-semibold text-gray-700 hover:bg-gray-50"
              >Find my face shape <ScanFace className="h-4 w-4" /></GrowthFunnelLink>
            </div>
          </div>
          <div className="relative min-h-80 overflow-hidden rounded-2xl bg-gray-100 shadow-sm">
            <Image src={coverImage} alt="Black browline frame for Ray-Ban style comparison" fill priority className="object-cover" sizes="(min-width: 1024px) 45vw, 100vw" />
          </div>
        </section>

        <section className="mt-14 rounded-xl border border-gray-200 bg-blue-50 p-6 md:p-8">
          <h2 className="text-2xl font-bold text-gray-950">How to use a Ray-Ban virtual try-on</h2>
          <div className="mt-6 grid gap-5 md:grid-cols-3">
            {[
              ['1. Upload one clear photo', 'Use a straight-on image with even light and no glasses covering your eyes.'],
              ['2. Compare silhouettes', 'Test Wayfarer, Aviator, browline, and round directions instead of small variations of one frame.'],
              ['3. Confirm the exact model', 'Check official dimensions, prescription options, seller authorization, and return terms.'],
            ].map(([heading, text]) => <article key={heading} className="rounded-lg bg-white p-5"><h3 className="font-semibold text-gray-950">{heading}</h3><p className="mt-2 text-sm leading-6 text-gray-600">{text}</p></article>)}
          </div>
        </section>

        <section className="mt-14">
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">Ray-Ban style finder</p>
          <h2 className="mt-2 text-2xl font-bold text-gray-950 md:text-3xl">Compare four iconic frame directions</h2>
          <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {styles.map((style, index) => (
              <GrowthFunnelLink
                key={style.name}
                href={`/${locale}/try-on/glasses`}
                sourcePage={pagePath}
                destination="glasses-try-on"
                ctaLocation={`style-card-${index + 1}`}
                queryCluster="brand-virtual-try-on:ray-ban"
                className="group overflow-hidden rounded-xl border border-gray-200 bg-white transition hover:-translate-y-0.5 hover:shadow-lg"
              >
                <div className="relative h-48 bg-gray-100"><Image src={style.image} alt={style.name} fill className="object-cover transition group-hover:scale-105" sizes="(min-width: 1024px) 25vw, (min-width: 768px) 50vw, 100vw" /></div>
                <div className="p-5"><h3 className="font-semibold text-gray-950 group-hover:text-blue-700">{style.name}</h3><p className="mt-2 text-sm leading-6 text-gray-600">{style.text}</p><p className="mt-3 text-sm leading-6 text-gray-700">{style.fit}</p><p className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-blue-700">Try this direction <ArrowRight className="h-4 w-4" /></p></div>
              </GrowthFunnelLink>
            ))}
          </div>
        </section>

        <section className="mt-14 grid gap-6 lg:grid-cols-2">
          <article className="rounded-xl border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-950">Face shape is a filter, not a rule</h2>
            <p className="mt-4 leading-7 text-gray-700">Angular frames can add definition to round features; curved frames can soften stronger angles. But the better choice is the one whose width, bridge, lens height, and visual weight feel balanced on you.</p>
            <GrowthFunnelLink href={`/${locale}/glasses-for-face-shape`} sourcePage={pagePath} destination="glasses-for-face-shape" ctaLocation="face-shape-guide" queryCluster="brand-virtual-try-on:ray-ban" className="mt-5 inline-flex items-center gap-2 font-semibold text-blue-700 hover:text-blue-900">Compare glasses by face shape <ArrowRight className="h-4 w-4" /></GrowthFunnelLink>
          </article>
          <article className="rounded-xl border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-950">Before buying an exact model</h2>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-gray-700">
              {['Compare lens, bridge, temple, and total frame width.', 'Confirm prescription and lens compatibility.', 'Buy through Ray-Ban or an authorized retailer if authenticity matters.', 'Review the seller’s return and adjustment policy.'].map(item => <li key={item} className="flex gap-3"><CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />{item}</li>)}
            </ul>
          </article>
        </section>

        <section className="mt-14">
          <h2 className="text-2xl font-bold text-gray-950">Ray-Ban virtual try-on FAQ</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {faqs.map(item => <article key={item.question} className="rounded-xl border border-gray-200 p-5"><h3 className="font-semibold text-gray-950">{item.question}</h3><p className="mt-3 text-sm leading-6 text-gray-600">{item.answer}</p></article>)}
          </div>
        </section>

        <section className="mt-14 rounded-xl border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-950">Compare other high-intent brand styles</h2>
          <div className="mt-4 flex flex-wrap gap-3">
            {CURATED_BRAND_SLUGS.map(brand => <Link key={brand} href={`/${locale}/brand/${brand}`} className="rounded-full border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:border-blue-400 hover:text-blue-700">{BRAND_TRY_ON_CONTENT[brand].name}</Link>)}
          </div>
        </section>

        <p className="mt-8 text-xs leading-5 text-gray-500">VisuTry is an independent styling and visualization tool and is not affiliated with, endorsed by, or sponsored by Ray-Ban. Ray-Ban and its model names are trademarks of their respective owner. Confirm exact models, sizing, authenticity, pricing, and availability with Ray-Ban or an authorized retailer.</p>
      </main>
    </>
  )
}
