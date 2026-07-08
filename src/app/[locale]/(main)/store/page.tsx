import { Metadata } from 'next'
import Link from 'next/link'
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  ClipboardList,
  Glasses,
  Grid2X2,
  Link2,
  ScanFace,
  ShieldCheck,
  Sparkles,
  Store,
  Upload,
  Users,
} from 'lucide-react'
import { StoreLandingTracker, StoreCtaLink } from '@/components/store/StoreLandingAnalytics'
import { StoreLeadForm } from '@/components/store/StoreLeadForm'
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
    title: 'VisuTry Store — AI eyewear advisor and try-on link for optical stores',
    description:
      'Create a hosted AI eyewear advisor and virtual try-on link for your optical store, eyewear brand, or frame styling workflow.',
    pathname: '/store',
  })
}

const workflow = [
  {
    icon: Upload,
    title: 'Add your top frames',
    description: 'Start with 8-20 priority frames instead of a full catalog migration.',
  },
  {
    icon: Link2,
    title: 'Share one Store link',
    description: 'Send shoppers to a hosted advisor and try-on flow before they visit, message, or buy.',
  },
  {
    icon: Grid2X2,
    title: 'Let shoppers compare',
    description: 'Customers upload one photo, try selected frames, and review results side by side.',
  },
  {
    icon: BarChart3,
    title: 'Receive intent signals',
    description: 'Capture favorites, lead interest, frame clicks, and simple usage signals.',
  },
]

const proofCards = [
  {
    icon: ScanFace,
    title: 'Face-shape guidance',
    description: 'Give shoppers a reasoned starting point before they browse every frame.',
  },
  {
    icon: Glasses,
    title: 'Virtual try-on',
    description: 'Turn a static frame image into a more confident visual decision.',
  },
  {
    icon: Grid2X2,
    title: 'Frame comparison',
    description: 'Help customers shortlist several looks instead of judging one frame at a time.',
  },
  {
    icon: ClipboardList,
    title: 'Lead capture',
    description: 'Collect interest signals that can support follow-up, appointment, or purchase intent.',
  },
]

const audiences = [
  'Independent optical stores',
  'Small eyewear ecommerce brands',
  'Frame stylists and image consultants',
  'Boutique agencies serving eyewear merchants',
]

const pilotItems = [
  'Merchant name and lightweight branding',
  '8-20 priority frames',
  'Hosted advisor / compare link',
  'Shopper upload and try-on flow',
  'Favorites or lead capture concept',
  'Simple usage summary during the pilot',
]

