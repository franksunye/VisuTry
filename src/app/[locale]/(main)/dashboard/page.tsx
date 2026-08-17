import { DashboardPageClient } from '@/components/dashboard/DashboardPageClient'
import { RouteMessagesProvider } from '@/components/i18n/RouteMessagesProvider'

type DashboardPageProps = {
  params: { locale: string }
}

export const dynamic = 'force-static'

export default function DashboardPage({ params }: DashboardPageProps) {
  return (
    <RouteMessagesProvider namespaces={['faceAnalysis.dashboard']}>
      <DashboardPageClient locale={params.locale} />
    </RouteMessagesProvider>
  )
}
