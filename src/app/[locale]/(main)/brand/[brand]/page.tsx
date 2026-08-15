import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowRight, CheckCircle2, Glasses, ScanFace } from 'lucide-react'
import { GrowthFunnelLink } from '@/components/analytics/GrowthFunnelLink'
import {
  BRAND_TRY_ON_CONTENT,
  CURATED_BRAND_SLUGS,
  getCuratedBrandContent,
} from '@/config/brand-try-on-content'
import type { Locale } from '@/i18n'
import { getActiveBrands, getFramesByBrand } from '@/data/glasses'
import { generateI18nSEO, generateStructuredData } from '@/lib/seo'
import {
  generateBrandDescription,
  generateBrandSlug,
  generateBrandTitle,
  generateBreadcrumbSchema,
  generateCollectionPageSchema,
  unslugify,
  slugify,
} from '@/lib/programmatic-seo'

interface BrandPageProps {
  params: { locale: string; brand: string }
}

export async function generateStaticParams() {
  const staticBrands = CURATED_BRAND_SLUGS.map(brand => ({ brand }))
  if (process.env.PROGRAMMATIC_SEO_ENABLED !== 'true') return staticBrands

  const databaseBrands = (await getActiveBrands()).map((brand) => ({ brand: generateBrandSlug(brand) }))

  return [...staticBrands, ...databaseBrands.filter(item => !CURATED_BRAND_SLUGS.some(brand => brand === item.brand))]
}

// OpenNext 1.15.1 does not dispatch generated nested dynamic pages when this
// is false. BrandPage rejects non-curated/non-database slugs; invalid-slug
// static-to-dynamic behavior remains an adapter follow-up.
export const dynamicParams = true
export const revalidate = 3600

export async function generateMetadata({ params }: BrandPageProps): Promise<Metadata> {
  const curated = getCuratedBrandContent(params.brand)
  if (curated) {
    return generateI18nSEO({
      locale: params.locale as Locale,
      title: `${curated.title} | VisuTry`,
      description: curated.description,
      image: curated.styles[0].image,
      pathname: `/brand/${curated.slug}`,
      noIndex: params.locale !== 'en',
      availableLocales: ['en'] as const,
    })
  }

  if (process.env.PROGRAMMATIC_SEO_ENABLED !== 'true') {
    return { title: 'Brand Not Found', robots: { index: false, follow: false } }
  }

  const brandName = unslugify(params.brand)
  const frame = (await getFramesByBrand(brandName))[0]
  if (!frame) return { title: 'Brand Not Found', robots: { index: false, follow: false } }

  return generateI18nSEO({
    locale: params.locale as Locale,
    title: generateBrandTitle(brandName),
    description: generateBrandDescription(brandName),
    pathname: `/brand/${params.brand}`,
  })
}

