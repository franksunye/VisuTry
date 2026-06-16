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

interface TryOnPageProps {
  params: {
    locale: string
    type: string
  }
}

// Generate metadata dynamically based on try-on type
export async function generateMetadata({ params }: TryOnPageProps): Promise<Metadata> {
  const tryOnType = urlToTryOnType(params.type)
  
  if (!tryOnType) {
    return {
      title: 'Try-On Not Found | VisuTry',
      description: 'The requested try-on type was not found.'
    }
  }

  const config = getTryOnConfig(tryOnType)

  if (tryOnType === "GLASSES") {
    return {
      title: "Virtual Glasses Try On Online from Photo | VisuTry",
      description: "Try on glasses online at home from a face photo and your own glasses product image or screenshot. Compare frames before buying with VisuTry's browser-based AI glasses try-on.",
      alternates: {
        canonical: `https://www.visutry.com/${params.locale}/try-on/glasses`,
      },
      openGraph: {
        title: "Virtual Glasses Try On Online from Photo | VisuTry",
        description: "Upload a face photo and a glasses product image or screenshot to preview how frames look before buying at home. No app install required.",
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

function PublicTryOnLanding({
  locale,
  type,
  tryOnType,
}: {
  locale: string
  type: string
  tryOnType: TryOnType
}) {
  const config = getTryOnConfig(tryOnType)
  const isGlasses = tryOnType === "GLASSES"
  const startHref = `/${locale}/auth/signin?callbackUrl=${encodeURIComponent(`/${locale}/try-on/${type}`)}`

  const faqItems = isGlasses
    ? [
        {
          question: "Can I try on glasses online from a screenshot?",
          answer: "Yes. VisuTry lets you upload your face photo and a glasses product image or screenshot, then uses AI to create a realistic virtual glasses try-on preview on your face.",
        },
        {
          question: "Can I upload my own glasses image for virtual try-on?",
          answer: "Yes. You can upload a product photo, store image, email screenshot, or a transparent frame image. Clear front-facing product images usually work best.",
        },
        {
          question: "Can I try on glasses at home before buying?",
          answer: "Yes. VisuTry runs in your browser, so you can try on glasses at home from a face photo and compare frame images before deciding what to buy.",
        },
        {
          question: "What if I do not know which glasses to try first?",
          answer: "Start with AI face analysis to estimate your face shape and get frame recommendations, then return to virtual glasses try-on with a better shortlist.",
        },
        {
          question: "How does AI try on glasses work?",
          answer: "AI glasses try-on combines your face photo with a glasses product image or screenshot to generate a preview of the frame on your face. It is most useful after you shortlist styles by face shape, size, and personal taste.",
        },
        {
          question: "Is VisuTry a try on glasses app?",
          answer: "VisuTry works like a try on glasses app, but it runs in your web browser. You can use it on desktop or mobile without installing an app.",
        },
        {
          question: "Can I try on blue light glasses online?",
          answer: "Yes. If you have a clear product image or screenshot of blue light glasses, you can upload it and preview the frame on your face before buying.",
        },
        {
          question: "Do I need to install an app?",
          answer: "No. VisuTry runs in the browser on desktop and mobile. Sign in, upload your photos, and start the glasses try-on flow online.",
        },
        {
          question: "What happens after my free try-on?",
          answer: "You can continue with a Credits Pack: 30 AI try-ons for USD 2.99, no subscription required. Credits do not expire.",
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
        "Virtual glasses try-on from photo",
        "Try glasses online at home",
        "Works with product photos and screenshots",
        "Use face analysis first if you need frame ideas",
        "One-time Credits Pack available after the free try-on",
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
          title: "Upload your photos",
          description: "Use a face photo plus a glasses product photo, store image, or screenshot from email.",
        },
        {
          icon: Image,
          title: "Preview and compare",
          description: "Check how different frames look on your face before choosing what to buy.",
        },
        {
          icon: Shield,
          title: "Browser-based and private",
          description: "No app install. Free data is stored for 7 days; Credits Pack users get 90 days of history retention.",
        },
        {
          icon: CreditCard,
          title: "Continue when you need more",
          description: "Start with one free try-on, then use a one-time Credits Pack when you want to compare more frames.",
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
        {isGlasses && (
          <div className="mb-8">
            <ModelTryOnSlides locale={locale} mode="glasses" />
          </div>
        )}

        <section className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <div className="max-w-2xl">
          <p className="mb-3 inline-flex items-center rounded-full border border-blue-200 bg-white px-3 py-1 text-sm font-semibold text-blue-700">
            Virtual glasses try on online
          </p>
          <h1 className="mb-4 text-3xl font-bold leading-tight text-gray-950 md:text-5xl">
            Try On Glasses Online from a Photo
          </h1>
          <p className="mb-6 text-lg leading-8 text-gray-600">
            Upload a clear face photo and your own glasses image. VisuTry creates a realistic
            virtual glasses try-on preview so you can compare frames at home before buying,
            without installing an app.
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
              Start free glasses try-on
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
            <Link
              href={`/${locale}/pricing`}
              className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-5 py-3 text-sm font-semibold text-gray-900 transition-colors hover:bg-gray-50"
            >
              30 try-ons for USD 2.99
            </Link>
          </div>
          <p className="mt-4 text-sm text-gray-500">
            One free try-on to start. Credits Pack is a one-time purchase, no subscription required.
          </p>
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
            Not sure what glasses suit your face? Start with{' '}
            <Link href={`/${locale}/face-analysis`} className="font-semibold text-blue-700 hover:text-blue-900">
              AI face shape analysis
            </Link>
            {' '}to get a shortlist, then come back here to try on glasses online from your own
            photo and product screenshots.
          </p>
        </div>
      </section>

      <section className="mt-8 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 text-sm font-semibold uppercase tracking-normal text-blue-600">
              Questions shoppers ask
            </p>
            <h2 className="text-2xl font-bold text-gray-950">AI glasses try-on FAQ</h2>
          </div>
          <Link
            href={`/${locale}/blog/prescription-glasses-virtual-tryon-guide`}
            className="text-sm font-semibold text-blue-600 hover:text-blue-800"
          >
            Read the buying guide
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
