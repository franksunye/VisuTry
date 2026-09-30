import { DashboardPageClient } from '@/components/dashboard/DashboardPageClient'
import { RouteMessagesProvider } from '@/components/i18n/RouteMessagesProvider'

type DashboardPageProps = {
  params: Promise<{ locale: string }>
}

export const dynamic = 'force-static'

export default async function DashboardPage(props: DashboardPageProps) {
  const params = await props.params;
  return (
    <RouteMessagesProvider namespaces={['faceAnalysis.dashboard']}>
      <DashboardPageClient locale={params.locale} />
    </RouteMessagesProvider>
  )
}
