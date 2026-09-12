import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { HomeStructuredData } from '@/components/seo/HomeStructuredData'
import { ConsumerSessionBoundary } from '@/components/providers/ConsumerSessionBoundary'

/**
 * Session-aware shell for 2C application workflows.
 *
 * This boundary is intentionally scoped to the consumer application route
 * group instead of the locale root or public SEO/marketing routes.
 */
export default function ConsumerAppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ConsumerSessionBoundary>
      <HomeStructuredData />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col">
        <Header />
        <div className="flex-grow">{children}</div>
        <Footer />
      </div>
    </ConsumerSessionBoundary>
  )
}
