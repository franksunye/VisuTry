import { PublicHeader } from '@/components/layout/PublicHeader'
import { Footer } from '@/components/layout/Footer'
import { HomeStructuredData } from '@/components/seo/HomeStructuredData'

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <HomeStructuredData />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col">
        <PublicHeader />
        <div className="flex-grow">{children}</div>
        <Footer />
      </div>
    </>
  )
}