export default function StoreLandingPage({ params }: StorePageProps) {
  const locale = params.locale
  const storeSchema = generateStructuredData('softwareApplication', {
    name: 'VisuTry Store',
    url: `https://www.visutry.com/${locale}/store`,
    applicationCategory: 'ShoppingApplication',
    operatingSystem: 'Web Browser',
    description:
      'A hosted AI eyewear advisor and virtual try-on link for optical stores, eyewear sellers, and frame stylists.',
    featureList: [
      'Hosted merchant Store link',
      'AI frame guidance',
      'Virtual glasses try-on',
      'Side-by-side frame comparison',
      'Lead and favorite capture concept',
    ],
  })

  return (
    <main className="container mx-auto px-4 py-8">
      <StoreLandingTracker locale={locale} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(storeSchema) }} />

      <section className="mb-14 overflow-hidden rounded-lg border border-blue-100 bg-white shadow-sm">
        <div className="grid gap-0 lg:grid-cols-[0.48fr_0.52fr] lg:items-stretch">
          <div className="flex flex-col justify-center bg-gradient-to-br from-white via-blue-50/80 to-white p-6 md:p-8 lg:p-10">
            <p className="mb-4 inline-flex w-fit items-center rounded-lg border border-blue-200 bg-white px-3 py-1 text-sm font-semibold text-blue-700">
              <Store className="mr-2 h-4 w-4" />
              VisuTry Store pilot
            </p>
            <h1 className="max-w-2xl text-3xl font-bold leading-tight text-gray-950 md:text-5xl">
              AI eyewear advisor & try-on link for optical stores.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-gray-600 md:text-lg">
              Help shoppers choose frames online with face-shape guidance, virtual try-on, side-by-side comparison, and lead capture — without building a full AR commerce stack.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <StoreCtaLink
                href="#pilot-form"
                locale={locale}
                ctaLocation="hero_primary"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-sm shadow-blue-600/20 transition hover:bg-blue-700"
              >
                Get a sample Store Link
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
            <p className="mt-5 text-sm font-medium text-gray-500">
              Built for small eyewear teams that want to test online frame selection before committing to a full ecommerce integration.
            </p>
          </div>

          <div className="bg-[#eef5ff] p-4 md:p-6 lg:p-8">
            <div className="mx-auto max-w-xl rounded-[1.4rem] border border-white/80 bg-white p-4 shadow-xl shadow-blue-900/10">
              <div className="mb-4 flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Sample Store</p>
                  <p className="text-sm font-bold text-gray-950">Luna Optical · Frame Advisor</p>
                </div>
                <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-bold text-green-700">Pilot</span>
              </div>

              <div className="grid gap-3 sm:grid-cols-[0.9fr_1.1fr]">
                <div className="rounded-lg border border-gray-200 bg-white p-3">
                  <div className="flex h-40 items-center justify-center rounded-lg bg-gradient-to-br from-gray-100 to-blue-50">
                    <div className="relative h-24 w-24 rounded-full bg-white shadow-inner">
                      <div className="absolute left-1/2 top-5 h-8 w-14 -translate-x-1/2 rounded-full border-2 border-gray-800" />
                      <div className="absolute left-1/2 top-14 h-8 w-10 -translate-x-1/2 rounded-full border border-blue-200" />
                      <div className="absolute left-6 top-9 h-1 w-12 rounded-full bg-gray-800" />
                    </div>
                  </div>
                  <p className="mt-3 text-xs font-semibold text-gray-500">Shopper photo + advisor result</p>
                  <p className="mt-1 text-sm font-bold text-gray-950">Oval face · 4 frame picks</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {['Soft square', 'Thin metal', 'Bold acetate', 'Rounded'].map((item, index) => (
                    <div key={item} className="rounded-lg border border-gray-200 bg-white p-3">
                      <div className="mb-2 flex h-16 items-center justify-center rounded-lg bg-blue-50">
                        <div className={`h-5 w-16 rounded-full border-2 ${index === 2 ? 'border-blue-700' : 'border-gray-800'}`} />
                      </div>
                      <p className="text-xs font-bold text-gray-900">{item}</p>
                      <p className="mt-0.5 text-[11px] text-gray-500">Try-on ready</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 grid gap-3 rounded-lg border border-blue-100 bg-blue-50 p-4 sm:grid-cols-3">
                {[
                  ['38', 'link opens'],
                  ['21', 'try-ons'],
                  ['7', 'leads'],
                ].map(([value, label]) => (
                  <div key={label}>
                    <p className="text-xl font-bold text-blue-900">{value}</p>
                    <p className="text-xs font-semibold text-blue-700">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="workflow" className="mx-auto mb-14 max-w-6xl">
        <div className="mb-7 max-w-3xl">
          <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-blue-600">Workflow first</p>
          <h2 className="text-3xl font-bold text-gray-950 md:text-4xl">A Store link your shoppers can actually use.</h2>
          <p className="mt-4 text-base leading-7 text-gray-600">
            VisuTry Store is designed as a decision workflow: frame guidance, try-on, comparison, and follow-up signals in one hosted experience.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          {workflow.map((item, index) => {
            const Icon = item.icon
            return (
              <div key={item.title} className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="text-xs font-bold text-gray-400">0{index + 1}</span>
                </div>
                <h3 className="text-base font-bold text-gray-950">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-gray-600">{item.description}</p>
              </div>
            )
          })}
        </div>
      </section>

      <section className="mx-auto mb-14 max-w-6xl">
        <div className="grid gap-6 lg:grid-cols-[0.82fr_1.18fr] lg:items-start">
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <p className="mb-3 inline-flex items-center rounded-lg border border-blue-100 bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700">
              <Sparkles className="mr-2 h-4 w-4" />
              Why not just virtual try-on?
            </p>
            <h2 className="text-2xl font-bold leading-tight text-gray-950 md:text-3xl">
              Try-on is useful. The business value is helping shoppers decide.
            </h2>
            <p className="mt-4 text-sm leading-6 text-gray-600">
              A small eyewear business does not only need another image tool. It needs a simple way to guide shoppers, understand what they like, and follow up with confidence.
            </p>
            <div className="mt-5 grid gap-3">
              {['Recommendation', 'Try-on', 'Comparison', 'Favorites / lead capture'].map((item) => (
                <div key={item} className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {proofCards.map((item) => {
              const Icon = item.icon
              return (
                <div key={item.title} className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
                  <Icon className="mb-4 h-5 w-5 text-blue-600" />
                  <h3 className="text-base font-bold text-gray-950">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-gray-600">{item.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <section className="mx-auto mb-14 max-w-6xl rounded-lg border border-gray-200 bg-white p-6 shadow-sm md:p-8">
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div>
            <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-blue-600">Who it is for</p>
            <h2 className="text-3xl font-bold text-gray-950">Start with teams that already sell frames visually.</h2>
            <p className="mt-4 text-sm leading-6 text-gray-600">
              The first pilot should stay narrow. We are looking for teams that can test a hosted frame advisor without waiting for a full platform integration.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {audiences.map((item) => (
              <div key={item} className="flex items-center gap-3 rounded-lg bg-gray-50 p-4">
                <Users className="h-5 w-5 text-blue-600" />
                <span className="text-sm font-bold text-gray-900">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto mb-14 max-w-6xl">
        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div className="rounded-lg border border-blue-100 bg-gradient-to-br from-white via-blue-50/70 to-white p-6 shadow-sm md:p-8">
            <p className="mb-3 inline-flex items-center rounded-lg border border-blue-200 bg-white px-3 py-1 text-sm font-semibold text-blue-700">
              <ClipboardList className="mr-2 h-4 w-4" />
              30-day pilot shape
            </p>
            <h2 className="text-3xl font-bold text-gray-950">A small validation package, not a heavy integration.</h2>
            <p className="mt-4 text-sm leading-6 text-gray-600">
              We help set up a small catalog, create a hosted Store link, and use real or realistic shopper sessions to learn whether the workflow creates value.
            </p>
            <div className="mt-6 grid gap-3">
              {pilotItems.map((item) => (
                <div key={item} className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div id="pilot-form">
            <StoreLeadForm locale={locale} />
          </div>
        </div>
      </section>

      <section className="mx-auto mb-8 max-w-6xl rounded-lg border border-gray-200 bg-gray-50 p-5 md:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex gap-3">
            <ShieldCheck className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-600" />
            <div>
              <h2 className="text-base font-bold text-gray-950">Privacy and fit boundaries are part of the product.</h2>
              <p className="mt-1 max-w-3xl text-sm leading-6 text-gray-600">
                VisuTry Store should show clear privacy and retention copy before upload. Merchants should receive interest signals by default, not raw shopper face images. Virtual try-on is visual decision support, not an optical or medical fit guarantee.
              </p>
            </div>
          </div>
          <Link
            href={`/${locale}/privacy`}
            className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-5 py-3 text-sm font-bold text-gray-700 transition hover:border-blue-300 hover:text-blue-700"
          >
            Privacy policy
          </Link>
        </div>
      </section>
    </main>
  )
}
