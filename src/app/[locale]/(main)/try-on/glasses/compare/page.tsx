import { Metadata } from 'next'
import { getServerSession } from 'next-auth/next'
import { headers } from 'next/headers'
import Link from 'next/link'
import { CheckCircle2, Grid2X2, Sparkles } from 'lucide-react'
import { authOptions } from '@/lib/auth'
import { AutoRefreshWrapper } from '@/components/payments/AutoRefreshWrapper'
import { FrameCompareInterface } from '@/components/compare/FrameCompareInterface'
import { getRemainingQuotaCount } from '@/lib/quota'
import { prisma } from '@/lib/prisma'
import { CompareLandingVisual } from '@/components/marketing/CompareLandingVisual'

interface FrameComparePageProps {
  params: {
    locale: string
  }
}

export async function generateMetadata({ params }: FrameComparePageProps): Promise<Metadata> {
  return {
    title: 'Compare Glasses Frames Online | VisuTry',
    description:
      'Upload a face photo, choose built-in glasses frame presets, and compare AI try-on results side by side.',
    alternates: {
      canonical: `https://www.visutry.com/${params.locale}/try-on/glasses/compare`,
    },
    openGraph: {
      title: 'Compare Glasses Frames Online | VisuTry',
      description: 'Quickly compare built-in glasses frame presets on your own photo with AI try-on.',
      url: `https://www.visutry.com/${params.locale}/try-on/glasses/compare`,
      type: 'website',
    },
  }
}

export default async function FrameComparePage({ params }: FrameComparePageProps) {
  const session = await getServerSession(authOptions)
  let initialRemainingCredits = session?.user?.remainingTrials ?? 0

  let testSession = null
  if (!session) {
    const headersList = headers()
    const testSessionHeader = headersList.get('x-test-session')
    if (testSessionHeader) {
      try {
        testSession = JSON.parse(testSessionHeader)
      } catch (error) {
        console.error('Failed to parse test session:', error)
      }
    }
  }

  if (session?.user?.id) {
    const user = await prisma.user.findUnique({ where: { id: session.user.id } })
    if (user) {
      initialRemainingCredits = getRemainingQuotaCount(user)
    }
  }

  if (!session && !testSession) {
    return <PublicFrameCompareLanding locale={params.locale} />
  }

  return (
    <AutoRefreshWrapper>
      <FrameCompareInterface initialRemainingCredits={initialRemainingCredits} />
    </AutoRefreshWrapper>
  )
}

function PublicFrameCompareLanding({ locale }: { locale: string }) {
  const signInHref = `/${locale}/auth/signin?callbackUrl=${encodeURIComponent(
    `/${locale}/try-on/glasses/compare`,
  )}`

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="sr-only">Compare glasses frames on your photo</h1>
      <CompareLandingVisual locale={locale} startHref={signInHref} />

      <section className="mt-8 grid gap-4 md:grid-cols-3">
        {[
          {
            title: 'Start with one credit',
            description: 'Trial users can compare one preset frame first, then add credits when they want a full board.',
          },
          {
            title: 'Up to four frames',
            description: 'Credits map directly to generated frames, so a 4-frame comparison uses up to 4 credits.',
          },
          {
            title: 'Saved to history',
            description: 'Completed results are kept in Dashboard History according to your account retention plan.',
          },
        ].map((item) => (
          <div key={item.title} className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
            <CheckCircle2 className="mb-4 h-5 w-5 text-green-600" />
            <h2 className="mb-2 text-base font-bold text-gray-950">{item.title}</h2>
            <p className="text-sm leading-6 text-gray-600">{item.description}</p>
          </div>
        ))}
      </section>

      <section className="mt-8 rounded-lg border border-blue-200 bg-blue-50 p-5 sm:flex sm:items-center sm:justify-between">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 text-sm font-bold text-blue-700">
            <Grid2X2 className="h-4 w-4" />
            Compare before buying
          </div>
          <p className="max-w-2xl text-sm leading-6 text-blue-900">
            Use Compare when you have several likely frame shapes and want a fast side-by-side view.
            Use Glasses Try-On when you already have a specific product image or screenshot.
          </p>
        </div>
        <div className="mt-4 flex flex-col gap-3 sm:mt-0 sm:flex-row">
          <Link
            href={signInHref}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-sm hover:bg-blue-700"
          >
            <Sparkles className="h-4 w-4" />
            Start Comparing
          </Link>
          <Link
            href={`/${locale}/pricing`}
            className="inline-flex items-center justify-center rounded-lg border border-blue-200 bg-white px-5 py-3 text-sm font-bold text-blue-700 hover:border-blue-300"
          >
            View pricing
          </Link>
        </div>
      </section>
    </main>
  )
}
