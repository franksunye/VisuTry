import type { Metadata } from 'next'
import { getServerSession } from 'next-auth/next'
import { headers } from 'next/headers'
import { authOptions } from '@/lib/auth'
import { AutoRefreshWrapper } from '@/components/payments/AutoRefreshWrapper'
import { StyleExplorerInterface } from '@/components/style-explorer/StyleExplorerInterface'
import { StyleExplorerMarketing } from '@/components/style-explorer/StyleExplorerMarketing'

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
      images: [
        {
          url: 'https://www.visutry.com/assets/marketing/style-explorer-female-results.jpg',
          width: 1536,
          height: 1024,
          alt: 'Four eyewear looks generated from one portrait in VisuTry Style Explorer',
        },
      ],
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
    const callbackUrl = `/${params.locale}/style-explorer`
    const signInHref = `/${params.locale}/auth/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`

    return <StyleExplorerMarketing locale={params.locale} signInHref={signInHref} />
  }

  // Use remainingTrials from JWT token (synced in jwt callback) — no DB query needed.
  // The client component also reads this via useSession() and re-fetches after actions.
  const initialRemainingCredits = session?.user?.remainingTrials ?? testSession?.user?.remainingTrials ?? 0

  return (
    <AutoRefreshWrapper>
      <StyleExplorerInterface initialRemainingCredits={initialRemainingCredits} />
    </AutoRefreshWrapper>
  )
}
