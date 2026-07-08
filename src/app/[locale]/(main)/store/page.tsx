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
    title: 'VisuTry Store — AI try-on and frame comparison for eyewear sellers',
    description:
      'Give shoppers a hosted AI eyewear advisor, virtual try-on, frame comparison, and lead capture page for your optical store or eyewear brand.',
    pathname: '/store',
  })
}

const workflow = [
  {
    icon: Upload,
    title: 'Choose the frames you want to promote',
    description: 'Start with your best sellers, new arrivals, or seasonal collection. No full catalog migration required.',
  },
  {
    icon: Link2,
    title: 'Share one beautiful Store link',
    description: 'Use it on your website, Instagram, email, QR code, or customer chat before shoppers visit or buy.',
  },
  {
    icon: Grid2X2,
    title: 'Let shoppers try and compare',
    description: 'Customers upload one photo, preview selected frames, and compare looks side by side.',
  },
  {
    icon: BarChart3,
    title: 'Follow up with real interest',
    description: 'See which frames attract attention so your team can recommend, follow up, or prepare appointments faster.',
  },
]

const proofCards = [
  {
    icon: ScanFace,
    title: 'Guide the first choice',
    description: 'Help shoppers start from frame directions that make sense for their face and style.',
  },
  {
    icon: Glasses,
    title: 'Show frames on their face',
    description: 'Turn product images into a more confident online shopping experience.',
  },
  {
    icon: Grid2X2,
    title: 'Compare shortlists',
    description: 'Make it easier for shoppers to choose between several good options.',
  },
  {
    icon: ClipboardList,
    title: 'Capture buying signals',
    description: 'Collect interest before the shopper disappears, so your team knows what to recommend next.',
  },
]

const audiences = [
  'Independent optical stores',
  'Eyewear ecommerce brands',
  'Frame stylists and image consultants',
  'Agencies building stores for eyewear clients',
]

const setupItems = [
  'A hosted Store page with your brand name',
  'Your first 8-20 priority frames',
  'AI eyewear guidance and try-on flow',
  'Side-by-side frame comparison',
  'Favorite / inquiry collection concept',
  'A simple view of shopper interest signals',
]

export default function StoreLandingPage({ params }: StorePageProps) {
  const locale = params.locale
  const storeSchema = generateStructuredData('softwareApplication', {
    name: 'VisuTry Store',
    url: `https://www.visutry.com/${locale}/store`,
    applicationCategory: 'ShoppingApplication',
    operatingSystem: 'Web Browser',
    description:
      'A hosted AI eyewear advisor, virtual try-on, and frame comparison page for optical stores and eyewear sellers.',
    featureList: [
      'Hosted eyewear Store link',
      'AI frame guidance',
      'Virtual glasses try-on',
      'Side-by-side frame comparison',
      'Favorite and lead capture concept',
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
              For eyewear sellers
            </p>
            <h1 className="max-w-2xl text-3xl font-bold leading-tight text-gray-950 md:text-5xl">
              Help shoppers choose frames before they walk away.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-gray-600 md:text-lg">
              Give your customers a hosted AI eyewear advisor where they can upload a photo, try your frames, compare looks, and share what they like with your team.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <StoreCtaLink
                href="#pilot-form"
                locale={locale}
                ctaLocation="hero_primary"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-sm shadow-blue-600/20 transition hover:bg-blue-700"
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
                See how it helps
              </StoreCtaLink>
            </div>
            <p className="mt-5 text-sm font-medium text-gray-500">
              Designed for small eyewear teams that want more online confidence without building a custom try-on system.
            </p>
          </div>

          <div className="bg-[#eef5ff] p-4 md:p-6 lg:p-8">
            <div className="mx-auto max-w-xl rounded-[1.4rem] border border-white/80 bg-white p-4 shadow-xl shadow-blue-900/10">
              <div className="mb-4 flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Your Store link</p>
                  <p className="text-sm font-bold text-gray-950">Luna Optical · Frame Advisor</p>
                </div>
                <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-bold text-green-700">Live sample</span>
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
                  <p className="mt-3 text-xs font-semibold text-gray-500">Customer photo + frame guidance</p>
                  <p className="mt-1 text-sm font-bold text-gray-950">4 frames ready to compare</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {['Soft square', 'Thin metal', 'Bold acetate', 'Rounded'].map((item, index) => (
                    <div key={item} className="rounded-lg border border-gray-200 bg-white p-3">
                      <div className="mb-2 flex h-16 items-center justify-center rounded-lg bg-blue-50">
                        <div className={`h-5 w-16 rounded-full border-2 ${index === 2 ? 'border-blue-700' : 'border-gray-800'}`} />
                      </div>
                      <p className="text-xs font-bold text-gray-900">{item}</p>
                      <p className="mt-0.5 text-[11px] text-gray-500">Customer interest</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 grid gap-3 rounded-lg border border-blue-100 bg-blue-50 p-4 sm:grid-cols-3">
                {[
                  ['38', 'store visits'],
                  ['21', 'try-ons'],
                  ['7', 'frame inquiries'],
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
          <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-blue-600">How it works</p>
          <h2 className="text-3xl font-bold text-gray-950 md:text-4xl">Turn your frame catalog into a guided shopping experience.</h2>
          <p className="mt-4 text-base leading-7 text-gray-600">
            VisuTry Store gives you a simple, shareable path from frame discovery to try-on, comparison, and follow-up.
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
              More than a try-on image
            </p>
            <h2 className="text-2xl font-bold leading-tight text-gray-950 md:text-3xl">
              Help customers move from “maybe” to a shortlist.
            </h2>
            <p className="mt-4 text-sm leading-6 text-gray-600">
              Shoppers often leave because they cannot tell which frames suit them. VisuTry Store helps them narrow options and gives your team a clearer reason to follow up.
            </p>
            <div className="mt-5 grid gap-3">
              {['Start with a guided recommendation', 'Preview frames on their own photo', 'Compare several options at once', 'Capture favorites and inquiries'].map((item) => (
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
            <h2 className="text-3xl font-bold text-gray-950">For teams that sell frames visually.</h2>
            <p className="mt-4 text-sm leading-6 text-gray-600">
              Use VisuTry Store when shoppers discover you online, ask for recommendations, or need confidence before booking, visiting, or buying.
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
              Early access setup
            </p>
            <h2 className="text-3xl font-bold text-gray-950">Start with a small set of frames and a shareable Store link.</h2>
            <p className="mt-4 text-sm leading-6 text-gray-600">
              We can help you shape a simple first version using a focused selection of frames, so you can show customers a better way to choose before investing in a full integration.
            </p>
            <div className="mt-6 grid gap-3">
              {setupItems.map((item) => (
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
              <h2 className="text-base font-bold text-gray-950">Designed to protect customer trust.</h2>
              <p className="mt-1 max-w-3xl text-sm leading-6 text-gray-600">
                Customers should see clear privacy information before uploading a photo. Your team can focus on frame interest and follow-up signals; virtual try-on remains visual guidance, not a medical or optical fit guarantee.
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
