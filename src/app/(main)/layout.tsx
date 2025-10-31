import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { HomeStructuredData } from './home-structured-data'

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <HomeStructuredData />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col">
        <Header />
        <div className="flex-grow">
          {children}
        </div>
        <Footer />
      </div>
    </>
  )
}

