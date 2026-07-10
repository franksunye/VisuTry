import { Metadata } from 'next'
import Link from 'next/link'
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Grid2X2,
  Link2,
  ShieldCheck,
  Store,
  Upload,
} from 'lucide-react'
import { StoreLandingTracker, StoreCtaLink } from '@/components/store/StoreLandingAnalytics'
import { StoreLeadForm } from '@/components/store/StoreLeadForm'
import { StoreMarketingVisual } from '@/components/store/StoreMarketingVisual'
import { generateI18nSEO, generateStructuredData } from '@/lib/seo'
import { Locale } from '@/i18n'

interface StorePageProps {
  params: {
    locale: string
  }
}

export async function generateMetadata({ params }: StorePageProps): Promise<Metadata> {
  return generateI18nSEO({
    locale: params.locale as Locale,
    title: 'VisuTry Store — AI try-on for independent eyewear stores',
    description:
      'Give shoppers a branded AI eyewear try-on and frame comparison experience, then see which frames attract the most interest.',
    pathname: '/store',
  })
}

const workflow = [
  {
    icon: Upload,
    title: 'Add your frames',
    description: 'Start with 8–20 best sellers, new arrivals, or frames you want to promote.',
  },
  {
    icon: Link2,
    title: 'Share your Store link',
    description: 'Add it to your website, Instagram, email, QR code, or customer conversations.',
  },
  {
    icon: Grid2X2,
    title: 'Shoppers try and compare',
    description: 'Customers upload one photo, choose frames, and see their results in one clean flow.',
  },
  {
    icon: BarChart3,
    title: 'Follow up with context',
    description: 'See popular frames and new inquiries so your team can recommend the right next step.',
  },
]

const shopperBenefits = [
  'Upload one clear photo',
  'Choose one or several frames',
  'See realistic try-on results',
  'Compare a shortlist before inquiring',
]

const merchantBenefits = [
  'See which frames receive the most attention',
  'Review recent inquiries in one place',
  'Understand shopper interest before they buy',
]

