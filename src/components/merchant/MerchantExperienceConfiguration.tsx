'use client'

import {
  DECISION_JOURNEY_STAGES,
  type DecisionJourneyPolicy,
  type DecisionJourneyStage,
} from '@/modules/store/domain/decision-journey'
import {
  DEFAULT_EXPERIENCE_DELIVERY_POLICY,
  MIN_KIOSK_IDLE_TIMEOUT_SECONDS,
  MAX_KIOSK_IDLE_TIMEOUT_SECONDS,
  type ExperienceDeliveryPolicy,
} from '@/modules/store/domain/delivery-profile'
import { PRESENTATION_MODES, type PresentationMode } from '@/modules/store/domain/presentation-mode'
import { MERCHANT_HANDOFF_ACTIONS, type MerchantHandoffAction } from '@/modules/store/domain/merchant-handoff'
import { applyMerchantDecisionJourneyCeiling } from '@/modules/store/domain/decision-journey'
import { useState } from 'react'

export type HandoffDraft = { action: MerchantHandoffAction | ''; label: string; url: string }
export type ExperienceConfigurationDraft = {
  journeyPolicy: DecisionJourneyPolicy
  deliveryPolicy: ExperienceDeliveryPolicy
  presentationMode: PresentationMode
  primaryHandoff: HandoffDraft
  secondaryHandoff: HandoffDraft
}

export const DEFAULT_EXPERIENCE_CONFIGURATION: ExperienceConfigurationDraft = {
  journeyPolicy: { enabledStages: [...DECISION_JOURNEY_STAGES] },
  deliveryPolicy: { ...DEFAULT_EXPERIENCE_DELIVERY_POLICY },
  presentationMode: 'PRODUCT_FIRST',
  primaryHandoff: { action: '', label: '', url: '' },
  secondaryHandoff: { action: '', label: '', url: '' },
}

const stageLabels: Record<DecisionJourneyStage, string> = {
  FACE_ANALYSIS: 'Face analysis',
  FIT_PROFILE: 'Fit profile',
  RECOMMENDATION: 'Recommendations',
  TRY_ON: 'Virtual Try-On',
  COMPARE: 'Compare frames',
}

const handoffLabels: Record<MerchantHandoffAction, string> = {
  VISIT_STORE: 'Visit store',
  BOOK_APPOINTMENT: 'Book appointment',
  WHATSAPP: 'WhatsApp',
  EMAIL: 'Email',
  PRODUCT: 'Product or collection',
  CUSTOM_LINK: 'Custom link',
}

function toggleStage(policy: DecisionJourneyPolicy, stage: DecisionJourneyStage): DecisionJourneyPolicy {
  const enabled = new Set(policy.enabledStages)
  if (stage === 'FACE_ANALYSIS' || stage === 'RECOMMENDATION') return policy
  if (enabled.has(stage)) {
    enabled.delete(stage)
    if (stage === 'TRY_ON') enabled.delete('COMPARE')
  } else {
    enabled.add(stage)
    if (stage === 'COMPARE') enabled.add('TRY_ON')
  }
  return { enabledStages: DECISION_JOURNEY_STAGES.filter((candidate) => enabled.has(candidate)) }
}

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return <label className="block text-sm font-medium text-slate-800">{label}{children}{hint ? <span className="mt-1 block text-xs font-normal leading-5 text-slate-500">{hint}</span> : null}</label>
}

function inputClass() {
  return 'mt-1.5 min-h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50'
}

