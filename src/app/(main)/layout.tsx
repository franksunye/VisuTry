import { Footer } from '@/components/layout/Footer'

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col">
        <div className="flex-grow">
          {children}
        </div>
        <Footer />
      </div>
    </>
  )
}

