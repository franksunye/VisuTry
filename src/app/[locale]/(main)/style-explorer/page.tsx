import type { Metadata } from 'next'
import { StyleExplorerGate } from '@/components/style-explorer/StyleExplorerGate'

interface StyleExplorerPageProps {
  params: { locale: string }
}

export const dynamic = 'force-static'

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

export default function StyleExplorerPage({ params }: StyleExplorerPageProps) {
  const callbackUrl = `/${params.locale}/style-explorer`
  const signInHref = `/${params.locale}/auth/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`

  return <StyleExplorerGate locale={params.locale} signInHref={signInHref} />
}