function CuratedBrandPage({ locale, slug }: { locale: string; slug: string }) {
  const content = getCuratedBrandContent(slug)
  if (!content) notFound()

  const pagePath = `/brand/${content.slug}`
  const pageUrl = `https://www.visutry.com/${locale}${pagePath}`
  const faqs = [
    {
      question: `Can I virtually try on ${content.name} glasses here?`,
      answer: `You can use VisuTry to compare frame directions associated with ${content.name} searches on your own photo. The examples are independent style references, not an official ${content.name} product catalog.`,
    },
    {
      question: `How do I know which ${content.name} style suits my face?`,
      answer: 'Compare an angular, a curved, and a lighter-weight frame first. Use the result to identify a promising silhouette, then confirm the exact model dimensions before buying.',
    },
    {
      question: 'Does virtual try-on guarantee the frame will fit?',
      answer: 'No. Virtual try-on helps you judge appearance. Physical fit also depends on lens width, bridge width, temple length, nose shape, and professional adjustment.',
    },
  ]
  const otherBrands = CURATED_BRAND_SLUGS.filter(item => item !== content.slug)
  const schemas = [
    generateCollectionPageSchema({ name: content.title, description: content.description, url: pageUrl, itemCount: content.styles.length }),
    generateBreadcrumbSchema([
      { name: 'Home', url: `https://www.visutry.com/${locale}` },
      { name: content.name, url: pageUrl },
    ]),
    generateStructuredData('faqPage', { questions: faqs }),
  ]

  return (
    <>
      {schemas.map((schema, index) => (
        <script key={index} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      ))}
      <main className="mx-auto max-w-6xl px-4 py-8 md:py-12">
        <nav className="mb-7 flex items-center gap-2 text-sm text-gray-600" aria-label="Breadcrumb">
          <Link href={`/${locale}`} className="hover:text-gray-950">Home</Link>
          <span aria-hidden="true">/</span>
          <span className="text-gray-950">{content.name}</span>
        </nav>

        <section className="grid gap-8 rounded-2xl bg-gradient-to-br from-slate-950 to-slate-800 p-7 text-white md:p-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-blue-300">{content.eyebrow}</p>
            <h1 className="text-3xl font-bold leading-tight md:text-5xl">{content.title}</h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-200">{content.intro}</p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <GrowthFunnelLink
                href={`/${locale}/try-on/glasses`}
                sourcePage={pagePath}
                destination="glasses-try-on"
                ctaLocation="hero-primary"
                queryCluster={`brand-virtual-try-on:${content.slug}`}
                contentCluster="search-tool"
                productPath="virtual_try_on"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-500 px-5 py-3 font-semibold text-white hover:bg-blue-400"
              >
                Try glasses on your photo <ArrowRight className="h-4 w-4" />
              </GrowthFunnelLink>
              <GrowthFunnelLink
                href={`/${locale}/face-shape-detector`}
                sourcePage={pagePath}
                destination="face-shape-detector"
                ctaLocation="hero-secondary"
                queryCluster={`brand-virtual-try-on:${content.slug}`}
                contentCluster="search-tool"
                productPath="face_shape_detector"
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-500 px-5 py-3 font-semibold text-white hover:bg-white/10"
              >
                Find my face shape <ScanFace className="h-4 w-4" />
              </GrowthFunnelLink>
            </div>
          </div>
          <div className="relative min-h-72 overflow-hidden rounded-xl bg-white/10">
            <Image src={content.styles[0].image} alt={`${content.name} virtual try-on style direction`} fill priority className="object-cover" sizes="(min-width: 1024px) 40vw, 100vw" />
          </div>
        </section>

        <section className="mt-12">
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">Compare before you buy</p>
          <h2 className="mt-2 text-2xl font-bold text-gray-950 md:text-3xl">Four {content.name} style directions to test</h2>
          <p className="mt-3 max-w-3xl leading-7 text-gray-600">These are visual starting points, not exact branded products. Testing distinct silhouettes is more useful than comparing several nearly identical frames.</p>
          <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {content.styles.map((style, index) => (
              <GrowthFunnelLink
                key={style.name}
                href={`/${locale}/try-on/glasses`}
                sourcePage={pagePath}
                destination="glasses-try-on"
                ctaLocation={`style-card-${index + 1}`}
                queryCluster={`brand-virtual-try-on:${content.slug}`}
                contentCluster="search-tool"
                productPath="virtual_try_on"
                className="group overflow-hidden rounded-xl border border-gray-200 bg-white transition hover:-translate-y-0.5 hover:shadow-lg"
              >
                <div className="relative h-48 bg-gray-100">
                  <Image src={style.image} alt={`${style.name} glasses style`} fill className="object-cover transition group-hover:scale-105" sizes="(min-width: 1024px) 25vw, (min-width: 768px) 50vw, 100vw" />
                </div>
                <div className="p-5">
                  <h3 className="font-semibold text-gray-950 group-hover:text-blue-700">{style.name}</h3>
                  <p className="mt-2 text-sm leading-6 text-gray-600">{style.description}</p>
                  <p className="mt-3 text-sm leading-6 text-gray-700">{style.faceShapeTip}</p>
                  <p className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-blue-700">Try this direction <ArrowRight className="h-4 w-4" /></p>
                </div>
              </GrowthFunnelLink>
            ))}
          </div>
        </section>

        <section className="mt-12 grid gap-6 lg:grid-cols-2">
          <article className="rounded-xl border border-gray-200 bg-white p-6">
            <div className="flex items-center gap-2"><Glasses className="h-5 w-5 text-blue-700" /><h2 className="text-xl font-bold text-gray-950">A faster comparison workflow</h2></div>
            <ol className="mt-5 space-y-4 text-sm leading-6 text-gray-700">
              <li className="flex gap-3"><CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" /><span><strong>Start broad:</strong> test one angular, one curved, and one lighter frame.</span></li>
              <li className="flex gap-3"><CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" /><span><strong>Choose the silhouette:</strong> compare brow line, width, lens height, and visual weight.</span></li>
              <li className="flex gap-3"><CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" /><span><strong>Confirm the product:</strong> match exact dimensions and availability with the brand or an authorized retailer.</span></li>
            </ol>
          </article>
          <article className="rounded-xl bg-blue-50 p-6">
            <h2 className="text-xl font-bold text-gray-950">Fit matters after style</h2>
            <p className="mt-4 leading-7 text-gray-700">{content.shoppingNote}</p>
            <GrowthFunnelLink
              href={`/${locale}/glasses-for-face-shape`}
              sourcePage={pagePath}
              destination="glasses-for-face-shape"
              ctaLocation="fit-guide"
              queryCluster={`brand-virtual-try-on:${content.slug}`}
              contentCluster="search-tool"
              productPath="glasses_for_face_shape"
              className="mt-5 inline-flex items-center gap-2 font-semibold text-blue-700 hover:text-blue-900"
            >
              See the face-shape glasses guide <ArrowRight className="h-4 w-4" />
            </GrowthFunnelLink>
          </article>
        </section>

        <section className="mt-12">
          <h2 className="text-2xl font-bold text-gray-950">{content.name} virtual try-on FAQ</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {faqs.map(item => <article key={item.question} className="rounded-xl border border-gray-200 p-5"><h3 className="font-semibold text-gray-950">{item.question}</h3><p className="mt-3 text-sm leading-6 text-gray-600">{item.answer}</p></article>)}
          </div>
        </section>

        <section className="mt-12 rounded-xl border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-950">Compare more brand searches</h2>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link href={`/${locale}/blog/rayban-glasses-virtual-tryon-guide`} className="rounded-full border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:border-blue-400 hover:text-blue-700">Ray-Ban</Link>
            {otherBrands.map(brand => <Link key={brand} href={`/${locale}/brand/${brand}`} className="rounded-full border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:border-blue-400 hover:text-blue-700">{BRAND_TRY_ON_CONTENT[brand].name}</Link>)}
          </div>
        </section>

        <p className="mt-8 text-xs leading-5 text-gray-500">VisuTry is an independent styling and visualization tool and is not affiliated with, endorsed by, or sponsored by {content.name}. Brand names identify the styles shoppers search for. Confirm exact models, sizing, authenticity, pricing, and availability with the brand or an authorized retailer.</p>
      </main>
    </>
  )
}

