'use client'

import { useEffect, useRef, useState } from 'react'
import { Check, Copy, ExternalLink, KeyRound, Plug, RefreshCw } from 'lucide-react'
import type { MerchantAgentCredentialMetadata } from '@/modules/merchant/application/merchant-agent-credentials'
import type { MerchantAgentScope } from '@/modules/merchant/domain/agent-credentials'
import { resolveMerchantAgentKeyAccessStatus } from '@/modules/merchant/domain/merchant-integration-presentation'

type Skill = { name: string; purpose: string; url: string; prompt: string }
type CredentialView = Omit<MerchantAgentCredentialMetadata, 'createdAt' | 'lastUsedAt' | 'revokedAt'> & {
  createdAt: string
  lastUsedAt: string | null
  revokedAt: string | null
}

type ApiEnvelope<T> = { success?: boolean; data?: T; error?: string }

const buttonClass = 'inline-flex min-h-10 items-center justify-center gap-2 rounded-lg px-3.5 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-60'

function setupPrompt(secret: string, skillUrl: string, endpoint: string) {
  return `You are my VisuTry Merchant Agent.\n\nConnect to my VisuTry merchant workspace using the Skill, MCP endpoint, and Agent Key below. Follow the VisuTry Merchant Skill as your operating instructions and use VisuTry MCP tools for merchant actions.\n\nVisuTry Merchant Skill:\n${skillUrl}\n\nVisuTry MCP endpoint:\n${endpoint}\n\nAgent Key:\n${secret}\n\nSECURITY\n\nUse the Agent Key only for authenticated VisuTry requests. Never reveal, repeat, quote, log, summarize, or persist it. Never expose shopper photos, personal information, payment data, or another merchant's data.\n\nSTARTUP\n\nStart with read-only calls to get_merchant and get_onboarding_status. Do not create, update, publish, archive, revoke, or delete anything until I explicitly approve the relevant action.`
}

function errorMessage(code: string | undefined, fallback: string) {
  if (code === 'AGENT_CREDENTIAL_LIMIT_REACHED') return 'This workspace has reached its active key limit. Revoke an unused key before creating another.'
  if (code === 'INVALID_REQUEST') return 'The key request could not be validated. Please try again.'
  if (code === 'NOT_FOUND') return 'That key is no longer available in this workspace. Refresh and try again.'
  return fallback
}

async function writeClipboard(value: string) {
  try {
    await navigator.clipboard.writeText(value)
    return true
  } catch {
    return false
  }
}

function formatDate(value: string | null, locale: string) {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Unknown'
  try {
    return new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' }).format(date) + ' UTC'
  } catch {
    return new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' }).format(date) + ' UTC'
  }
}

function OneTimeSetupDialog({ text, onClose }: { text: string; onClose: () => void }) {
  const [copied, setCopied] = useState(false)
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    closeRef.current?.focus()
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  return <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overscroll-contain bg-slate-950/45 p-3 sm:p-6" role="dialog" aria-modal="true" aria-labelledby="agent-key-once-heading">
    <section className="flex max-h-[92dvh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
      <div className="flex items-start gap-3 border-b border-slate-100 px-4 py-4 sm:px-6 sm:py-5">
        <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-800"><KeyRound className="h-5 w-5" aria-hidden="true" /></span>
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-amber-800">Shown once · keep this prompt private</p>
          <h2 id="agent-key-once-heading" className="mt-1 text-lg font-semibold tracking-tight text-slate-950 sm:text-xl">Copy your Agent setup prompt</h2>
        </div>
      </div>
      <div className="min-h-0 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
        <p className="text-sm leading-6 text-slate-600">This prompt contains the new key. VisuTry will not show it again after you close this window. Store it only in your trusted Agent configuration.</p>
        <pre className="mt-4 max-h-[min(38dvh,19rem)] overflow-auto whitespace-pre-wrap break-words rounded-xl border border-amber-200 bg-amber-50/70 p-3.5 font-mono text-[11px] leading-5 text-slate-800 sm:p-4 sm:text-xs">{text}</pre>
      </div>
      <div className="flex flex-col-reverse gap-3 border-t border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p role="status" className={`text-xs font-medium ${copied ? 'text-emerald-700' : 'text-slate-500'}`}>{copied ? 'Setup prompt copied.' : 'Copy it before closing.'}</p>
        <div className="flex flex-col-reverse gap-2 sm:flex-row">
          <button ref={closeRef} type="button" onClick={onClose} className={`${buttonClass} border border-slate-300 bg-white text-slate-700 hover:bg-slate-50`}>Close and hide key</button>
          <button type="button" onClick={() => { void writeClipboard(text).then(setCopied) }} className={`${buttonClass} bg-slate-950 text-white hover:bg-slate-800`}><Copy className="h-4 w-4" aria-hidden="true" />Copy setup prompt</button>
        </div>
      </div>
    </section>
  </div>
}

