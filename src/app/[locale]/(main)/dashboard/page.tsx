import { DashboardPageClient } from '@/components/dashboard/DashboardPageClient'

type DashboardPageProps = {
  params: { locale: string }
}

export default function DashboardPage({ params }: DashboardPageProps) {
  return <DashboardPageClient locale={params.locale} />
}
