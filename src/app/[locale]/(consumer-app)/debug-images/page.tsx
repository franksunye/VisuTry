import { DebugImagesPageClient } from '@/components/debug-images/DebugImagesPageClient'

type DebugImagesPageProps = {
  params: Promise<{ locale: string }>
}

export default async function DebugImagesPage(props: DebugImagesPageProps) {
  const params = await props.params;
  return <DebugImagesPageClient locale={params.locale} />
}