export default function StoreLandingPage({ params }: StorePageProps) {
  const locale = params.locale
  const storeSchema = generateStructuredData('softwareApplication', {
    name: 'VisuTry Store',
    url: `https://www.visutry.com/${locale}/store`,
    applicationCategory: 'ShoppingApplication',
    operatingSystem: 'Web Browser',
    description:
      'A branded AI eyewear try-on and frame comparison experience for independent optical stores and eyewear sellers.',
    featureList: [
      'Branded shopper Store link',
      'Photo-based virtual glasses try-on',
      'Single and multi-frame selection',
      'Side-by-side frame comparison',
      'Favorites and inquiry capture',
      'Lightweight merchant dashboard',
    ],
  })

  return (
    <main className="container mx-auto px-4 py-8">
      <StoreLandingTracker locale={locale} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(storeSchema) }} />

      <section className="mx-auto mb-20 max-w-7xl">
        <div className="grid gap-10 lg:grid-cols-[0.42fr_0.58fr] lg:items-center">
          <div>
            <p className="mb-4 inline-flex items-center rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700">
              <Store className="mr-2 h-4 w-4" />
              VisuTry Store
            </p>
            <h1 className="max-w-xl text-4xl font-bold leading-tight text-gray-950 md:text-5xl lg:text-6xl">
              Give shoppers a simpler way to choose frames.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-gray-600 md:text-lg">
              A branded try-on and frame comparison experience for your optical store — simple for customers and easy for your team to share.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <StoreCtaLink
                href="#store-form"
                locale={locale}
                ctaLocation="hero_primary"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700"
              >
                Create my sample store
                <ArrowRight className="h-4 w-4" />
              </StoreCtaLink>
              <StoreCtaLink
                href="#workflow"
                locale={locale}
                ctaLocation="hero_secondary"
                className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-6 py-3 text-sm font-bold text-gray-700 transition hover:border-blue-300 hover:text-blue-700"
              >
                See how it works
              </StoreCtaLink>
            </div>
            <p className="mt-5 text-sm text-gray-500">Start with a small frame selection. No full ecommerce integration required.</p>
          </div>

          <StoreMarketingVisual
            src="/images/store/store-hero-shopper.png"
            alt="A simple branded eyewear store where a shopper uploads a photo, chooses frames, and sees a virtual try-on result"
            label="Hero shopper visual"
            description="Upload the approved Asset A as public/images/store/store-hero-shopper.png."
            aspectClass="aspect-[4/3]"
            priority
          />
        </div>
      </section>

      <section id="workflow" className="mx-auto mb-20 max-w-6xl scroll-mt-24">
        <div className="mx-auto mb-8 max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">How it works</p>
          <h2 className="mt-3 text-3xl font-bold text-gray-950 md:text-4xl">From your frame catalog to a shopper-ready link.</h2>
          <p className="mt-4 text-base leading-7 text-gray-600">A focused workflow for small eyewear businesses, without a complicated implementation.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {workflow.map((item, index) => {
            const Icon = item.icon
            return (
              <article key={item.title} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="mb-5 flex items-center justify-between">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="text-xs font-bold text-gray-400">0{index + 1}</span>
                </div>
                <h3 className="text-base font-bold text-gray-950">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-gray-600">{item.description}</p>
              </article>
            )
          })}
        </div>
      </section>

      <section className="mx-auto mb-20 max-w-7xl">
        <div className="grid gap-10 lg:grid-cols-[0.38fr_0.62fr] lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">What your shoppers see</p>
            <h2 className="mt-3 text-3xl font-bold leading-tight text-gray-950 md:text-4xl">One clear path from photo to shortlist.</h2>
            <p className="mt-4 text-base leading-7 text-gray-600">
              Customers do not need to learn a complicated tool. They upload a photo, choose frames, and review the results that matter.
            </p>
            <div className="mt-6 grid gap-3">
              {shopperBenefits.map((item) => (
                <div key={item} className="flex items-center gap-3 text-sm font-semibold text-gray-800">
                  <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-green-600" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          <StoreMarketingVisual
            src="/images/store/store-shopper-experience.png"
            alt="Detailed shopper experience showing photo upload, AI frame suggestions, virtual try-on, and frame comparison"
            label="Shopper experience visual"
            description="Upload the approved Asset B as public/images/store/store-shopper-experience.png."
            aspectClass="aspect-[16/10]"
          />
        </div>
      </section>

      <section className="mx-auto mb-20 max-w-7xl rounded-2xl border border-blue-100 bg-gradient-to-br from-white via-blue-50/40 to-white p-5 md:p-8 lg:p-10">
        <div className="grid gap-10 lg:grid-cols-[0.62fr_0.38fr] lg:items-center">
          <StoreMarketingVisual
            src="/images/store/store-owner-dashboard.png"
            alt="Simple merchant dashboard showing try-on sessions, inquiries, favorites, top frames, and recent shopper activity"
            label="Store owner dashboard visual"
            description="Upload the approved Asset C as public/images/store/store-owner-dashboard.png."
            aspectClass="aspect-[4/3]"
          />

          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">What you see as the store owner</p>
            <h2 className="mt-3 text-3xl font-bold leading-tight text-gray-950 md:text-4xl">See what shoppers like before they buy.</h2>
            <p className="mt-4 text-base leading-7 text-gray-600">
              Track the few signals that matter: try-ons, favorites, inquiries, and the frames receiving the most attention.
            </p>
            <div className="mt-6 grid gap-3">
              {merchantBenefits.map((item) => (
                <div key={item} className="flex items-start gap-3 text-sm font-semibold text-gray-800">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-600" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="store-form" className="mx-auto mb-14 max-w-6xl scroll-mt-24">
        <div className="grid gap-8 lg:grid-cols-[0.42fr_0.58fr] lg:items-start">
          <div className="pt-2">
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">Start small</p>
            <h2 className="mt-3 text-3xl font-bold leading-tight text-gray-950 md:text-4xl">Create a sample Store using your frames.</h2>
            <p className="mt-4 text-base leading-7 text-gray-600">
              Share a few details about your store and catalog. We will help you understand what the first branded shopper experience could look like.
            </p>
            <div className="mt-6 rounded-xl border border-gray-200 bg-gray-50 p-5">
              <div className="flex gap-3">
                <ShieldCheck className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-600" />
                <div>
                  <h3 className="text-sm font-bold text-gray-950">Designed around customer trust</h3>
                  <p className="mt-1 text-sm leading-6 text-gray-600">
                    Shoppers see clear privacy information before uploading. Your team focuses on frame interest and inquiries, not raw customer photos.
                  </p>
                  <Link href={`/${locale}/privacy`} className="mt-3 inline-flex text-sm font-bold text-blue-700 hover:text-blue-900">
                    Read our privacy policy
                  </Link>
                </div>
              </div>
            </div>
          </div>

          <StoreLeadForm locale={locale} />
        </div>
      </section>
    </main>
  )
}