export default async function BrandPage({ params }: BrandPageProps) {
  if (getCuratedBrandContent(params.brand)) return <CuratedBrandPage locale={params.locale} slug={params.brand} />
  if (process.env.PROGRAMMATIC_SEO_ENABLED !== 'true') notFound()

  const brandName = unslugify(params.brand)
  const frames = await getFramesByBrand(brandName)
  if (!frames.length) notFound()

  return (
    <main className="container mx-auto px-4 py-8">
      <nav className="mb-6 flex items-center gap-2 text-sm text-gray-600"><Link href={`/${params.locale}`}>Home</Link><span>/</span><span>{brandName}</span></nav>
      <h1 className="text-4xl font-bold text-gray-950">{brandName} glasses</h1>
      <p className="mt-4 text-lg text-gray-600">Explore available {brandName} frames and open a model to try it virtually.</p>
      <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {frames.map(frame => (
          <Link key={frame.id} href={`/${params.locale}/try/${slugify(frame.brand || '')}-${slugify(frame.model || '')}`} className="group overflow-hidden rounded-lg border border-gray-200 hover:shadow-lg">
            <div className="relative h-48 bg-gray-100"><Image src={frame.imageUrl} alt={frame.name} fill className="object-cover" /></div>
            <div className="p-4"><h2 className="font-semibold group-hover:text-blue-700">{frame.name}</h2><p className="mt-1 text-sm text-gray-600">{frame.model}</p></div>
          </Link>
        ))}
      </div>
    </main>
  )
}
