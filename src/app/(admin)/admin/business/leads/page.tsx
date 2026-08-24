import { BusinessPilotLeadBoard } from '@/components/admin/BusinessPilotLeadBoard'
import { listBusinessPilotLeads } from '@/modules/business'

export const dynamic = 'force-dynamic'

export default async function BusinessPilotLeadsPage() {
  const leads = await listBusinessPilotLeads()
  const serialized = leads.map((lead) => ({
    ...lead,
    status: String(lead.status),
    createdAt: lead.createdAt.toISOString(),
    updatedAt: lead.updatedAt.toISOString(),
    statusUpdatedAt: lead.statusUpdatedAt.toISOString(),
    demoAt: lead.demoAt?.toISOString() || null,
  }))

  return (
    <div className="p-8">
      <div className="mb-7">
        <p className="text-sm font-semibold text-blue-700">B2B acquisition</p>
        <h1 className="mt-1 text-3xl font-bold text-gray-950">Pilot Leads</h1>
        <p className="mt-2 text-sm text-gray-600">Qualify Founding Merchant requests, record objections and next actions, and close the Pilot learning loop.</p>
      </div>
      <BusinessPilotLeadBoard initialLeads={serialized} />
    </div>
  )
}
