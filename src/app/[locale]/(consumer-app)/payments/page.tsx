import { PaymentsPageClient } from '@/components/payments/PaymentsPageClient'

type PaymentsPageProps = {
  params: Promise<{ locale: string }>
}

export const dynamic = 'force-static'

export default async function PaymentsPage(props: PaymentsPageProps) {
  const params = await props.params;
  return <PaymentsPageClient locale={params.locale} />
}
