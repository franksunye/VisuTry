import { redirect, notFound } from "next/navigation"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { TryOnInterface } from "@/components/try-on/TryOnInterface"
import { AutoRefreshWrapper } from "@/components/payments/AutoRefreshWrapper"
import { headers } from "next/headers"
import { generateStructuredData } from "@/lib/seo"
import { Metadata } from 'next'
import { TryOnType, getTryOnConfig, urlToTryOnType, getAllTryOnTypes, tryOnTypeToUrl } from "@/config/try-on-types"
import Link from "next/link"
import { ArrowRight, CheckCircle2, CreditCard, Image, Shield, Upload } from "lucide-react"
import { ModelTryOnSlides } from "@/components/marketing/ModelTryOnSlides"
import { getTranslations } from "next-intl/server"

interface TryOnPageProps {
  params: {
    locale: string
    type: string
  }
}

// Generate metadata dynamically based on try-on type
export async function generateMetadata({ params }: TryOnPageProps): Promise<Metadata> {
  const marketingT = await getTranslations({ locale: params.locale, namespace: 'marketing.tryOnLanding' })
  const tryOnType = urlToTryOnType(params.type)
  
  if (!tryOnType) {
    return {
      title: marketingT('notFoundTitle'),
      description: marketingT('notFoundDescription')
    }
  }

  const config = getTryOnConfig(tryOnType)

  if (tryOnType === "GLASSES") {
    return {
      title: "Virtual Glasses Try On Online from Photo | VisuTry",
      description: marketingT('metaDescription'),
      alternates: {
        canonical: `https://www.visutry.com/${params.locale}/try-on/glasses`,
      },
      openGraph: {
        title: marketingT('metaTitle'),
        description: marketingT('ogDescription'),
        url: `https://www.visutry.com/${params.locale}/try-on/glasses`,
        type: "website",
      },
    }
  }
  
  return {
    title: `${config.displayName} - Virtual Try-On with AI | VisuTry`,
    description: `Upload your photo and try on ${config.name.toLowerCase()} virtually with AI. See how different ${config.name.toLowerCase()} look on you before you buy.`,
  }
}

// Generate static params for all try-on types
export function generateStaticParams() {
  return getAllTryOnTypes().map(type => ({
    type: tryOnTypeToUrl(type)
  }))
}

export default async function TryOnTypePage({ params }: TryOnPageProps) {
  const { locale, type } = params
  
  // Convert URL type to TryOnType enum
  const tryOnType = urlToTryOnType(type)
  
  // If type is invalid, show 404
  if (!tryOnType) {
    notFound()
  }

  const config = getTryOnConfig(tryOnType)

  // Check authentication
  const session = await getServerSession(authOptions)
  
  // Get test session from headers if no real session
  let testSession = null
  if (!session) {
    const headersList = headers()
    const testSessionHeader = headersList.get('x-test-session')
    if (testSessionHeader) {
      try {
        testSession = JSON.parse(testSessionHeader)
      } catch (e) {
        console.error('Failed to parse test session:', e)
      }
    }
  }

  // Show an indexable public landing page for unauthenticated visitors.
  // The actual try-on tool still requires sign-in after the user chooses to start.
  if (!session && !testSession) {
    return <PublicTryOnLanding locale={locale} type={type} tryOnType={tryOnType} />
  }

  // Generate structured data for SEO
  const structuredData = generateStructuredData('softwareApplication', {
    name: `VisuTry - ${config.displayName}`,
    description: `Virtual ${config.name} try-on powered by AI`,
    url: `https://www.visutry.com/${locale}/try-on/${type}`,
  })

  return (
    <AutoRefreshWrapper>
      <div className="container mx-auto px-4 py-8">
      {/* Structured Data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      {/* Try-On Interface */}
      <TryOnInterface type={tryOnType} />
      </div>
    </AutoRefreshWrapper>
  )
}

