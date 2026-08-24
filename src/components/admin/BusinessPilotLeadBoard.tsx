'use client'

import { useState } from 'react'
import { BUSINESS_PILOT_LEAD_STATUSES } from '@/modules/business/domain/business-pilot-lead'

type Lead = {
  id: string
  status: string
  contactName: string
  email: string
  businessName: string
  businessType: string
  websiteUrl: string | null
  frameCountRange: string
  trafficSource: string | null
  goal: string
  message: string | null
  acquisitionSource: string | null
  acquisitionMedium: string | null
  campaignName: string | null
  objection: string | null
  nextAction: string | null
  pilotOutcome: string | null
  demoAt: string | null
  createdAt: string
}

const statusLabel: Record<string, string> = {
  NEW: 'New', CONTACTED: 'Contacted', QUALIFIED: 'Qualified', DEMO_SCHEDULED: 'Demo scheduled',
  PILOT_REQUESTED: 'Pilot requested', PILOT_ACTIVE: 'Pilot active', CLOSED_WON: 'Closed won', CLOSED_LOST: 'Closed lost',
}

export function BusinessPilotLeadBoard({ initialLeads }: { initialLeads: Lead[] }) {
  const [leads, setLeads] = useState(initialLeads)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [error, setError] = useState('')

  function patchLocal(id: string, patch: Partial<Lead>) {
    setLeads((current) => current.map((lead) => lead.id === id ? { ...lead, ...patch } : lead))
  }

  async function save(lead: Lead) {
    setSavingId(lead.id)
    setError('')
    try {
      const response = await fetch(`/api/admin/business/pilot-leads/${lead.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: lead.status, objection: lead.objection, nextAction: lead.nextAction, pilotOutcome: lead.pilotOutcome, demoAt: lead.demoAt }),
      })
      if (!response.ok) throw new Error('Could not save this lead.')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not save this lead.')
    } finally {
      setSavingId(null)
    }
  }

  if (!leads.length) return <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-gray-500">No Pilot requests yet.</div>

  return (
    <div className="space-y-5">
      {error ? <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
      {leads.map((lead) => (
        <article key={lead.id} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-bold text-gray-950">{lead.businessName}</h2>
                <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">{statusLabel[lead.status] || lead.status}</span>
              </div>
              <p className="mt-1 text-sm text-gray-600">{lead.contactName} · <a className="text-blue-700 hover:underline" href={`mailto:${lead.email}`}>{lead.email}</a></p>
              <p className="mt-2 text-xs text-gray-500">{lead.businessType} · {lead.frameCountRange} frames · goal: {lead.goal} · {new Date(lead.createdAt).toLocaleString()}</p>
              <p className="mt-1 text-xs text-gray-500">Source: {lead.acquisitionSource || 'direct'} / {lead.acquisitionMedium || 'unknown'}{lead.campaignName ? ` · ${lead.campaignName}` : ''}{lead.trafficSource ? ` · first traffic: ${lead.trafficSource}` : ''}</p>
              {lead.websiteUrl ? <a className="mt-2 block text-sm text-blue-700 hover:underline" href={lead.websiteUrl} target="_blank" rel="noreferrer">{lead.websiteUrl}</a> : null}
              {lead.message ? <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-gray-700">{lead.message}</p> : null}
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Stage<select className="mt-2 block min-w-48 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-900" value={lead.status} onChange={(event) => patchLocal(lead.id, { status: event.target.value })}>{BUSINESS_PILOT_LEAD_STATUSES.map((status) => <option key={status} value={status}>{statusLabel[status]}</option>)}</select></label>
              <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Demo time<input type="datetime-local" className="mt-2 block min-w-48 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-900" value={lead.demoAt?.slice(0, 16) || ''} onChange={(event) => patchLocal(lead.id, { demoAt: event.target.value ? new Date(event.target.value).toISOString() : null })} /></label>
            </div>
          </div>
          <div className="mt-5 grid gap-4 border-t border-gray-100 pt-5 lg:grid-cols-3">
            <label className="text-sm font-semibold text-gray-700">Objection<textarea rows={3} className="mt-2 w-full rounded-lg border border-gray-300 p-3 text-sm font-normal" value={lead.objection || ''} onChange={(event) => patchLocal(lead.id, { objection: event.target.value || null })} /></label>
            <label className="text-sm font-semibold text-gray-700">Next action<textarea rows={3} className="mt-2 w-full rounded-lg border border-gray-300 p-3 text-sm font-normal" value={lead.nextAction || ''} onChange={(event) => patchLocal(lead.id, { nextAction: event.target.value || null })} /></label>
            <label className="text-sm font-semibold text-gray-700">Pilot outcome<textarea rows={3} className="mt-2 w-full rounded-lg border border-gray-300 p-3 text-sm font-normal" value={lead.pilotOutcome || ''} onChange={(event) => patchLocal(lead.id, { pilotOutcome: event.target.value || null })} /></label>
          </div>
          <button type="button" disabled={savingId === lead.id} onClick={() => save(lead)} className="mt-4 rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-700 disabled:opacity-60">{savingId === lead.id ? 'Saving…' : 'Save follow-up'}</button>
        </article>
      ))}
    </div>
  )
}
