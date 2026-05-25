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
import { ArrowRight, CheckCircle2, Image, Shield, Upload } from "lucide-react"

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
      title: "AI Glasses Try-On from Photo or Screenshot | VisuTry",
      description: "Try on glasses online from a face photo and your own glasses product image or screenshot. Compare frames before buying with VisuTry's browser-based AI glasses try-on.",
      alternates: {
        canonical: `https://visutry.com/${params.locale}/try-on/glasses`,
      },
      openGraph: {
        title: "AI Glasses Try-On from Photo or Screenshot | VisuTry",
        description: "Upload a face photo and a glasses product image or screenshot to preview how frames look before buying. No app install required.",
        url: `https://visutry.com/${params.locale}/try-on/glasses`,
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
    url: `https://visutry.com/${locale}/try-on/${type}`,
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
          question: "Can I try on glasses from a screenshot?",
          answer: "Yes. VisuTry lets you upload your face photo and a glasses product image or screenshot, then uses AI to create a realistic preview on your face.",
        },
        {
          question: "Can I upload my own glasses image?",
          answer: "Yes. You can upload a product photo, store image, email screenshot, or a transparent frame image. Clear front-facing product images usually work best.",
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
    url: `https://visutry.com/${locale}/try-on/${type}`,
  })

  return (
    <main className="bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(appSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <section className="mx-auto grid max-w-6xl gap-10 px-4 py-12 md:grid-cols-[1.1fr_0.9fr] md:items-center md:py-16">
        <div>
          <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-blue-600">
            AI glasses try-on online
          </p>
          <h1 className="mb-5 max-w-3xl text-4xl font-bold leading-tight text-gray-950 md:text-5xl">
            Try on glasses from a photo or product screenshot
          </h1>
          <p className="mb-7 max-w-2xl text-lg leading-8 text-gray-600">
            Upload a clear face photo and your own glasses image. VisuTry creates a realistic preview so you can compare frames before buying, without installing an app.
          </p>
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

        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-6">
          <div className="grid gap-4">
            <div className="rounded-xl bg-white p-5 shadow-sm">
              <Upload className="mb-3 h-6 w-6 text-blue-600" />
              <h2 className="mb-2 text-lg font-semibold text-gray-950">Upload your photos</h2>
              <p className="text-sm leading-6 text-gray-600">
                Use a face photo plus a glasses product photo, store image, or screenshot from email.
              </p>
            </div>
            <div className="rounded-xl bg-white p-5 shadow-sm">
              <Image className="mb-3 h-6 w-6 text-blue-600" />
              <h2 className="mb-2 text-lg font-semibold text-gray-950">Preview and compare</h2>
              <p className="text-sm leading-6 text-gray-600">
                Check how different frames look on your face before choosing what to buy.
              </p>
            </div>
            <div className="rounded-xl bg-white p-5 shadow-sm">
              <Shield className="mb-3 h-6 w-6 text-blue-600" />
              <h2 className="mb-2 text-lg font-semibold text-gray-950">Browser-based and private</h2>
              <p className="text-sm leading-6 text-gray-600">
                No app install. Free data is stored for 7 days; Credits Pack users get 90 days of history retention.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-gray-200 bg-gray-50">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-10 md:grid-cols-3">
          {[
            "Works with your own glasses images",
            "Useful for designer and store product photos",
            "One-time Credits Pack available after the free try-on",
          ].map((item) => (
            <div key={item} className="flex gap-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-600" />
              <p className="text-sm font-medium text-gray-800">{item}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-12">
        <h2 className="mb-6 text-2xl font-bold text-gray-950">AI glasses try-on FAQ</h2>
        <div className="space-y-4">
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
    </main>
  )
}