const setupSteps = [
  { title: 'Create an Agent key', description: 'Generate a key and copy the one-time setup prompt.', icon: KeyRound },
  { title: 'Add it to your Agent', description: 'Paste the prompt into your chosen Agent.', icon: Copy },
  { title: 'Verify recorded use', description: 'Return here and refresh to check for successful use.', icon: RefreshCw },
]

export function MerchantIntegrationsWorkspace({
  locale,
  merchantId,
  endpoint,
  skills,
  initialCredentials,
}: {
  locale: string
  merchantId: string
  endpoint: string
  skills: Skill[]
  initialCredentials: CredentialView[]
}) {
  const [credentials, setCredentials] = useState(initialCredentials)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [endpointCopied, setEndpointCopied] = useState(false)
  const [oneTimeSetup, setOneTimeSetup] = useState<string | null>(null)
  const skill = skills[0]
  const status = resolveMerchantAgentKeyAccessStatus(credentials)

  async function refreshCredentials() {
    const response = await fetch(`/api/merchant/${encodeURIComponent(merchantId)}/agent-credentials`, { cache: 'no-store' })
    const body = await response.json() as ApiEnvelope<{ credentials: CredentialView[] }>
    if (!response.ok || !body.data) throw new Error(errorMessage(body.error, 'Unable to refresh Agent keys.'))
    setCredentials(body.data.credentials)
    return body.data.credentials
  }

  async function refreshStatus() {
    setError(null)
    setNotice(null)
    try {
      await refreshCredentials()
      setNotice('Key usage status refreshed.')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to refresh key status.')
    }
  }

  async function createKey() {
    if (busy) return
    setBusy(true)
    setError(null)
    setNotice(null)
    try {
      const response = await fetch(`/api/merchant/${encodeURIComponent(merchantId)}/agent-credentials`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name: 'VisuTry Agent' }),
      })
      const body = await response.json() as ApiEnvelope<{ credential: CredentialView; secret: string }>
      if (!response.ok || !body.data?.secret) throw new Error(errorMessage(body.error, 'Unable to create an Agent key.'))
      setOneTimeSetup(setupPrompt(body.data.secret, skill?.url ?? '', endpoint))
      try {
        await refreshCredentials()
      } catch {
        setNotice('The key was created. The key list could not refresh; close this message and refresh the page to verify its status.')
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to create an Agent key.')
    } finally {
      setBusy(false)
    }
  }

  async function rotateKey(credential: CredentialView) {
    if (busy || !window.confirm(`Rotating “${credential.name}” immediately disables the current key. Continue?`)) return
    setBusy(true)
    setError(null)
    setNotice(null)
    try {
      const response = await fetch(`/api/merchant/${encodeURIComponent(merchantId)}/agent-credentials/${encodeURIComponent(credential.id)}/rotate`, { method: 'POST' })
      const body = await response.json() as ApiEnvelope<{ credential: CredentialView; secret: string }>
      if (!response.ok || !body.data?.secret) throw new Error(errorMessage(body.error, 'Unable to rotate this Agent key.'))
      setOneTimeSetup(setupPrompt(body.data.secret, skill?.url ?? '', endpoint))
      await refreshCredentials()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to rotate this Agent key.')
    } finally {
      setBusy(false)
    }
  }

  async function revokeKey(credential: CredentialView) {
    if (busy || !window.confirm(`“${credential.name}” will stop working immediately. Revoke this key?`)) return
    setBusy(true)
    setError(null)
    setNotice(null)
    try {
      const response = await fetch(`/api/merchant/${encodeURIComponent(merchantId)}/agent-credentials/${encodeURIComponent(credential.id)}/revoke`, { method: 'POST' })
      const body = await response.json() as ApiEnvelope<{ credential: CredentialView }>
      if (!response.ok || !body.data?.credential) throw new Error(errorMessage(body.error, 'Unable to revoke this Agent key.'))
      await refreshCredentials()
      setNotice(`“${credential.name}” was revoked.`)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to revoke this Agent key.')
    } finally {
      setBusy(false)
    }
  }

  const statusLabel = status.kind === 'NOT_CONFIGURED' ? 'No active key' : status.kind === 'READY_TO_CONNECT' ? 'Key created · not yet used' : 'Successful key use recorded'
  const latestUseLabel = formatDate(status.latestActiveUseAt, locale)
  const statusTone = status.kind === 'USED'
    ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
    : status.kind === 'READY_TO_CONNECT'
      ? 'border-blue-200 bg-blue-50 text-blue-800'
      : 'border-slate-200 bg-slate-50 text-slate-700'

  return <div data-testid="merchant-integrations-workspace" className="space-y-5">
    <header className="flex flex-col gap-4 border-b border-slate-200 pb-4 sm:flex-row sm:items-end sm:justify-between">
      <div><p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Merchant workspace</p><h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">Integrations</h1><p className="mt-1.5 max-w-2xl text-sm leading-6 text-slate-600">Manage Agent keys for optional key-based access to this workspace.</p></div>
      <button type="button" onClick={() => void createKey()} disabled={busy} className={`${buttonClass} shrink-0 bg-slate-950 text-white hover:bg-slate-800`}><KeyRound className="h-4 w-4" aria-hidden="true" />{status.activeCredentialCount ? 'Create another key' : 'Create Agent key'}</button>
    </header>

    <section aria-labelledby="agent-integration-heading" className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="grid lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
        <div className="p-5 sm:p-7">
          <div className="flex items-start gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-700 ring-1 ring-blue-100"><Plug className="h-6 w-6" strokeWidth={1.8} aria-hidden="true" /></span>
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-blue-700">VisuTry Agent · MCP</p>
              <h2 id="agent-integration-heading" className="mt-1 text-lg font-semibold tracking-tight text-slate-950 sm:text-xl">Workspace integration</h2>
              <p className="mt-1.5 max-w-lg text-sm leading-6 text-slate-600">Use an Agent key for optional key-based access to this Merchant workspace.</p>
            </div>
          </div>

          <div className="mt-6 border-t border-slate-100 pt-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.13em] text-slate-500">Agent key access</p>
            <div className="mt-2 flex flex-wrap items-center gap-2.5">
              <span aria-hidden="true" className={`h-2 w-2 rounded-full ${status.kind === 'USED' ? 'bg-emerald-600' : status.kind === 'READY_TO_CONNECT' ? 'bg-blue-600' : 'bg-slate-400'}`} />
              <span className={`inline-flex min-h-8 items-center rounded-full border px-3 text-sm font-semibold ${statusTone}`}>{statusLabel}</span>
            </div>
            {status.kind === 'NOT_CONFIGURED' ? <p className="mt-2 max-w-xl text-sm leading-5 text-slate-600">No active Agent key exists. Create one only if you want to use key-based access.</p> : null}
            {status.kind === 'READY_TO_CONNECT' ? <p className="mt-2 max-w-xl text-sm leading-5 text-slate-600">An active key exists, but it has no recorded successful use yet. Key creation alone does not prove use.</p> : null}
            {status.kind === 'USED' ? <p className="mt-2 max-w-xl text-sm leading-5 text-slate-600">A successful use is recorded{latestUseLabel ? ` · last used ${latestUseLabel}` : ''}. This confirms key use, not a continuous connection.</p> : null}
            <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
              <span><strong className="font-semibold text-slate-700">{status.activeCredentialCount}</strong> active</span>
              <span aria-hidden="true" className="h-1 w-1 rounded-full bg-slate-300" />
              <span><strong className="font-semibold text-slate-700">{status.revokedCredentialCount}</strong> revoked</span>
            </div>
            <p className="mt-3 text-xs leading-5 text-slate-500">This reflects Agent key access only. OAuth MCP authorization is separate.</p>
          </div>
        </div>

        <div className="border-t border-slate-200 bg-slate-50/70 p-5 sm:p-7 lg:border-l lg:border-t-0">
          <div className="flex items-center justify-between gap-3">
            <div><p className="text-[11px] font-bold uppercase tracking-[0.15em] text-slate-500">Setup</p><h3 className="mt-1 text-base font-semibold tracking-tight text-slate-950">Get started in three steps</h3></div>
            <span className="hidden rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-500 sm:inline-flex">Key-based access</span>
          </div>
          <ol className="mt-5 space-y-4">
            {setupSteps.map(({ title, description, icon: Icon }, index) => <li key={title} className="flex items-start gap-3">
              <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${index === 0 ? 'bg-slate-950 text-white' : 'bg-white text-slate-500 ring-1 ring-slate-200'}`} aria-hidden="true"><Icon className="h-4 w-4" strokeWidth={1.8} /></span>
              <div className="min-w-0 pt-0.5"><p className="text-sm font-semibold text-slate-800">{title}</p><p className="mt-0.5 text-sm leading-5 text-slate-600">{description}</p></div>
            </li>)}
          </ol>
        </div>
      </div>
    </section>

    <section aria-label="Integration configuration" className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:px-5 sm:py-4">
      <div className="grid gap-4 sm:grid-cols-[minmax(0,0.72fr)_minmax(0,1.28fr)] sm:items-center lg:grid-cols-[minmax(0,0.78fr)_minmax(0,1.4fr)_auto]">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.13em] text-slate-500">Merchant Skill</p>
          <a href={skill?.url ?? '#'} className="mt-1 inline-flex max-w-full items-center gap-1.5 text-sm font-semibold text-blue-700 hover:text-blue-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2">
            <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden="true" /><span className="truncate">{skill?.name ?? 'VisuTry Merchant'}</span>
          </a>
        </div>
        <div className="min-w-0 border-t border-slate-100 pt-3 sm:border-l sm:border-t-0 sm:pl-4 sm:pt-0 lg:border-l-0 lg:pl-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.13em] text-slate-500">MCP endpoint</p>
          <div className="mt-1 flex min-w-0 items-center gap-2">
            <code className="min-w-0 flex-1 break-all font-mono text-xs leading-5 text-slate-700">{endpoint}</code>
            <button type="button" aria-label={endpointCopied ? 'MCP endpoint copied' : 'Copy MCP endpoint'} onClick={() => { void writeClipboard(endpoint).then(setEndpointCopied) }} className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2" title="Copy MCP endpoint"><Copy className="h-4 w-4" aria-hidden="true" /></button>
          </div>
          <span className="sr-only" aria-live="polite">{endpointCopied ? 'MCP endpoint copied.' : ''}</span>
        </div>
        <div className="border-t border-slate-100 pt-3 sm:col-span-2 lg:col-span-1 lg:border-l lg:border-t-0 lg:pl-4 lg:pt-0">
          <button type="button" disabled={busy} onClick={() => { void refreshStatus() }} className={`${buttonClass} w-full border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 lg:w-auto`}><RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />Refresh status</button>
        </div>
      </div>
    </section>

    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm" aria-labelledby="agent-keys-heading">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-slate-200 px-4 py-4 sm:px-5">
        <div><p className="text-[11px] font-semibold uppercase tracking-[0.13em] text-slate-500">Secure resources</p><h2 id="agent-keys-heading" className="mt-0.5 text-base font-semibold tracking-tight text-slate-950">Agent keys</h2><p className="mt-1 text-xs leading-5 text-slate-500">A secret appears only when its key is created or rotated.</p></div>
        <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">{credentials.length} {credentials.length === 1 ? 'key' : 'keys'}</span>
      </div>
      {credentials.length === 0 ? <div className="flex min-h-32 items-center gap-4 px-5 py-6 sm:min-h-36 sm:justify-center sm:px-8">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-500 ring-1 ring-slate-200"><KeyRound className="h-5 w-5" aria-hidden="true" /></span>
        <div className="min-w-0"><p className="text-sm font-semibold text-slate-800">No keys have been created for this workspace.</p><p className="mt-1 text-sm leading-5 text-slate-500">Create one from the page header when you are ready.</p></div>
      </div> : <ul className="divide-y divide-slate-100">
        {credentials.map((credential) => {
          const lastUsed = formatDate(credential.lastUsedAt, locale)
          const revokedAt = formatDate(credential.revokedAt, locale)
          const revoked = credential.status !== 'ACTIVE'
          return <li key={credential.id} className={`px-4 py-4 transition-colors sm:px-5 ${revoked ? 'bg-slate-50/70' : 'bg-white'}`}>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h3 className={`text-sm font-semibold ${revoked ? 'text-slate-600' : 'text-slate-950'}`}>{credential.name}</h3>
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${revoked ? 'bg-slate-200/70 text-slate-600' : 'bg-blue-50 text-blue-800'}`}>{revoked ? 'Revoked' : 'Active'}</span>
                </div>
                <p className={`mt-1 font-mono text-xs ${revoked ? 'text-slate-400' : 'text-slate-500'}`}>{credential.masked}</p>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                  <span>Created {formatDate(credential.createdAt, locale)}</span>
                  {lastUsed ? <span>Last used {lastUsed}</span> : credential.status === 'ACTIVE' ? <span>Not used yet</span> : null}
                  {revokedAt ? <span>Revoked {revokedAt}</span> : null}
                </div>
                <details className="mt-2.5">
                  <summary className="w-fit cursor-pointer text-xs font-semibold text-slate-600 underline decoration-slate-300 underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">Access scopes ({credential.scopes.length})</summary>
                  <ul className="mt-2 flex flex-wrap gap-1.5">{credential.scopes.map((scope: MerchantAgentScope) => <li key={scope} className="rounded-md bg-slate-100 px-2 py-1 font-mono text-[11px] text-slate-700">{scope}</li>)}</ul>
                </details>
              </div>
              {credential.status === 'ACTIVE' ? <div className="flex shrink-0 gap-2 border-t border-slate-100 pt-3 lg:border-t-0 lg:pt-0">
                <button type="button" disabled={busy} aria-label={`Rotate ${credential.name}`} onClick={() => void rotateKey(credential)} className={`${buttonClass} flex-1 border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 lg:flex-none`}><RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />Rotate</button>
                <button type="button" disabled={busy} aria-label={`Revoke ${credential.name}`} onClick={() => void revokeKey(credential)} className={`${buttonClass} flex-1 border border-slate-300 bg-white text-slate-600 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700 lg:flex-none`}><span aria-hidden="true">×</span>Revoke</button>
              </div> : <span className="sr-only">No actions available for revoked key.</span>}
            </div>
          </li>
        })}
      </ul>}
    </section>

    {error ? <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</p> : null}
    {notice ? <p role="status" className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900"><Check className="mr-1.5 inline h-4 w-4" aria-hidden="true" />{notice}</p> : null}
    {oneTimeSetup ? <OneTimeSetupDialog text={oneTimeSetup} onClose={() => setOneTimeSetup(null)} /> : null}
  </div>
}
