import { cache } from 'react'
import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { setRequestLocale } from 'next-intl/server'
import { prisma } from '@/lib/prisma'
import { SITE_CONFIG } from '@/lib/seo'
import { discoveryCanonicalUrl } from '@/lib/store-discovery-seo'
import {
  getVisutryDemoFrameRoute,
  visutryDemoFramePath,
  VISUTRY_DEMO_FRAME_ROUTES,
  VISUTRY_DEMO_MERCHANT_SLUG,
} from '@/lib/visutry-demo-frame-routes'
import { getValidLocale, isValidLocale } from '@/i18n'

type DemoFramePageProps = {
  params: {
    locale: string
    slug: string
  }
}

const getDemoFrame = cache(async (slug: string) => {
  const route = getVisutryDemoFrameRoute(slug)
  if (!route) return null

  return prisma.merchantFrame.findFirst({
    where: {
      sku: route.sku,
      status: 'ACTIVE',
      merchant: {
        slug: VISUTRY_DEMO_MERCHANT_SLUG,
        status: 'ACTIVE',
      },
    },
    select: {
      id: true,
      sku: true,
      name: true,
      brand: true,
      imageUrl: true,
      shape: true,
      material: true,
      color: true,
      widthClass: true,
    },
  })
})

function absoluteImageUrl(imageUrl: string): string {
  return new URL(imageUrl, SITE_CONFIG.url).toString()
}

function frameDescription(frame: {
  name: string
  shape: string
  material: string | null
  color: string | null
  widthClass: string | null
}): string {
  const facts = [frame.shape, frame.material, frame.color, frame.widthClass].filter(Boolean)
  return `${frame.name} is a VisuTry Demo Frame${facts.length > 0 ? ` with ${facts.join(', ')} styling` : ''}. First-party demo inventory for evaluating VisuTry eyewear decision and virtual try-on experiences; this frame is not offered for sale.`
}

function jsonLdForFrame(frame: NonNullable<Awaited<ReturnType<typeof getDemoFrame>>>, canonical: string) {
  const description = frameDescription(frame)
  const properties = [
    ['Shape', frame.shape],
    ['Material', frame.material],
    ['Color', frame.color],
    ['Width', frame.widthClass],
  ].filter((entry): entry is [string, string] => Boolean(entry[1]))

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Product',
        name: frame.name,
        description,
        ...(frame.imageUrl ? { image: [absoluteImageUrl(frame.imageUrl)] } : {}),
        brand: { '@type': 'Brand', name: frame.brand || 'VisuTry' },
        url: canonical,
        additionalProperty: properties.map(([name, value]) => ({
          '@type': 'PropertyValue',
          name,
          value,
        })),
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'VisuTry', item: SITE_CONFIG.url },
          { '@type': 'ListItem', position: 2, name: 'VisuTry Demo Store', item: `${SITE_CONFIG.url}/en/store/${VISUTRY_DEMO_MERCHANT_SLUG}` },
          { '@type': 'ListItem', position: 3, name: frame.name, item: canonical },
        ],
      },
    ],
  }
}

export const dynamic = 'force-dynamic'
export const dynamicParams = true

export function generateStaticParams() {
  return VISUTRY_DEMO_FRAME_ROUTES.map(({ slug }) => ({ locale: 'en', slug }))
}