async function PublicTryOnLanding({
  locale,
  type,
  tryOnType,
}: {
  locale: string
  type: string
  tryOnType: TryOnType
}) {
  const t = await getTranslations({ locale, namespace: 'marketing.tryOnLanding' })
  const config = getTryOnConfig(tryOnType)
  const isGlasses = tryOnType === "GLASSES"
  const startHref = `/${locale}/auth/signin?callbackUrl=${encodeURIComponent(`/${locale}/try-on/${type}`)}`

  const faqItems = isGlasses
    ? [
        {
          question: t('faq.q1Question'),
          answer: t('faq.q1Answer'),
        },
        {
          question: t('faq.q2Question'),
          answer: t('faq.q2Answer'),
        },
        {
          question: t('faq.q3Question'),
          answer: t('faq.q3Answer'),
        },
        {
          question: t('faq.q4Question'),
          answer: t('faq.q4Answer'),
        },
        {
          question: t('faq.q5Question'),
          answer: t('faq.q5Answer'),
        },
        {
          question: t('faq.q6Question'),
          answer: t('faq.q6Answer'),
        },
        {
          question: t('faq.q7Question'),
          answer: t('faq.q7Answer'),
        },
        {
          question: t('faq.q8Question'),
          answer: t('faq.q8Answer'),
        },
        {
          question: t('faq.q9Question'),
          answer: t('faq.q9Answer'),
        },
      ]
    : [
        {
          question: `Can I try on ${config.name.toLowerCase()} online?`,
          answer: `Yes. Upload your photo and a clear ${config.name.toLowerCase()} product image to preview the item with AI.`,
        },
        {
          question: "Do I need to install an app?",
          answer: "No. VisuTry runs in the browser on desktop and mobile.",
        },
      ]

  const faqSchema = generateStructuredData("faqPage", {
    questions: faqItems,
  })

  const appSchema = generateStructuredData("softwareApplication", {
    name: isGlasses ? "VisuTry AI Glasses Try-On" : `VisuTry - ${config.displayName}`,
    description: isGlasses
      ? "Browser-based AI glasses try-on from a face photo and a glasses product image or screenshot."
      : `Virtual ${config.name} try-on powered by AI.`,
    url: `https://www.visutry.com/${locale}/try-on/${type}`,
  })
  const valuePoints = isGlasses
    ? [
        t('valuePoints.p1'),
        t('valuePoints.p2'),
        t('valuePoints.p3'),
      ]
    : [
        `Upload your own ${config.name.toLowerCase()} image`,
        "Preview the item on your photo before buying",
        "Browser-based flow with no app install",
      ]
  const landingSteps = isGlasses
    ? [
        {
          icon: Upload,
          title: t('steps.s1Title'),
          description: t('steps.s1Description'),
        },
        {
          icon: Image,
          title: t('steps.s2Title'),
          description: t('steps.s2Description'),
        },
        {
          icon: Shield,
          title: t('steps.s3Title'),
          description: t('steps.s3Description'),
        },
        {
          icon: CreditCard,
          title: t('steps.s4Title'),
          description: t('steps.s4Description'),
        },
      ]
    : [
        {
          icon: Upload,
          title: `Upload your ${config.name.toLowerCase()} photos`,
          description: `Use a clear personal photo and a ${config.name.toLowerCase()} product image.`,
        },
        {
          icon: Image,
          title: "Preview the look",
          description: "Generate an AI preview before deciding what to buy.",
        },
        {
          icon: Shield,
          title: "Browser-based and private",
          description: "No app install. Your try-on history follows your account retention plan.",
        },
        {
          icon: CreditCard,
          title: "Continue with credits",
          description: "Start free, then use a one-time Credits Pack when you want more AI try-ons.",
        },
      ]

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(appSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <div className="mx-auto max-w-6xl px-4 py-8 md:py-10">
        {isGlasses && <h1 className="sr-only">Try on glasses online from a photo</h1>}
        {isGlasses && (
          <div className="mb-8">
            <ModelTryOnSlides locale={locale} mode="glasses" />
          </div>
        )}

        <section className="grid gap-8 lg:grid-cols-[0.82fr_1.18fr] lg:items-start">
          <div className="max-w-2xl">
          <p className="mb-3 inline-flex items-center rounded-lg border border-blue-200 bg-white px-3 py-1 text-sm font-semibold text-blue-700">
            {t('howItWorks')}
          </p>
          <h2 className="mb-4 text-2xl font-bold leading-tight text-gray-950 md:text-3xl">
            {t('title')}
          </h2>
          <p className="mb-6 text-base leading-7 text-gray-600">
            {t('description')}
          </p>
          <div className="mb-7 grid gap-3">
            {valuePoints.map((item) => (
              <div key={item} className="flex items-start gap-3 text-sm font-medium text-gray-700">
                <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-600" />
                <span>{item}</span>
              </div>
            ))}
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href={startHref}
              className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700"
            >
              {t('startButton')}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
            <Link
              href={`/${locale}/pricing`}
              className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-5 py-3 text-sm font-semibold text-gray-900 transition-colors hover:bg-gray-50"
            >
              {t('pricingButton')}
            </Link>
          </div>
          <p className="mt-4 text-sm text-gray-500">{t('ctaNote')}</p>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white/80 p-4 shadow-sm md:p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            {landingSteps.map((step) => {
              const Icon = step.icon
              return (
                <div key={step.title} className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h2 className="mb-2 text-base font-semibold text-gray-950">{step.title}</h2>
                  <p className="text-sm leading-6 text-gray-600">{step.description}</p>
                </div>
              )
            })}
          </div>
          <p className="mt-4 rounded-lg bg-blue-50 px-4 py-3 text-sm leading-6 text-blue-900">
            {t('shortlistNotePrefix')}{' '}
            <Link href={`/${locale}/face-analysis`} className="font-semibold text-blue-700 hover:text-blue-900">
              {t('shortlistNoteLink')}
            </Link>
            {' '}{t('shortlistNoteSuffix')}
          </p>
        </div>
      </section>

      <section className="mt-8 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 text-sm font-semibold uppercase tracking-normal text-blue-600">
              Questions shoppers ask
            </p>
            <h2 className="text-2xl font-bold text-gray-950">{t('faqTitle')}</h2>
          </div>
          <Link
            href={`/${locale}/blog/prescription-glasses-virtual-tryon-guide`}
            className="text-sm font-semibold text-blue-600 hover:text-blue-800"
          >
            {t('guideLink')}
          </Link>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {faqItems.map((item) => (
            <details key={item.question} className="rounded-lg border border-gray-200 bg-white p-5">
              <summary className="cursor-pointer text-base font-semibold text-gray-950">
                {item.question}
              </summary>
              <p className="mt-3 text-sm leading-6 text-gray-600">{item.answer}</p>
            </details>
          ))}
        </div>
      </section>
      </div>
    </main>
  )
}
