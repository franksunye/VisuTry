import type { Metadata } from 'next'
import { BusinessHeader } from '@/components/business/BusinessHeader'
import { BusinessFooter } from '@/components/business/BusinessFooter'

export const metadata: Metadata = {
  openGraph: {
    title: 'VisuTry Business | AI Commerce for Eyewear',
    description: 'Turn eyewear catalogs into guided shopping experiences with recommendation, Virtual Try-On, Compare, and measurable shopper intent.',
    siteName: 'VisuTry',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'VisuTry Business | AI Commerce for Eyewear',
    description: 'Turn eyewear catalogs into guided shopping experiences with recommendation, Virtual Try-On, Compare, and measurable shopper intent.',
  },
}

export default function BusinessLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-950">
      <BusinessHeader />
      {children}
      <BusinessFooter />
    </div>
  )
}