export async function generateMetadata({ params }: DemoFramePageProps): Promise<Metadata> {
  setRequestLocale(params.locale)
  const locale = getValidLocale(params.locale)
  const pathname = `/${locale}${visutryDemoFramePath(params.slug)}`
  const canonical = discoveryCanonicalUrl(pathname)
  const frame = await getDemoFrame(params.slug)

  if (!frame) {
    return {
      title: 'Demo frame not found | VisuTry',
      alternates: { canonical },
      robots: { index: false, follow: false },
    }
  }

  const description = frameDescription(frame)
  return {
    title: `${frame.name} | VisuTry Demo Frame`,
    description,
    metadataBase: new URL(SITE_CONFIG.url),
    alternates: {
      canonical,
      ...(locale === 'en' ? { languages: { en: canonical, 'x-default': canonical } } : {}),
    },
    robots: {
      index: locale === 'en',
      follow: true,
      googleBot: { index: locale === 'en', follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
    },
    openGraph: {
      type: 'website',
      url: canonical,
      title: `${frame.name} | VisuTry Demo Frame`,
      description,
      siteName: SITE_CONFIG.name,
      images: frame.imageUrl ? [{ url: absoluteImageUrl(frame.imageUrl), alt: frame.name }] : undefined,
    },
  }
}

export default async function DemoFramePage({ params }: DemoFramePageProps) {
  if (!isValidLocale(params.locale)) notFound()
  setRequestLocale(params.locale)
  const locale = getValidLocale(params.locale)
  const route = getVisutryDemoFrameRoute(params.slug)
  const frame = await getDemoFrame(params.slug)
  if (!route || !frame) notFound()

  const canonical = discoveryCanonicalUrl(`/${locale}${visutryDemoFramePath(params.slug)}`)
  const description = frameDescription(frame)
  const facts = [
    ['Shape', frame.shape],
    ['Material', frame.material],
    ['Color', frame.color],
    ['Width', frame.widthClass],
    ['SKU', frame.sku],
  ].filter((entry): entry is [string, string] => Boolean(entry[1]))

  return (
    <main className="min-h-screen bg-[#f7f8fb] px-5 py-8 text-slate-950 sm:px-8 lg:px-10 lg:py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdForFrame(frame, canonical)).replace(/</g, '\\u003c') }}
      />
      <div className="mx-auto max-w-5xl">
        <nav aria-label="Breadcrumb" className="text-sm text-slate-500">
          <Link href={`/${locale}/store/${VISUTRY_DEMO_MERCHANT_SLUG}`} className="font-semibold text-blue-700 hover:text-blue-900">VisuTry Demo Store</Link>
          <span className="px-2" aria-hidden="true">/</span>
          <span>{frame.name}</span>
        </nav>

        <section className="mt-6 grid gap-8 rounded-[2rem] border border-slate-200 bg-white p-5 shadow-[0_28px_70px_-42px_rgba(15,23,42,0.45)] sm:p-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:p-10">
          <div className="relative aspect-[4/3] overflow-hidden rounded-3xl bg-slate-50">
            {frame.imageUrl ? (
              <Image
                src={frame.imageUrl}
                alt={`${frame.name} VisuTry Demo Frame`}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 52vw"
                className="object-contain p-8"
              />
            ) : null}
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">VisuTry Demo Frame</p>
            <h1 className="mt-3 font-serif text-4xl font-semibold tracking-tight sm:text-5xl">{frame.name}</h1>
            <p className="mt-5 text-base leading-7 text-slate-600">{description}</p>
            <dl className="mt-6 grid grid-cols-2 gap-x-5 gap-y-3 border-y border-slate-200 py-5 text-sm">
              {facts.map(([label, value]) => (
                <div key={label}>
                  <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{label}</dt>
                  <dd className="mt-1 font-medium text-slate-900">{value}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href={`/${locale}/c/${VISUTRY_DEMO_MERCHANT_SLUG}/everyday-fit?source=discovery-canary#featured-frames`}
                className="inline-flex min-h-11 items-center justify-center rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Try this frame in VisuTry Demo
              </Link>
              <Link
                href={`/${locale}/store/${VISUTRY_DEMO_MERCHANT_SLUG}?source=discovery-canary#featured-frames`}
                className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-800 transition hover:border-slate-500"
              >
                Back to Demo Store
              </Link>
            </div>
            <p className="mt-5 text-xs leading-5 text-slate-500">VisuTry Demo is a first-party demonstration surface, not an external merchant or customer storefront. Demo frames are not offered for sale.</p>
          </div>
        </section>
      </div>
    </main>
  )
}
