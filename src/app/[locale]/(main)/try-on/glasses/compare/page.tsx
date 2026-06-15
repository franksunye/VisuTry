import { Metadata } from 'next'
import { getServerSession } from 'next-auth/next'
import { headers } from 'next/headers'
import Link from 'next/link'
import { Glasses, Lock, Sparkles } from 'lucide-react'
import { authOptions } from '@/lib/auth'
import { AutoRefreshWrapper } from '@/components/payments/AutoRefreshWrapper'
import { FrameCompareInterface } from '@/components/compare/FrameCompareInterface'
import { getRemainingQuotaCount } from '@/lib/quota'
import { prisma } from '@/lib/prisma'

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
    <main className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <section className="grid gap-8 rounded-lg border border-gray-200 bg-white p-6 shadow-sm lg:grid-cols-[1fr_420px] lg:p-10">
        <div className="flex flex-col justify-center">
          <div className="mb-4 inline-flex w-fit items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700">
            <Glasses className="h-4 w-4" />
            Frame Compare
          </div>
          <h1 className="text-4xl font-bold tracking-normal text-gray-950">
            Compare glasses frames on your photo
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-gray-600">
            Choose built-in frame presets and generate a clean side-by-side AI try-on comparison.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              href={signInHref}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-sm hover:bg-blue-700"
            >
              <Sparkles className="h-4 w-4" />
              Start Comparing
            </Link>
            <Link
              href={`/${locale}/try-on/glasses`}
              className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-5 py-3 text-sm font-bold text-gray-700 hover:border-blue-300 hover:text-blue-700"
            >
              Try Custom Glasses
            </Link>
          </div>
        </div>
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
          <div className="grid grid-cols-2 gap-3">
            {['Round', 'Wayfarer', 'Aviator', 'Browline'].map((name, index) => (
              <div key={name} className="aspect-[4/5] rounded-lg bg-white p-4 shadow-sm">
                <div className="mb-3 h-3 w-16 rounded-full bg-gray-200" />
                <div className="flex h-28 items-center justify-center rounded-md bg-blue-50 text-blue-600">
                  <Glasses className="h-10 w-10" />
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-sm font-bold text-gray-900">{name}</span>
                  {index === 0 ? <Lock className="h-4 w-4 text-gray-400" /> : null}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}
