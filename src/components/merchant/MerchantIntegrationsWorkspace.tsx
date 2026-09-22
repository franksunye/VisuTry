'use client'

import { useEffect, useRef, useState } from 'react'
import { Copy, ExternalLink, KeyRound, RefreshCw, ShieldCheck } from 'lucide-react'
import type { MerchantAgentCredentialMetadata } from '@/modules/merchant/application/merchant-agent-credentials'
import type { MerchantAgentScope } from '@/modules/merchant/domain/agent-credentials'
import { resolveMerchantAgentIntegrationStatus } from '@/modules/merchant/domain/merchant-integration-presentation'

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

function OneTimeSetupDialog({
  text,
  onClose,
}: {
  text: string
  onClose: () => void
}) {
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

  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-3 sm:p-6" role="dialog" aria-modal="true" aria-labelledby="agent-key-once-heading">
    <section className="max-h-[92dvh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-4 shadow-2xl sm:p-6">
      <p className="text-xs font-bold uppercase tracking-[0.15em] text-amber-700">Shown once</p>
      <h2 id="agent-key-once-heading" className="mt-1 text-xl font-semibold text-slate-950">Copy your Agent setup prompt</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">This prompt contains the new key. VisuTry will not show it again after you close this window. Store it only in your trusted Agent configuration.</p>
      <pre className="mt-4 max-h-72 overflow-auto whitespace-pre-wrap break-words rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-slate-800">{text}</pre>
      <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p role="status" className={`text-xs font-medium ${copied ? 'text-emerald-700' : 'text-amber-800'}`}>{copied ? 'Setup prompt copied.' : 'Copy it before closing.'}</p>
        <div className="flex flex-col-reverse gap-2 sm:flex-row">
          <button ref={closeRef} type="button" onClick={onClose} className={`${buttonClass} border border-slate-300 bg-white text-slate-700 hover:bg-slate-50`}>Close and hide key</button>
          <button type="button" onClick={() => { void writeClipboard(text).then(setCopied) }} className={`${buttonClass} bg-slate-950 text-white hover:bg-slate-800`}><Copy className="h-4 w-4" aria-hidden="true" />Copy setup prompt</button>
        </div>
      </div>
    </section>
  </div>
}

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
  const [oneTimeSetup, setOneTimeSetup] = useState<string | null>(null)
  const skill = skills[0]
  const status = resolveMerchantAgentIntegrationStatus(credentials)

  async function refreshCredentials() {
    const response = await fetch(`/api/merchant/${encodeURIComponent(merchantId)}/agent-credentials`, { cache: 'no-store' })
    const body = await response.json() as ApiEnvelope<{ credentials: CredentialView[] }>
    if (!response.ok || !body.data) throw new Error(errorMessage(body.error, 'Unable to refresh Agent keys.'))
    setCredentials(body.data.credentials)
    return body.data.credentials
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

  const statusLabel = status.kind === 'NOT_CONFIGURED' ? 'Not configured' : status.kind === 'READY_TO_CONNECT' ? 'Ready to connect' : 'Agent use verified'
  const latestUseLabel = formatDate(status.latestActiveUseAt, locale)

  return <div data-testid="merchant-integrations-workspace" className="space-y-5">
    <header className="flex flex-col gap-4 border-b border-slate-200 pb-4 sm:flex-row sm:items-end sm:justify-between">
      <div><p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Merchant workspace</p><h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">Integrations</h1><p className="mt-1.5 max-w-2xl text-sm leading-6 text-slate-600">Manage the optional VisuTry Agent / MCP connection for this workspace.</p></div>
      <button type="button" onClick={() => void createKey()} disabled={busy} className={`${buttonClass} shrink-0 bg-slate-950 text-white hover:bg-slate-800`}><KeyRound className="h-4 w-4" aria-hidden="true" />{status.activeCredentialCount ? 'Create another key' : 'Create Agent key'}</button>
    </header>

    <section className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
      <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex items-start gap-3"><span className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${status.kind === 'USED' ? 'bg-emerald-50 text-emerald-700' : status.kind === 'READY_TO_CONNECT' ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-600'}`}><ShieldCheck className="h-5 w-5" aria-hidden="true" /></span><div><h2 className="text-base font-semibold text-slate-950">VisuTry Agent / MCP</h2><p className="mt-1 text-sm font-semibold text-slate-800">{statusLabel}</p>
          {status.kind === 'NOT_CONFIGURED' ? <p className="mt-1 text-sm leading-5 text-slate-600">No active key exists. Create one only if you want an Agent to access this Merchant workspace.</p> : null}
          {status.kind === 'READY_TO_CONNECT' ? <p className="mt-1 text-sm leading-5 text-slate-600">An active key exists, but VisuTry has not yet recorded successful use. Creating a key alone does not connect an Agent.</p> : null}
          {status.kind === 'USED' ? <p className="mt-1 text-sm leading-5 text-slate-600">At least one active key has been used successfully{latestUseLabel ? ` · last used ${latestUseLabel}` : ''}. This records use, not a continuous connection.</p> : null}
          <p className="mt-2 text-xs text-slate-500">{status.activeCredentialCount} active · {status.revokedCredentialCount} revoked</p>
        </div></div>
      </article>

      <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <h2 className="text-sm font-semibold text-slate-950">Setup</h2>
        <ol className="mt-3 grid gap-3 sm:grid-cols-3">
          <li className="flex gap-2.5"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-950 text-xs font-semibold text-white">1</span><span className="text-sm leading-5 text-slate-700">Create a key and copy the one-time setup prompt.</span></li>
          <li className="flex gap-2.5"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-700">2</span><span className="text-sm leading-5 text-slate-700">Paste the prompt into your chosen Agent.</span></li>
          <li className="flex gap-2.5"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-700">3</span><span className="text-sm leading-5 text-slate-700">Return here and refresh to verify recorded use.</span></li>
        </ol>
        <div className="mt-4 flex flex-col gap-2 border-t border-slate-100 pt-3 text-xs sm:flex-row sm:items-center sm:justify-between">
          <a href={skill?.url ?? '#'} className="inline-flex min-w-0 items-center gap-1.5 font-semibold text-blue-700 hover:text-blue-900"><ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden="true" /><span>{skill?.name ?? 'Merchant Skill'}</span></a>
          <code className="break-all text-slate-600">MCP · {endpoint}</code>
          <button type="button" disabled={busy} onClick={() => { void refreshCredentials().then(() => { setError(null); setNotice('Key usage status refreshed.') }).catch((caught: unknown) => setError(caught instanceof Error ? caught.message : 'Unable to refresh key status.')) }} className="inline-flex min-h-9 shrink-0 items-center justify-center gap-1.5 rounded-lg border border-slate-300 px-2.5 font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"><RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />Refresh status</button>
        </div>
      </article>
    </section>

    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm" aria-labelledby="agent-keys-heading">
      <div className="flex flex-wrap items-end justify-between gap-2 border-b border-slate-200 px-4 py-3 sm:px-5"><div><h2 id="agent-keys-heading" className="text-sm font-semibold text-slate-950">Agent keys</h2><p className="mt-0.5 text-xs text-slate-500">Secrets are shown only when a key is created or rotated.</p></div><span className="text-xs text-slate-500">{credentials.length} total</span></div>
      {credentials.length === 0 ? <p className="px-4 py-7 text-sm text-slate-600 sm:px-5">No keys have been created for this workspace.</p> : <ul className="divide-y divide-slate-100">
        {credentials.map((credential) => {
          const lastUsed = formatDate(credential.lastUsedAt, locale)
          const revokedAt = formatDate(credential.revokedAt, locale)
          return <li key={credential.id} className="flex flex-col gap-3 px-4 py-4 sm:px-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2"><h3 className="text-sm font-semibold text-slate-950">{credential.name}</h3><span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${credential.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>{credential.status === 'ACTIVE' ? 'Active' : 'Revoked'}</span></div>
              <p className="mt-1 font-mono text-xs text-slate-500">{credential.masked}</p>
              <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500"><span>Created {formatDate(credential.createdAt, locale)}</span>{lastUsed ? <span>Last used {lastUsed}</span> : credential.status === 'ACTIVE' ? <span>Not used yet</span> : null}{revokedAt ? <span>Revoked {revokedAt}</span> : null}</div>
              <details className="mt-2"><summary className="w-fit cursor-pointer text-xs font-semibold text-slate-600 underline decoration-slate-300 underline-offset-2">Access scopes ({credential.scopes.length})</summary><ul className="mt-2 flex flex-wrap gap-1.5">{credential.scopes.map((scope: MerchantAgentScope) => <li key={scope} className="rounded-md bg-slate-100 px-2 py-1 font-mono text-[11px] text-slate-700">{scope}</li>)}</ul></details>
            </div>
            {credential.status === 'ACTIVE' ? <div className="flex shrink-0 flex-wrap gap-2"><button type="button" disabled={busy} aria-label={`Rotate ${credential.name}`} onClick={() => void rotateKey(credential)} className={`${buttonClass} border border-slate-300 bg-white text-slate-700 hover:bg-slate-50`}><RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />Rotate</button><button type="button" disabled={busy} aria-label={`Revoke ${credential.name}`} onClick={() => void revokeKey(credential)} className={`${buttonClass} border border-rose-200 bg-white text-rose-700 hover:bg-rose-50`}><span aria-hidden="true">×</span>Revoke</button></div> : null}
          </li>
        })}
      </ul>}
    </section>

    {error ? <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</p> : null}
    {notice ? <p role="status" className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">{notice}</p> : null}
    {oneTimeSetup ? <OneTimeSetupDialog text={oneTimeSetup} onClose={() => setOneTimeSetup(null)} /> : null}
  </div>
}
