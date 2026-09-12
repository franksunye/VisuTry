import { DebugImagesPageClient } from '@/components/debug-images/DebugImagesPageClient'

type DebugImagesPageProps = {
  params: { locale: string }
}

export default function DebugImagesPage({ params }: DebugImagesPageProps) {
  return <DebugImagesPageClient locale={params.locale} />
}
