import type { Metadata } from 'next'
import { getServerSession } from 'next-auth/next'
import { headers } from 'next/headers'
import Link from 'next/link'
import { ArrowRight, CheckCircle2, Sparkles } from 'lucide-react'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getRemainingQuotaCount } from '@/lib/quota'
import { AutoRefreshWrapper } from '@/components/payments/AutoRefreshWrapper'
import { StyleExplorerInterface } from '@/components/style-explorer/StyleExplorerInterface'
import { STYLE_EXPLORER_GLASSES_PRESETS } from '@/config/glasses-presets'

interface StyleExplorerPageProps {
  params: { locale: string }
}

export function generateMetadata({ params }: StyleExplorerPageProps): Metadata {
  const canonical = `https://www.visutry.com/${params.locale}/style-explorer`
  return {
    title: 'Style Explorer: Discover Your Eyewear Looks | VisuTry',
    description: 'Choose a style direction and discover four distinct AI glasses try-on looks selected for you.',
    alternates: { canonical },
    openGraph: {
      title: 'VisuTry Style Explorer',
      description: 'Discover four distinct eyewear looks from one photo.',
      url: canonical,
      type: 'website',
    },
  }
}

export default async function StyleExplorerPage({ params }: StyleExplorerPageProps) {
  const session = await getServerSession(authOptions)
  let testSession = null

  if (!session) {
    const raw = headers().get('x-test-session')
    if (raw) {
      try {
        testSession = JSON.parse(raw)
      } catch {
        testSession = null
      }
    }
  }

  if (!session && !testSession) {
    return <PublicStyleExplorer locale={params.locale} />
  }

  let initialRemainingCredits = session?.user?.remainingTrials ?? testSession?.user?.remainingTrials ?? 0
  if (session?.user?.id) {
    const user = await prisma.user.findUnique({ where: { id: session.user.id } })
    if (user) initialRemainingCredits = getRemainingQuotaCount(user)
  }

  return (
    <AutoRefreshWrapper>
      <StyleExplorerInterface initialRemainingCredits={initialRemainingCredits} />
    </AutoRefreshWrapper>
  )
}

function PublicStyleExplorer({ locale }: { locale: string }) {
  const frames = STYLE_EXPLORER_GLASSES_PRESETS.slice(6, 10)
  const signInHref = `/${locale}/auth/signin?callbackUrl=${encodeURIComponent(`/${locale}/style-explorer`)}`

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <section className="overflow-hidden rounded-2xl border border-blue-100 bg-gradient-to-br from-white via-blue-50 to-indigo-50 p-6 sm:p-10">
        <div className="grid items-center gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white px-3 py-1 text-xs font-bold text-blue-700">
              <Sparkles className="h-3.5 w-3.5" /> NEW · STYLE EXPLORER
            </span>
            <h1 className="mt-5 text-3xl font-bold tracking-tight text-gray-950 sm:text-5xl">
              Discover four sides of your eyewear style
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-gray-600">
              Pick a style direction and occasion. VisuTry recommends four visibly different frames, shows them
              before you spend credits, then creates each look from the same portrait.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link href={signInHref} className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-sm font-bold text-white hover:bg-blue-700">
                Start Exploring <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href={`/${locale}/pricing`} className="inline-flex items-center justify-center rounded-lg border border-blue-200 bg-white px-5 py-3 text-sm font-bold text-blue-700">
                View Pricing
              </Link>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {frames.map((frame, index) => (
              <article key={frame.id} className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                <div className="aspect-[3/2] bg-gray-50 p-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`/${frame.assetPath}`} alt={frame.name} className="h-full w-full object-contain" />
                </div>
                <div className="p-3">
                  <p className="text-xs font-bold text-gray-950">{index + 1}. {frame.name}</p>
                  <p className="mt-1 text-[11px] capitalize text-gray-500">{frame.styleTags.slice(0, 2).join(' · ')}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-7 grid gap-4 sm:grid-cols-3">
        {[
          ['Transparent recommendations', 'See and adjust the exact four frames before generation.'],
          ['One proven try-on pipeline', 'Each look uses the same reliable VisuTry generation and task system.'],
          ['Saved automatically', 'Completed results appear in Dashboard History with download and sharing.'],
        ].map(([title, description]) => (
          <article key={title} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <h2 className="mt-4 text-base font-bold text-gray-950">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-gray-600">{description}</p>
          </article>
        ))}
      </section>
    </main>
  )
}
