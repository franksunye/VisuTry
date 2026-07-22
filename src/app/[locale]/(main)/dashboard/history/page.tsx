import { HistoryPageClient } from '@/components/dashboard/HistoryPageClient'

interface SearchParams {
  page?: string
  status?: string
}

interface HistoryPageProps {
  searchParams: Promise<SearchParams>
  params: { locale: string }
}

export default async function HistoryPage({ searchParams, params }: HistoryPageProps) {
  return <HistoryPageClient searchParamsPromise={searchParams} locale={params.locale} />
}
