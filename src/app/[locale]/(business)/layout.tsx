import { BusinessHeader } from '@/components/business/BusinessHeader'
import { BusinessFooter } from '@/components/business/BusinessFooter'

export default function BusinessLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-950">
      <BusinessHeader />
      {children}
      <BusinessFooter />
    </div>
  )
}
