import { notFound } from 'next/navigation'
import { getExperienceAdminWorkspace } from '@/modules/store/application'
import { ExperiencesList } from '@/components/admin/ExperienceAdminUI'

export const dynamic = 'force-dynamic'

export default async function AdminExperiencesPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const workspace = await getExperienceAdminWorkspace({ merchantId: params.id })
  if (!workspace) notFound()
  return <ExperiencesList workspace={workspace} />
}