export function MerchantExperienceConfiguration({
  value,
  onChange,
  capabilities,
  experienceType,
  disabled = false,
  active = false,
  dirty = false,
  onReset,
}: {
  value: ExperienceConfigurationDraft
  onChange: (value: ExperienceConfigurationDraft) => void
  capabilities: { tryOnEnabled: boolean; compareEnabled: boolean; kioskDeliveryEnabled?: boolean }
  experienceType: 'STORE' | 'CAMPAIGN'
  disabled?: boolean
  active?: boolean
  dirty?: boolean
  onReset?: () => void
}) {
  const [flowPreviewOpen, setFlowPreviewOpen] = useState(false)
  const effective = applyMerchantDecisionJourneyCeiling(value.journeyPolicy, capabilities)
  const effectiveStages = DECISION_JOURNEY_STAGES.filter((stage) => effective.enabledStages.includes(stage))
  const kioskAvailable = capabilities.kioskDeliveryEnabled ?? true

  function updateHandoff(which: 'primaryHandoff' | 'secondaryHandoff', patch: Partial<HandoffDraft>) {
    // Selecting "No action" clears stale label/URL as one atomic draft change.
    onChange({
      ...value,
      [which]: patch.action === ''
        ? { action: '', label: '', url: '' }
        : { ...value[which], ...patch },
    })
  }

  return <div className="space-y-4" data-testid="merchant-experience-configuration">
    {active && dirty ? <p role="status" className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-950">Saving these settings will update the live {experienceType === 'STORE' ? 'Store' : 'Campaign'} immediately.</p> : null}
    <div className="flex flex-wrap items-center justify-between gap-2">
      <button type="button" aria-expanded={flowPreviewOpen} onClick={() => setFlowPreviewOpen((open) => !open)} className="inline-flex min-h-10 items-center rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-800 hover:bg-blue-100">
        {flowPreviewOpen ? 'Hide shopper flow preview' : 'Preview shopper flow'}
      </button>
      {dirty && onReset ? <button type="button" disabled={disabled} onClick={onReset} className="min-h-10 rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 underline underline-offset-2 hover:text-slate-950 disabled:opacity-50">Revert to saved settings</button> : null}
    </div>
    {flowPreviewOpen ? <section aria-label="Shopper flow preview" className="rounded-xl border border-blue-200 bg-blue-50/60 p-4" data-testid="shopper-flow-preview">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div><h3 className="text-sm font-semibold text-slate-950">Shopper flow preview</h3><p className="mt-1 text-xs leading-5 text-slate-600">This preview reflects the current form and is not saved or published.</p></div>
        <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-blue-800">{active ? 'Live after confirmation' : 'Private until saved'}</span>
      </div>
      <ol className="mt-3 flex flex-wrap gap-2" aria-label="Effective shopper steps">
        {effectiveStages.map((stage, index) => <li key={stage} className="inline-flex items-center gap-2 rounded-lg border border-blue-100 bg-white px-3 py-2 text-xs font-semibold text-slate-800"><span className="grid h-5 w-5 place-items-center rounded-full bg-blue-100 text-blue-800">{index + 1}</span>{stageLabels[stage]}</li>)}
      </ol>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg bg-white p-3"><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Result includes</p><p className="mt-1.5 text-sm text-slate-800">Recommendations{effective.enabledStages.includes('FIT_PROFILE') ? ' · Fit profile' : ''}{effective.enabledStages.includes('TRY_ON') ? ' · Try-On' : ''}{effective.enabledStages.includes('COMPARE') ? ' · Compare' : ''}</p></div>
        <div className="rounded-lg bg-white p-3"><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Delivery and handoff</p><p className="mt-1.5 text-sm text-slate-800">{value.deliveryPolicy.kioskEnabled && kioskAvailable ? 'Web + Kiosk' : 'Web'} · {value.presentationMode.replace(/_/g, ' ').toLowerCase()}{value.primaryHandoff.action && value.primaryHandoff.label.trim() ? ` · ${value.primaryHandoff.label.trim()}` : ''}</p></div>
      </div>
    </section> : null}
    <fieldset disabled={disabled} className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
      <legend className="px-1 text-sm font-semibold text-slate-950">Shopper journey</legend>
      <p className="mt-1 text-xs leading-5 text-slate-600">Choose from the supported steps. Face analysis and recommendations are always included; Compare requires Try-On.</p>
      <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {DECISION_JOURNEY_STAGES.map((stage) => {
          const required = stage === 'FACE_ANALYSIS' || stage === 'RECOMMENDATION'
          const selected = value.journeyPolicy.enabledStages.includes(stage)
          const entitled = effective.enabledStages.includes(stage)
          return <label key={stage} className={`flex min-h-11 items-center gap-2 rounded-lg border px-3 py-2 text-sm ${selected ? 'border-blue-200 bg-blue-50/50 text-slate-900' : 'border-slate-200 text-slate-500'}`}>
            <input
              type="checkbox"
              checked={selected}
              disabled={disabled || required}
              onChange={() => onChange({ ...value, journeyPolicy: toggleStage(value.journeyPolicy, stage) })}
              aria-label={`${stageLabels[stage]}${required ? ' (required)' : ''}`}
            />
            <span className="min-w-0 flex-1">{stageLabels[stage]}</span>
            {required ? <span className="text-[10px] font-semibold uppercase tracking-wide text-blue-700">Required</span>
              : selected && !entitled ? <span className="text-[10px] font-semibold text-amber-800">Plan limited</span> : null}
          </label>
        })}
      </div>
      <p className="mt-3 text-xs leading-5 text-slate-500">Selected steps describe this Experience. Your current plan and usage remain the final limit for Try-On and Compare.</p>
    </fieldset>

    <fieldset disabled={disabled} className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
      <legend className="px-1 text-sm font-semibold text-slate-950">Presentation and delivery</legend>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Page emphasis">
          <select value={value.presentationMode} onChange={(event) => onChange({ ...value, presentationMode: event.target.value as PresentationMode })} className={inputClass()}>
            {PRESENTATION_MODES.map((mode) => <option key={mode} value={mode}>{mode === 'EDITORIAL_FIRST' ? 'Story first' : mode === 'PRODUCT_FIRST' ? 'Products first' : 'Action first'}</option>)}
          </select>
        </Field>
        <label className={`flex min-h-10 items-center gap-3 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-800 sm:mt-6 ${!kioskAvailable ? 'bg-slate-50' : ''}`}>
          <input type="checkbox" checked={value.deliveryPolicy.kioskEnabled} disabled={!kioskAvailable} onChange={(event) => onChange({ ...value, deliveryPolicy: { ...value.deliveryPolicy, kioskEnabled: event.target.checked } })} />
          <span>Enable shared-device Kiosk route{!kioskAvailable ? <span className="ml-2 text-xs font-semibold text-amber-800">Not included in current plan</span> : null}</span>
        </label>
        <Field label="Kiosk idle reset" hint="This only applies to the Kiosk route. Web behavior and the phone Result link remain unchanged.">
          <select value={value.deliveryPolicy.kioskIdleTimeoutSeconds} disabled={!value.deliveryPolicy.kioskEnabled || !kioskAvailable} onChange={(event) => onChange({ ...value, deliveryPolicy: { ...value.deliveryPolicy, kioskIdleTimeoutSeconds: Number(event.target.value) } })} className={inputClass()}>
            {[30, 60, 120, 180, 300, 600, 900].filter((seconds) => seconds >= MIN_KIOSK_IDLE_TIMEOUT_SECONDS && seconds <= MAX_KIOSK_IDLE_TIMEOUT_SECONDS).map((seconds) => <option key={seconds} value={seconds}>{seconds < 60 ? `${seconds} seconds` : `${seconds / 60} minutes`}</option>)}
          </select>
        </Field>
        <p className="self-end text-xs leading-5 text-slate-500">Kiosk availability is also subject to the current plan. Saving does not publish a Draft {experienceType === 'STORE' ? 'Store' : 'Campaign'}.</p>
      </div>
    </fieldset>

    <fieldset disabled={disabled} className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
      <legend className="px-1 text-sm font-semibold text-slate-950">Shopper handoff</legend>
      <p className="mt-1 text-xs leading-5 text-slate-600">Optional actions shown on the shopper-facing Experience or Result when the configured destination is valid.</p>
      {(['primaryHandoff', 'secondaryHandoff'] as const).map((key, index) => <div key={key} className={`${index ? 'mt-4 border-t border-slate-100 pt-4' : 'mt-3'} grid gap-3 sm:grid-cols-3`}>
        <Field label={index ? 'Secondary action' : 'Primary action'}>
          <select value={value[key].action} onChange={(event) => updateHandoff(key, { action: event.target.value as HandoffDraft['action'] })} className={inputClass()}>
            <option value="">No action</option>
            {MERCHANT_HANDOFF_ACTIONS.map((action) => <option key={action} value={action}>{handoffLabels[action]}</option>)}
          </select>
        </Field>
        <Field label="Button label"><input value={value[key].label} maxLength={120} disabled={!value[key].action} onChange={(event) => updateHandoff(key, { label: event.target.value })} className={inputClass()} placeholder="e.g. Visit our store" /></Field>
        <Field label="Destination" hint="Use an https URL or an internal path."><input value={value[key].url} maxLength={2000} disabled={!value[key].action} onChange={(event) => updateHandoff(key, { url: event.target.value })} className={inputClass()} placeholder="https://… or /…" /></Field>
      </div>)}
    </fieldset>
  </div>
}
