import { PaymentsPageClient } from '@/components/payments/PaymentsPageClient'

type PaymentsPageProps = {
  params: { locale: string }
}

export const dynamic = 'force-static'

export default function PaymentsPage({ params }: PaymentsPageProps) {
  return <PaymentsPageClient locale={params.locale} />
}
