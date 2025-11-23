import { redirect, notFound } from "next/navigation"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { TryOnInterface } from "@/components/try-on/TryOnInterface"
import { AutoRefreshWrapper } from "@/components/payments/AutoRefreshWrapper"
import { headers } from "next/headers"
import { generateStructuredData } from "@/lib/seo"
import { Metadata } from 'next'
import { TryOnType, getTryOnConfig, urlToTryOnType, getAllTryOnTypes, tryOnTypeToUrl } from "@/config/try-on-types"

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

  // Redirect to sign-in if not authenticated
  if (!session && !testSession) {
    redirect(`/${locale}/auth/signin?callbackUrl=${encodeURIComponent(`/${locale}/try-on/${type}`)}`)
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

