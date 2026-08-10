'use client'

import {
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { Check, Loader2, X } from 'lucide-react'
import { useParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { analytics, getAcquisitionContext } from '@/lib/analytics'
import { localizedPath } from '@/lib/localized-path'
import { PRICE_CONFIG, QUOTA_CONFIG } from '@/config/pricing'
import { TOP_PICK_GLASSES_PRESETS } from '@/config/glasses-presets'
import {
  type ConversionPurchaseContext,
  getPaywallCopy,
  getShortfallCopy,
  isRtlLocale,
} from '@/components/payments/conversion-paywall-copy'

export type ConversionPaywallSource = 'try_on' | 'frame_compare' | 'style_explorer' | 'face_analysis'

interface ConversionPaywallBoundaryProps {
  children: ReactNode
  source: ConversionPaywallSource
}

type ReturnState = 'success' | 'cancelled' | 'pending' | 'failed' | null

type PersistedUpload = {
  index: number
  ariaLabel: string | null
  file: File
}

type PersistedConversionContext = {
  source: ConversionPurchaseContext
  pathname: string
  createdAt: number
  creditsBalanceBefore: number
  uploads: PersistedUpload[]
  selectedFrameIds: string[]
}

type PersistedConversionMetadata = Omit<PersistedConversionContext, 'uploads'>

const CONTEXT_DB = 'visutry-conversion-context'
const CONTEXT_STORE = 'contexts'
const CONTEXT_VERSION = 1
const CONTEXT_IO_TIMEOUT_MS = 250
const CHECKOUT_REQUEST_TIMEOUT_MS = 15_000
const PAYMENT_VERIFY_ATTEMPTS = 24
const PAYMENT_VERIFY_DELAY_MS = 1250
const CONTEXT_MAX_AGE_MS = 2 * 60 * 60 * 1000
const PAYWALL_HISTORY_KEY = '__visutryConversionPaywall'

function defaultContextForSource(source: ConversionPaywallSource): ConversionPurchaseContext | null {
  if (source === 'face_analysis') return null
  return source
}

function defaultRequiredCredits(context: ConversionPurchaseContext): number | null {
  switch (context) {
    case 'try_on':
      return 1
    case 'frame_compare':
    case 'style_explorer':
    case 'face_analysis_top_picks':
      return 4
    case 'face_analysis_unlock':
      return null
  }
}

function normalizeRequestedContext(value: string | null): ConversionPurchaseContext | null {
  switch (value) {
    case 'face-analysis-top-picks':
    case 'face_analysis_top_picks':
      return 'face_analysis_top_picks'
    case 'face-analysis-unlock':
    case 'face_analysis_unlock':
      return 'face_analysis_unlock'
    case 'style-explorer':
    case 'style_explorer':
      return 'style_explorer'
    case 'frame-compare':
    case 'frame_compare':
      return 'frame_compare'
    case 'try-on':
    case 'try_on':
      return 'try_on'
    default:
      return null
  }
}

function resolveContextForDestination(
  source: ConversionPaywallSource,
  destination: URL,
): ConversionPurchaseContext | null {
  if (source !== 'face_analysis') return defaultContextForSource(source)
  const requested = normalizeRequestedContext(destination.searchParams.get('source'))
  if (requested === 'face_analysis_top_picks' || requested === 'face_analysis_unlock') return requested
  return null
}

function contextAllowedForSource(source: ConversionPaywallSource, context: ConversionPurchaseContext) {
  if (source === 'face_analysis') {
    return context === 'face_analysis_top_picks' || context === 'face_analysis_unlock'
  }
  return source === context
}

function parsePositiveCreditCount(value: string | null | undefined) {
  if (!value) return null
  const parsed = Number.parseInt(value, 10)
  if (!Number.isFinite(parsed) || parsed <= 0 || parsed > 100) return null
  return parsed
}

function inferRequiredCredits(
  anchor: HTMLAnchorElement,
  destination: URL,
  context: ConversionPurchaseContext,
) {
  const explicit = parsePositiveCreditCount(anchor.dataset.requiredCredits)
    ?? parsePositiveCreditCount(destination.searchParams.get('requiredCredits'))
    ?? parsePositiveCreditCount(destination.searchParams.get('required_credits'))
  if (explicit) return explicit

  const nearbyText = anchor.closest('p,div')?.textContent || ''
  const requirementMatch = nearbyText.match(/(?:require|requires|required|need|needs)\s+(\d+)\s+credits?/i)
    ?? nearbyText.match(/(\d+)\s+credits?\s+(?:to|for)\b/i)
  const inferred = parsePositiveCreditCount(requirementMatch?.[1])
  return inferred ?? defaultRequiredCredits(context)
}

function conversionContextKey(source: ConversionPurchaseContext, attemptId?: string) {
  return `visutry_conversion_context_${source}${attemptId ? `_${attemptId}` : ''}`
}

function createCheckoutAttemptId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `${Date.now()}_${Math.random().toString(36).slice(2)}`
}

function isRestorableContext(
  context: PersistedConversionContext | null,
  source: ConversionPurchaseContext,
  pathname: string,
) {
  if (!context) return false
  return context.source === source
    && context.pathname === pathname
    && Date.now() - context.createdAt <= CONTEXT_MAX_AGE_MS
}

function delay(ms: number) {
  return new Promise<void>((resolve) => window.setTimeout(resolve, ms))
}

function getCreditsBalance(session: ReturnType<typeof useSession>['data']) {
  if (!session?.user) return 0
  return Math.max(0, (session.user.creditsPurchased || 0) - (session.user.creditsUsed || 0))
}

function getAvailableCredits(session: ReturnType<typeof useSession>['data']) {
  if (!session?.user) return 0
  const remaining = session.user.remainingTrials
  if (typeof remaining === 'number' && Number.isFinite(remaining)) return Math.max(0, remaining)
  return getCreditsBalance(session)
}

function openContextDb(): Promise<IDBDatabase | null> {
  if (typeof window === 'undefined' || !window.indexedDB) return Promise.resolve(null)

  return new Promise((resolve) => {
    let settled = false
    let request: IDBOpenDBRequest

    const finish = (db: IDBDatabase | null) => {
      if (settled) {
        db?.close()
        return
      }
      settled = true
      window.clearTimeout(timeoutId)
      resolve(db)
    }

    const timeoutId = window.setTimeout(() => finish(null), CONTEXT_IO_TIMEOUT_MS)

    try {
      request = window.indexedDB.open(CONTEXT_DB, CONTEXT_VERSION)
    } catch {
      finish(null)
      return
    }

    request.onupgradeneeded = () => {
      try {
        const db = request.result
        if (!db.objectStoreNames.contains(CONTEXT_STORE)) db.createObjectStore(CONTEXT_STORE)
      } catch {
        // Persistence is optional and must never affect Checkout.
      }
    }
    request.onsuccess = () => finish(request.result)
    request.onerror = () => finish(null)
    request.onblocked = () => finish(null)
  })
}

function writeSessionMetadata(key: string, context: PersistedConversionContext) {
  const metadata: PersistedConversionMetadata = {
    source: context.source,
    pathname: context.pathname,
    createdAt: context.createdAt,
    creditsBalanceBefore: context.creditsBalanceBefore,
    selectedFrameIds: context.selectedFrameIds,
  }

  try {
    window.sessionStorage.setItem(key, JSON.stringify(metadata))
  } catch {
    // Best effort only.
  }
}

async function writeContextToDb(key: string, context: PersistedConversionContext) {
  const db = await openContextDb()
  if (!db) return

  await new Promise<void>((resolve) => {
    let settled = false
    const finish = () => {
      if (settled) return
      settled = true
      window.clearTimeout(timeoutId)
      resolve()
    }
    const timeoutId = window.setTimeout(finish, CONTEXT_IO_TIMEOUT_MS)

    try {
      const transaction = db.transaction(CONTEXT_STORE, 'readwrite')
      transaction.objectStore(CONTEXT_STORE).put(context, key)
      transaction.oncomplete = finish
      transaction.onerror = finish
      transaction.onabort = finish
    } catch {
      finish()
    }
  })

  db.close()
}

async function readPersistedContext(key: string): Promise<PersistedConversionContext | null> {
  const db = await openContextDb()
  if (db) {
    const value = await new Promise<PersistedConversionContext | null>((resolve) => {
      let settled = false
      const finish = (context: PersistedConversionContext | null) => {
        if (settled) return
        settled = true
        window.clearTimeout(timeoutId)
        resolve(context)
      }
      const timeoutId = window.setTimeout(() => finish(null), CONTEXT_IO_TIMEOUT_MS)

      try {
        const transaction = db.transaction(CONTEXT_STORE, 'readonly')
        const request = transaction.objectStore(CONTEXT_STORE).get(key)
        request.onsuccess = () => finish((request.result as PersistedConversionContext | undefined) || null)
        request.onerror = () => finish(null)
      } catch {
        finish(null)
      }
    })
    db.close()
    if (value) return value
  }

  try {
    const raw = window.sessionStorage.getItem(key)
    if (!raw) return null
    const metadata = JSON.parse(raw) as PersistedConversionMetadata
    return { ...metadata, uploads: [] }
  } catch {
    return null
  }
}

async function clearPersistedContext(key: string) {
  try {
    window.sessionStorage.removeItem(key)
  } catch {
    // Best effort only.
  }

  const db = await openContextDb()
  if (!db) return

  await new Promise<void>((resolve) => {
    let settled = false
    const finish = () => {
      if (settled) return
      settled = true
      window.clearTimeout(timeoutId)
      resolve()
    }
    const timeoutId = window.setTimeout(finish, CONTEXT_IO_TIMEOUT_MS)

    try {
      const transaction = db.transaction(CONTEXT_STORE, 'readwrite')
      transaction.objectStore(CONTEXT_STORE).delete(key)
      transaction.oncomplete = finish
      transaction.onerror = finish
      transaction.onabort = finish
    } catch {
      finish()
    }
  })

  db.close()
}

function captureUploads(container: HTMLElement | null): PersistedUpload[] {
  if (!container) return []

  return Array.from(container.querySelectorAll<HTMLInputElement>('input[type="file"]'))
    .map((input, index) => {
      const file = input.files?.[0]
      return file
        ? { index, ariaLabel: input.getAttribute('aria-label'), file }
        : null
    })
    .filter((upload): upload is PersistedUpload => Boolean(upload))
}

function getFrameButtonEntries(container: HTMLElement | null) {
  if (!container) return []
  const presetIdByAlt = new Map(
    TOP_PICK_GLASSES_PRESETS.map((preset) => [`${preset.name} glasses`, preset.id]),
  )

  return Array.from(container.querySelectorAll<HTMLButtonElement>('button'))
    .map((button) => {
      const alt = button.querySelector<HTMLImageElement>('img[alt$="glasses"]')?.alt
      const presetId = alt ? presetIdByAlt.get(alt) : undefined
      return presetId ? { button, presetId } : null
    })
    .filter((entry): entry is { button: HTMLButtonElement; presetId: string } => Boolean(entry))
}

function captureSelectedFrameIds(container: HTMLElement | null) {
  return getFrameButtonEntries(container)
    .filter(({ button }) => button.classList.contains('border-blue-500'))
    .map(({ presetId }) => presetId)
}

async function restoreUploads(container: HTMLElement | null, uploads: PersistedUpload[]) {
  if (!container || uploads.length === 0 || typeof DataTransfer === 'undefined') return 0

  const inputs = Array.from(container.querySelectorAll<HTMLInputElement>('input[type="file"]'))
  let restored = 0

  for (const upload of uploads) {
    const input = upload.ariaLabel
      ? inputs.find((candidate) => candidate.getAttribute('aria-label') === upload.ariaLabel) || inputs[upload.index]
      : inputs[upload.index]
    if (!input) continue

    try {
      const transfer = new DataTransfer()
      transfer.items.add(upload.file)
      input.files = transfer.files
      input.dispatchEvent(new Event('change', { bubbles: true }))
      restored += 1
      await delay(80)
    } catch {
      // Browser restrictions may prevent FileList restoration. Never treat that
      // as a payment failure and never auto-submit with partial state.
    }
  }

  return restored
}

function sameStringSet(a: string[], b: string[]) {
  if (a.length !== b.length) return false
  const left = [...a].sort()
  const right = [...b].sort()
  return left.every((value, index) => value === right[index])
}

async function restoreExactFrameSelection(container: HTMLElement | null, desiredIds: string[]) {
  if (!container || desiredIds.length === 0) return false
  const desired = new Set(desiredIds)

  let entries = getFrameButtonEntries(container)
  if (entries.length === 0) return false

  for (const { button, presetId } of entries) {
    const selected = button.classList.contains('border-blue-500')
    if (selected && !desired.has(presetId) && !button.disabled) button.click()
  }

  await delay(120)

  for (const desiredId of desiredIds) {
    entries = getFrameButtonEntries(container)
    const entry = entries.find(({ presetId }) => presetId === desiredId)
    if (!entry) return false
    const selected = entry.button.classList.contains('border-blue-500')
    if (!selected) {
      if (entry.button.disabled) return false
      entry.button.click()
      await delay(90)
    }
  }

  for (let attempt = 0; attempt < 12; attempt += 1) {
    const selectedNow = captureSelectedFrameIds(container)
    if (sameStringSet(selectedNow, desiredIds)) return true
    await delay(80)
  }

  return false
}

async function resumeTryOnAction(container: HTMLElement | null) {
  if (!container) return false

  for (let attempt = 0; attempt < 20; attempt += 1) {
    const action = Array.from(container.querySelectorAll<HTMLButtonElement>('button'))
      .find((button) => (button.textContent?.trim() || '') === 'Try On' && !button.disabled)
    if (action) {
      action.click()
      return true
    }
    await delay(200)
  }

  return false
}

type PaymentVerification = 'completed' | 'failed' | 'pending'

async function verifyPayment(sessionId: string): Promise<PaymentVerification> {
  for (let attempt = 0; attempt < PAYMENT_VERIFY_ATTEMPTS; attempt += 1) {
    try {
      const response = await fetch(
        `/api/payment/conversion?session_id=${encodeURIComponent(sessionId)}`,
        { cache: 'no-store' },
      )
      const payload = await response.json().catch(() => null)

      if (response.ok && payload?.status === 'completed') {
        const productType = payload.data?.productType
        const verifiedProduct = productType === 'CREDITS_PACK' || productType === 'CREDITS_PACK_PROMO_60'
        if (payload.data?.transactionId === sessionId && verifiedProduct) return 'completed'
        return 'failed'
      }

      if (response.ok && (payload?.status === 'failed' || payload?.status === 'refunded')) {
        return 'failed'
      }
    } catch {
      // Network and webhook propagation failures are retried below.
    }

    if (attempt < PAYMENT_VERIFY_ATTEMPTS - 1) await delay(PAYMENT_VERIFY_DELAY_MS)
  }

  return 'pending'
}

function buildCheckoutReturnUrl({
  payment,
  context,
  checkoutAttemptId,
  unlockTaskId,
}: {
  payment: 'success' | 'cancelled'
  context: ConversionPurchaseContext
  checkoutAttemptId: string
  unlockTaskId?: string | null
}) {
  const next = new URL(window.location.href)
  next.searchParams.delete('payment')
  next.searchParams.delete('conversion')
  next.searchParams.delete('conversion_attempt')
  next.searchParams.delete('conversion_task_id')
  next.searchParams.delete('session_id')
  next.searchParams.delete('unlock')
  next.searchParams.set('payment', payment)
  next.searchParams.set('conversion', context)
  next.searchParams.set('conversion_attempt', checkoutAttemptId)
  if (unlockTaskId) next.searchParams.set('conversion_task_id', unlockTaskId)

  if (payment === 'success') {
    const separator = next.search ? '&' : '?'
    return `${next.toString()}${separator}session_id={CHECKOUT_SESSION_ID}`
  }
  return next.toString()
}

function historyStateObject() {
  const state = window.history.state
  return state && typeof state === 'object' ? { ...state } : {}
}

export function ConversionPaywallBoundary({ children, source }: ConversionPaywallBoundaryProps) {
  const params = useParams()
  const locale = typeof params.locale === 'string' ? params.locale : 'en'
  const { data: session, update } = useSession()
  const boundaryRef = useRef<HTMLDivElement>(null)
  const primaryButtonRef = useRef<HTMLButtonElement>(null)
  const trackedPaywallKeysRef = useRef<Set<string>>(new Set())
  const returnHandledRef = useRef(false)
  const paywallHistoryEntryRef = useRef(false)
  const closeFallbackTimerRef = useRef<number | null>(null)
  const checkoutRequestRef = useRef<{
    controller: AbortController
    reason: 'user' | 'timeout' | null
  } | null>(null)
  const [open, setOpen] = useState(false)
  const [activeContext, setActiveContext] = useState<ConversionPurchaseContext | null>(
    () => defaultContextForSource(source),
  )
  const [activeRequiredCredits, setActiveRequiredCredits] = useState<number | null>(() => {
    const context = defaultContextForSource(source)
    return context ? defaultRequiredCredits(context) : null
  })
  const [activeUnlockTaskId, setActiveUnlockTaskId] = useState<string | null>(null)
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [checkoutError, setCheckoutError] = useState<string | null>(null)
  const [returnState, setReturnState] = useState<ReturnState>(null)
  const [returnMessage, setReturnMessage] = useState<string | null>(null)

  const effectiveContext = activeContext ?? defaultContextForSource(source) ?? 'face_analysis_top_picks'
  const copy = useMemo(() => getPaywallCopy(locale, effectiveContext), [effectiveContext, locale])
  const pricingHref = localizedPath(locale, '/pricing')
  const creditsCount = QUOTA_CONFIG.CREDITS_PACK
  const creditsPrice = `$${(PRICE_CONFIG.CREDITS_PACK / 100).toFixed(2)}`
  const monthlyPrice = `$${(PRICE_CONFIG.MONTHLY_SUBSCRIPTION / 100).toFixed(2)}`
  const currentCreditsBalance = useMemo(() => getCreditsBalance(session), [session])
  const currentAvailableCredits = useMemo(() => getAvailableCredits(session), [session])
  const creditsNeeded = activeRequiredCredits
    ? Math.max(0, activeRequiredCredits - currentAvailableCredits)
    : null
  const shortfallMessage = activeRequiredCredits && creditsNeeded && creditsNeeded > 0
    ? getShortfallCopy(locale, creditsNeeded, activeRequiredCredits, currentAvailableCredits)
    : null

  const abortPendingCheckout = useCallback(() => {
    if (!checkoutRequestRef.current) return
    checkoutRequestRef.current.reason = 'user'
    checkoutRequestRef.current.controller.abort()
    checkoutRequestRef.current = null
    setCheckoutLoading(false)
  }, [])

  const clearCloseFallback = useCallback(() => {
    if (closeFallbackTimerRef.current === null) return
    window.clearTimeout(closeFallbackTimerRef.current)
    closeFallbackTimerRef.current = null
  }, [])

  const consumePaywallHistoryMarker = useCallback(() => {
    if (typeof window === 'undefined' || !paywallHistoryEntryRef.current) return
    paywallHistoryEntryRef.current = false
    clearCloseFallback()
    try {
      const state = historyStateObject()
      delete state[PAYWALL_HISTORY_KEY]
      window.history.replaceState(state, '', window.location.href)
    } catch {
      // History enhancement must never block navigation or Checkout.
    }
  }, [clearCloseFallback])

  const closePaywallState = useCallback(() => {
    setCheckoutLoading(false)
    setOpen(false)
  }, [])

  const dismissPaywall = useCallback(() => {
    abortPendingCheckout()
    if (typeof window !== 'undefined' && paywallHistoryEntryRef.current) {
      try {
        window.history.back()
        clearCloseFallback()
        closeFallbackTimerRef.current = window.setTimeout(() => {
          if (!paywallHistoryEntryRef.current) return
          paywallHistoryEntryRef.current = false
          closePaywallState()
        }, 300)
        return
      } catch {
        paywallHistoryEntryRef.current = false
      }
    }
    closePaywallState()
  }, [abortPendingCheckout, clearCloseFallback, closePaywallState])

  useEffect(() => {
    const handlePopState = () => {
      if (!paywallHistoryEntryRef.current) return
      paywallHistoryEntryRef.current = false
      clearCloseFallback()
      abortPendingCheckout()
      closePaywallState()
    }
    window.addEventListener('popstate', handlePopState)
    return () => {
      window.removeEventListener('popstate', handlePopState)
      clearCloseFallback()
    }
  }, [abortPendingCheckout, clearCloseFallback, closePaywallState])

  const trackPaywallView = useCallback((
    context: ConversionPurchaseContext,
    requiredCredits: number | null,
  ) => {
    const needed = requiredCredits ? Math.max(0, requiredCredits - currentAvailableCredits) : null
    const trackingKey = `${context}:${requiredCredits ?? 'na'}:${currentAvailableCredits}`
    if (trackedPaywallKeysRef.current.has(trackingKey)) return
    trackedPaywallKeysRef.current.add(trackingKey)
    analytics.trackCustomEvent('paywall_view', {
      source: context,
      trigger: 'quota_or_credits_cta',
      remaining_quota: session?.user?.remainingTrials ?? 0,
      credits_balance: currentCreditsBalance,
      available_credits: currentAvailableCredits,
      required_credits: requiredCredits,
      credits_needed: needed,
      product_type: 'CREDITS_PACK',
      credits_count: creditsCount,
      price: PRICE_CONFIG.CREDITS_PACK / 100,
    })
  }, [creditsCount, currentAvailableCredits, currentCreditsBalance, session?.user?.remainingTrials])

  const showPaywall = useCallback((
    context: ConversionPurchaseContext,
    unlockTaskId?: string | null,
    requiredCredits?: number | null,
  ) => {
    const resolvedRequiredCredits = requiredCredits ?? defaultRequiredCredits(context)
    setCheckoutError(null)
    setActiveContext(context)
    setActiveRequiredCredits(resolvedRequiredCredits)
    setActiveUnlockTaskId(unlockTaskId?.trim() || null)

    if (typeof window !== 'undefined' && !paywallHistoryEntryRef.current) {
      try {
        window.history.pushState(
          { ...historyStateObject(), [PAYWALL_HISTORY_KEY]: true },
          '',
          window.location.href,
        )
        paywallHistoryEntryRef.current = true
      } catch {
        // The modal still opens if browser history is unavailable.
      }
    }

    setOpen(true)
    trackPaywallView(context, resolvedRequiredCredits)
  }, [trackPaywallView])

  const handleBoundaryClickCapture = useCallback((event: ReactMouseEvent<HTMLDivElement>) => {
    if (typeof window === 'undefined') return
    const target = event.target
    if (!(target instanceof Element)) return
    const anchor = target.closest<HTMLAnchorElement>('a[href]')
    if (!anchor) return

    try {
      const destination = new URL(anchor.href, window.location.origin)
      if (destination.origin !== window.location.origin || destination.pathname !== pricingHref) return
      const context = resolveContextForDestination(source, destination)
      if (!context) return

      const unlockTaskId = context === 'face_analysis_unlock'
        ? destination.searchParams.get('taskId') || new URL(window.location.href).searchParams.get('taskId')
        : null
      const requiredCredits = inferRequiredCredits(anchor, destination, context)

      event.preventDefault()
      event.stopPropagation()
      showPaywall(context, unlockTaskId, requiredCredits)
    } catch {
      // Malformed links should fall through to normal browser handling.
    }
  }, [pricingHref, showPaywall, source])

  const persistCurrentContext = useCallback((contextKey: string, context: ConversionPurchaseContext) => {
    const persisted: PersistedConversionContext = {
      source: context,
      pathname: window.location.pathname,
      createdAt: Date.now(),
      creditsBalanceBefore: currentCreditsBalance,
      uploads: captureUploads(boundaryRef.current),
      selectedFrameIds: context === 'frame_compare' ? captureSelectedFrameIds(boundaryRef.current) : [],
    }

    writeSessionMetadata(contextKey, persisted)
    return writeContextToDb(contextKey, persisted).catch(() => undefined)
  }, [currentCreditsBalance])

  const handleCheckout = useCallback(async () => {
    if (checkoutLoading || typeof window === 'undefined') return
    const context = activeContext ?? defaultContextForSource(source)
    if (!context) return

    if (context === 'face_analysis_unlock' && !activeUnlockTaskId) {
      setCheckoutError('We could not identify the Face Analysis report to unlock. Close this window and try again from the report.')
      return
    }

    setCheckoutLoading(true)
    setCheckoutError(null)

    const checkoutAttemptId = createCheckoutAttemptId()
    const contextKey = conversionContextKey(context, checkoutAttemptId)
    const controller = new AbortController()
    const checkoutRequest = { controller, reason: null as 'user' | 'timeout' | null }
    checkoutRequestRef.current = checkoutRequest
    const checkoutTimeoutId = window.setTimeout(() => {
      checkoutRequest.reason = 'timeout'
      controller.abort()
    }, CHECKOUT_REQUEST_TIMEOUT_MS)
    const needed = activeRequiredCredits
      ? Math.max(0, activeRequiredCredits - currentAvailableCredits)
      : null

    analytics.trackCustomEvent('credits_purchase_click', {
      source: context,
      product_type: 'CREDITS_PACK',
      credits_count: creditsCount,
      value: PRICE_CONFIG.CREDITS_PACK / 100,
      remaining_quota: session?.user?.remainingTrials ?? 0,
      credits_balance: currentCreditsBalance,
      available_credits: currentAvailableCredits,
      required_credits: activeRequiredCredits,
      credits_needed: needed,
    })

    const persistencePromise = Promise.resolve()
      .then(() => persistCurrentContext(contextKey, context))
      .catch(() => undefined)

    try {
      const response = await fetch('/api/payment/create-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          productType: 'CREDITS_PACK',
          successUrl: buildCheckoutReturnUrl({
            payment: 'success',
            context,
            checkoutAttemptId,
            unlockTaskId: activeUnlockTaskId,
          }),
          cancelUrl: buildCheckoutReturnUrl({
            payment: 'cancelled',
            context,
            checkoutAttemptId,
            unlockTaskId: activeUnlockTaskId,
          }),
          ...(context === 'face_analysis_unlock' && activeUnlockTaskId
            ? { unlockTaskId: activeUnlockTaskId }
            : {}),
          attribution: getAcquisitionContext(),
          locale,
        }),
      })
      const payload = await response.json()

      if (!response.ok || !payload.success || !payload.data?.url) {
        throw new Error(payload.error || copy.paymentError)
      }

      if (controller.signal.aborted) throw new DOMException('Aborted', 'AbortError')

      analytics.trackCustomEvent('checkout_started', {
        source: context,
        product_type: 'CREDITS_PACK',
        checkout_session_id: payload.data.sessionId,
        value: PRICE_CONFIG.CREDITS_PACK / 100,
        available_credits: currentAvailableCredits,
        required_credits: activeRequiredCredits,
        credits_needed: needed,
      })

      await Promise.race([persistencePromise, delay(CONTEXT_IO_TIMEOUT_MS)])
      if (controller.signal.aborted) throw new DOMException('Aborted', 'AbortError')

      // History is a UX enhancement only. Never wait for popstate before entering Stripe.
      consumePaywallHistoryMarker()
      window.location.assign(payload.data.url)
    } catch (error) {
      if (checkoutRequest.reason !== 'user') {
        console.error('Contextual checkout failed:', error)
        setCheckoutError(
          checkoutRequest.reason === 'timeout'
            ? copy.paymentError
            : error instanceof Error ? error.message : copy.paymentError,
        )
      }
      setCheckoutLoading(false)
    } finally {
      window.clearTimeout(checkoutTimeoutId)
      if (checkoutRequestRef.current === checkoutRequest) checkoutRequestRef.current = null
    }
  }, [
    activeContext,
    activeRequiredCredits,
    activeUnlockTaskId,
    checkoutLoading,
    consumePaywallHistoryMarker,
    copy.paymentError,
    creditsCount,
    currentAvailableCredits,
    currentCreditsBalance,
    locale,
    persistCurrentContext,
    session?.user?.remainingTrials,
    source,
  ])

  useEffect(() => {
    if (!open) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const boundary = boundaryRef.current as (HTMLDivElement & { inert?: boolean }) | null
    const hadInert = Boolean(boundary?.inert)
    if (boundary) boundary.inert = true

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') dismissPaywall()
    }
    document.addEventListener('keydown', onKeyDown)
    window.setTimeout(() => primaryButtonRef.current?.focus(), 20)

    return () => {
      document.body.style.overflow = previousOverflow
      if (boundary) boundary.inert = hadInert
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [dismissPaywall, open])

  useEffect(() => {
    if (returnHandledRef.current || typeof window === 'undefined') return

    const url = new URL(window.location.href)
    const payment = url.searchParams.get('payment')
    const conversion = normalizeRequestedContext(url.searchParams.get('conversion'))
    if ((payment !== 'success' && payment !== 'cancelled') || !conversion) return
    if (!contextAllowedForSource(source, conversion)) return

    returnHandledRef.current = true
    setActiveContext(conversion)
    setActiveRequiredCredits(defaultRequiredCredits(conversion))
    const returnCopy = getPaywallCopy(locale, conversion)
    const checkoutAttemptId = url.searchParams.get('conversion_attempt')?.trim() || ''
    const contextKey = checkoutAttemptId
      ? conversionContextKey(conversion, checkoutAttemptId)
      : conversionContextKey(conversion)
    const returnUnlockTaskId = url.searchParams.get('conversion_task_id')?.trim()
      || url.searchParams.get('taskId')?.trim()
      || ''
    if (conversion === 'face_analysis_unlock' && returnUnlockTaskId) {
      setActiveUnlockTaskId(returnUnlockTaskId)
    }

    const cleanReturnParams = () => {
      url.searchParams.delete('payment')
      url.searchParams.delete('conversion')
      url.searchParams.delete('conversion_attempt')
      url.searchParams.delete('conversion_task_id')
      url.searchParams.delete('session_id')
      window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}${url.hash}`)
    }

    const restoreReturnContext = async () => {
      const persistedContext = await readPersistedContext(contextKey)
      const context = isRestorableContext(persistedContext, conversion, window.location.pathname)
        ? persistedContext
        : null
      await delay(120)

      if (payment === 'cancelled') {
        const restoredUploads = await restoreUploads(boundaryRef.current, context?.uploads || [])
        const framesRestored = conversion === 'frame_compare'
          ? await restoreExactFrameSelection(boundaryRef.current, context?.selectedFrameIds || [])
          : true

        analytics.trackCustomEvent('checkout_cancelled', {
          source: conversion,
          product_type: 'CREDITS_PACK',
          restored_uploads: restoredUploads,
          restored_frames_exactly: framesRestored,
        })
        setReturnState('cancelled')
        setReturnMessage(returnCopy.cancelledBody)
        await clearPersistedContext(contextKey)
        cleanReturnParams()
        return
      }

      const sessionId = url.searchParams.get('session_id')?.trim() || ''
      if (!sessionId.startsWith('cs_')) {
        setReturnState('pending')
        setReturnMessage('We could not verify this Checkout return yet. No automatic action was started. Your saved context is being kept for a retry.')
        return
      }

      setReturnState('pending')
      setReturnMessage('Confirming your payment with VisuTry. Your saved selections will only be resumed after the server verifies the purchase.')

      const verification = await verifyPayment(sessionId)
      if (verification === 'pending') {
        setReturnState('pending')
        setReturnMessage('Payment is still being confirmed. Your saved selections are safe. Refresh this page in a moment if the balance has not updated yet.')
        return
      }

      if (verification === 'failed') {
        const restoredUploads = await restoreUploads(boundaryRef.current, context?.uploads || [])
        if (conversion === 'frame_compare') {
          await restoreExactFrameSelection(boundaryRef.current, context?.selectedFrameIds || [])
        }
        setReturnState('failed')
        setReturnMessage('This Checkout was not verified as a completed Credits Pack purchase. No automatic try-on or comparison was started.')
        await clearPersistedContext(contextKey)
        cleanReturnParams()
        return
      }

      analytics.trackCustomEvent('checkout_completed', {
        source: conversion,
        product_type: 'CREDITS_PACK',
        checkout_session_id: sessionId,
        value: PRICE_CONFIG.CREDITS_PACK / 100,
      })

      if (conversion === 'face_analysis_unlock') {
        if (!returnUnlockTaskId) {
          setReturnState('failed')
          setReturnMessage('Payment was verified, but VisuTry could not identify which Face Analysis report to reopen. Your credits were still added. Please reopen your latest report from the dashboard.')
          await clearPersistedContext(contextKey)
          cleanReturnParams()
          return
        }

        await clearPersistedContext(contextKey)
        const next = new URL(window.location.href)
        next.searchParams.delete('payment')
        next.searchParams.delete('conversion')
        next.searchParams.delete('conversion_attempt')
        next.searchParams.delete('conversion_task_id')
        next.searchParams.delete('session_id')
        next.searchParams.set('taskId', returnUnlockTaskId)
        next.searchParams.set('unlock', 'success')
        window.location.replace(next.toString())
        return
      }

      const creditsBefore = context?.creditsBalanceBefore ?? currentCreditsBalance
      let sessionFresh = false
      for (let attempt = 0; attempt < 3; attempt += 1) {
        try {
          const refreshed = await update()
          if (getCreditsBalance(refreshed) > creditsBefore) {
            sessionFresh = true
            break
          }
        } catch {
          // Payment is already verified. Session refresh failure only disables auto-resume.
        }
        await delay(300)
      }

      const expectedUploads = context?.uploads.length || 0
      const restoredUploads = await restoreUploads(boundaryRef.current, context?.uploads || [])
      const uploadsRestoredExactly = expectedUploads > 0 && restoredUploads === expectedUploads
      const framesRestoredExactly = conversion === 'frame_compare'
        ? await restoreExactFrameSelection(boundaryRef.current, context?.selectedFrameIds || [])
        : true

      let resumed = false
      if (conversion === 'try_on' && sessionFresh && uploadsRestoredExactly) {
        resumed = await resumeTryOnAction(boundaryRef.current)
      }

      analytics.trackCustomEvent('conversion_context_restored', {
        source: conversion,
        product_type: 'CREDITS_PACK',
        payment_verified: true,
        session_fresh: sessionFresh,
        restored_uploads: restoredUploads,
        expected_uploads: expectedUploads,
        restored_frames_exactly: framesRestoredExactly,
        original_action_resumed: resumed,
        requires_confirmation: conversion !== 'try_on',
      })
      if (resumed) {
        analytics.trackCustomEvent('original_action_resumed', {
          source: conversion,
          product_type: 'CREDITS_PACK',
        })
      }

      setReturnState('success')
      setReturnMessage(returnCopy.successBody)
      await clearPersistedContext(contextKey)
      cleanReturnParams()
    }

    void restoreReturnContext()
  }, [currentCreditsBalance, locale, source, update])

  const returnTitle = returnState === 'success'
    ? copy.successTitle
    : returnState === 'cancelled'
      ? copy.cancelledTitle
      : returnState === 'failed'
        ? 'Payment not verified'
        : 'Confirming payment'

  const returnTone = returnState === 'success'
    ? 'border-green-200 bg-green-50 text-green-900'
    : returnState === 'cancelled'
      ? 'border-amber-200 bg-amber-50 text-amber-900'
      : returnState === 'failed'
        ? 'border-red-200 bg-red-50 text-red-900'
        : 'border-blue-200 bg-blue-50 text-blue-900'

  const handleViewPlans = useCallback(() => {
    consumePaywallHistoryMarker()
  }, [consumePaywallHistoryMarker])

  return (
    <>
      <div ref={boundaryRef} onClickCapture={handleBoundaryClickCapture}>
        {children}
      </div>

      {returnState && returnMessage && (
        <div
          className={`fixed left-4 right-4 z-[90] mx-auto max-w-xl rounded-xl border px-4 py-3 shadow-lg ${returnTone}`}
          style={{ top: 'max(16px, calc(env(safe-area-inset-top) + 8px))' }}
          role="status"
          aria-live="polite"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-bold">{returnTitle}</p>
              <p className="mt-1 text-sm leading-5 opacity-90">{returnMessage}</p>
            </div>
            <button
              type="button"
              onClick={() => {
                setReturnState(null)
                setReturnMessage(null)
              }}
              className="rounded-md p-1 opacity-70 transition hover:bg-white/70 hover:opacity-100"
              aria-label={copy.close}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {open && (
        <div
          data-testid="conversion-paywall-overlay"
          className="fixed inset-0 z-[80] h-[100dvh] min-h-[100dvh] bg-slate-950/45 backdrop-blur-[1px] sm:flex sm:items-center sm:justify-center sm:p-6"
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby={`conversion-paywall-${effectiveContext}`}
            dir={isRtlLocale(locale) ? 'rtl' : 'ltr'}
            className="flex h-[100dvh] min-h-[100dvh] max-h-[100dvh] w-full flex-col overflow-y-auto bg-slate-50 sm:h-auto sm:min-h-0 sm:max-h-[92vh] sm:max-w-[500px] sm:rounded-2xl sm:border sm:border-slate-200 sm:shadow-2xl"
          >
            <div
              className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-white px-5 pb-4 sm:rounded-t-2xl sm:pt-4"
              style={{ paddingTop: 'max(16px, calc(env(safe-area-inset-top) + 8px))' }}
            >
              <span className="text-sm font-bold tracking-tight text-slate-950">VisuTry</span>
              <button
                type="button"
                onClick={dismissPaywall}
                className="flex h-11 w-11 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 disabled:opacity-40"
                aria-label={copy.close}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mx-auto flex w-full max-w-md flex-1 flex-col px-5 pb-32 pt-6 sm:px-7 sm:pb-8 sm:pt-8">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-600">{copy.eyebrow}</p>
              <h2 id={`conversion-paywall-${effectiveContext}`} className="mt-2 text-[28px] font-bold leading-[1.12] tracking-tight text-slate-950 sm:text-3xl">
                {copy.title}
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">{copy.description}</p>

              {shortfallMessage && (
                <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm leading-5 text-blue-950" data-testid="conversion-credit-shortfall">
                  <span className="font-bold">{shortfallMessage}</span>
                </div>
              )}

              <div className="mt-5 rounded-2xl border border-blue-200 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-base font-bold text-slate-950">{copy.packTitle(creditsCount)}</h3>
                    <p className="mt-1 text-xs font-medium text-slate-500">{copy.oneTime}</p>
                  </div>
                  <div className="text-end">
                    <div className="text-3xl font-bold tracking-tight text-slate-950">{creditsPrice}</div>
                  </div>
                </div>

                <ul className="mt-5 space-y-3">
                  {copy.benefits.map((benefit) => (
                    <li key={benefit} className="flex items-start gap-3 text-sm text-slate-700">
                      <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-green-50 text-green-600">
                        <Check className="h-3.5 w-3.5" />
                      </span>
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>

                {checkoutError && (
                  <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
                    {checkoutError}
                  </div>
                )}

                <div
                  className="fixed inset-x-0 bottom-0 z-[95] border-t border-slate-200 bg-white/95 px-5 pt-3 shadow-[0_-8px_24px_rgba(15,23,42,0.08)] backdrop-blur sm:static sm:mt-6 sm:border-0 sm:bg-transparent sm:p-0 sm:shadow-none sm:backdrop-blur-0"
                  style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}
                  data-testid="conversion-paywall-action-bar"
                >
                  <div className="mx-auto flex max-w-md items-center gap-3 sm:block">
                    <div className="min-w-0 flex-1 sm:hidden">
                      <p className="text-xs font-semibold leading-4 text-slate-500">
                        {copy.packTitle(creditsCount)} · {copy.oneTime}
                      </p>
                      <p className="mt-0.5 text-lg font-bold text-slate-950">{creditsPrice}</p>
                    </div>
                    <button
                      ref={primaryButtonRef}
                      type="button"
                      onClick={handleCheckout}
                      disabled={checkoutLoading}
                      className="inline-flex min-h-12 flex-[1.35] items-center justify-center rounded-xl bg-blue-600 px-4 py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-blue-400 sm:w-full"
                    >
                      {checkoutLoading ? (
                        <>
                          <Loader2 className="me-2 h-4 w-4 animate-spin" />
                          {copy.processing}
                        </>
                      ) : (
                        copy.continueLabel(creditsPrice)
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-5 rounded-xl border border-slate-200 bg-white px-4 py-3.5">
                <p className="text-sm font-semibold text-slate-800">{copy.regularUse}</p>
                <div className="mt-1 flex flex-wrap items-center justify-between gap-2 text-sm">
                  <span className="text-slate-500">{copy.standardFrom(monthlyPrice)}</span>
                  <a
                    href={pricingHref}
                    onClick={handleViewPlans}
                    className="font-semibold text-blue-600 hover:text-blue-700 hover:underline"
                  >
                    {copy.viewPlans} →
                  </a>
                </div>
              </div>

              <p className="mt-auto pt-6 text-center text-xs text-slate-400">{copy.secureCheckout}</p>
            </div>
          </section>
        </div>
      )}
    </>
  )
}
