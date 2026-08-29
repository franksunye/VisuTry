'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import {
  ArrowRight,
  CheckCircle2,
  Glasses,
  Loader2,
  LockKeyhole,
  ShieldCheck,
  Store,
} from 'lucide-react'
import { ImageUpload } from '@/components/upload/ImageUpload'
import { StoreTryOnComparePanel } from '@/components/store/StoreTryOnComparePanel'
import { ExperiencePresentationShell, type ExperiencePresentationCopy } from '@/components/store/ExperiencePresentationShell'
import { StoreFitProfile, type StoreFitProfileCopy } from '@/components/store/StoreFitProfile'
import { analyzeFaceLandmarkFile } from '@/lib/face-landmark-client'
import type { FaceLandmarkDetectionResult } from '@/lib/face-landmark-client'
import type { FaceGeometryAnalysis } from '@/types/face-analysis'
import { maxSelectableStoreFrames } from '@/modules/store/domain/experience-policy'
import { resolvePresentationMode } from '@/modules/store/domain/presentation-mode'
import { resolveStoreSelectionCtaState, resolveStoreWorkspaceStep } from '@/components/store/store-workspace-ux'
import {
  createMerchantContinuation,
  getMerchantContinuationFromUrl,
  merchantRuntimeContinuationStorageKey,
} from '@/lib/commerce-handoff/merchant-continuation'
import {
  parseMerchantRuntimeContinuationState,
  serializeMerchantRuntimeContinuationState,
  type MerchantRuntimeTryOnTaskRef,
} from '@/lib/commerce-handoff/merchant-runtime-state'
import { isPersistablePreviewUrl } from '@/lib/commerce-handoff/merchant-runtime-preview'
import type { PublicMerchantProfile } from '@/modules/store/application/get-public-merchant'

type MerchantProfile = PublicMerchantProfile

type SessionState = {
  merchantId: string
  merchantSessionId: string
  expiresAt: string
}

type RecommendedFrame = {
  id: string
  name: string
  imageUrl: string | null
  productUrl: string | null
  price: number | null
  currency: string | null
  shape: string
  material: string | null
  color: string | null
  widthClass: string | null
  styleTags: string[]
  productBrand: string | null
  score: number
  reason: string
}

type RuntimeContinuationState = {
  merchantId: string
  merchantSessionId: string
  expiresAt: string
  photoPreview: string
  recommendations: RecommendedFrame[]
  selectedIds: string[]
  selectionSaved: boolean
  batchId: string | null
  tryOnTasks: MerchantRuntimeTryOnTaskRef[]
}

type StoreShopperExperienceProps = {
  merchantSlug: string
  experienceSlug?: string
  locale: string
  publicPocStorage: boolean
  initialPublicMerchant?: PublicMerchantProfile | null
}

type LoadState = 'loading' | 'ready' | 'unavailable' | 'error'

function deviceTypeLabel(): string {
  if (typeof window === 'undefined') return 'desktop'
  return window.matchMedia('(max-width: 768px)').matches ? 'mobile' : 'desktop'
}

/** Capture UTM / referrer / AI-agent hints for MerchantSession acquisition. */
function captureStoreAcquisition(): {
  source?: string
  medium?: string
  campaign?: string
  surface?: string
  referrer?: string
  landingUrl?: string
  aiAgentSource?: string
} {
  if (typeof window === 'undefined') return {}
  const params = new URLSearchParams(window.location.search)
  const ua = navigator.userAgent.toLowerCase()
  let aiAgentSource: string | undefined
  if (ua.includes('chatgpt') || ua.includes('gptbot')) aiAgentSource = 'chatgpt'
  else if (ua.includes('claude') || ua.includes('anthropic')) aiAgentSource = 'claude'
  else if (ua.includes('perplexity')) aiAgentSource = 'perplexity'
  else if (ua.includes('gemini') || ua.includes('google-extended')) aiAgentSource = 'gemini'

  const source = params.get('source') || params.get('utm_source') || undefined
  const medium = params.get('medium') || params.get('utm_medium') || undefined
  const campaign = params.get('campaign') || params.get('utm_campaign') || undefined
  const surface = params.get('surface') || undefined
  const referrer = document.referrer || undefined
  const landingUrl = `${window.location.pathname}${window.location.search}` || undefined

  return {
    ...(source ? { source } : {}),
    ...(medium ? { medium } : {}),
    ...(campaign ? { campaign } : {}),
    ...(surface ? { surface } : {}),
    ...(referrer ? { referrer } : {}),
    ...(landingUrl ? { landingUrl } : {}),
    ...(aiAgentSource ? { aiAgentSource } : {}),
  }
}

function formatPrice(price: number | null, currency: string | null): string | null {
  if (price === null || price === undefined) return null
  const code = (currency || 'usd').toUpperCase()
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: code,
    }).format(price / 100)
  } catch {
    return `${(price / 100).toFixed(2)} ${code}`
  }
}

function MerchantMark({ merchant, accent }: { merchant: MerchantProfile; accent: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
        {merchant.logoUrl ? (
          <Image src={merchant.logoUrl} alt="" fill sizes="48px" className="object-contain p-1.5" />
        ) : (
          <Store className="h-6 w-6" style={{ color: accent }} aria-hidden="true" />
        )}
      </div>
      <p className="font-serif text-xl font-semibold tracking-tight text-slate-950 sm:text-2xl">{merchant.name}</p>
    </div>
  )
}

function JourneyStep({
  number,
  label,
  active,
  complete,
  accent,
}: {
  number: number
  label: string
  active: boolean
  complete: boolean
  accent: string
}) {
  return (
    <div className="flex min-w-0 flex-1 items-center gap-2.5">
      <span
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold transition"
        style={active || complete ? { backgroundColor: accent, color: 'white' } : { backgroundColor: '#eef1f5', color: '#94a3b8' }}
      >
        {complete ? <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> : number}
      </span>
      <span className={`truncate text-xs font-semibold sm:text-sm ${active || complete ? 'text-slate-900' : 'text-slate-400'}`}>
        {label}
      </span>
    </div>
  )
}

export function StoreShopperExperience({
  merchantSlug,
  experienceSlug,
  locale,
  publicPocStorage,
  initialPublicMerchant = null,
}: StoreShopperExperienceProps) {
  const t = useTranslations('storeShopper')
  const [loadState, setLoadState] = useState<LoadState>(initialPublicMerchant ? 'ready' : 'loading')
  const [merchant, setMerchant] = useState<MerchantProfile | null>(initialPublicMerchant)
  const [privacyAccepted, setPrivacyAccepted] = useState(false)
  const [session, setSession] = useState<SessionState | null>(null)
  const [sessionStarting, setSessionStarting] = useState(false)
  const [photoPreview, setPhotoPreview] = useState<string | undefined>()
  const [photoUploading, setPhotoUploading] = useState(false)
  const [photoReady, setPhotoReady] = useState(false)
  const [recommending, setRecommending] = useState(false)
  const [recommendations, setRecommendations] = useState<RecommendedFrame[]>([])
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [selectionSaving, setSelectionSaving] = useState(false)
  const [selectionSaved, setSelectionSaved] = useState(false)
  const [faceGeometry, setFaceGeometry] = useState<FaceGeometryAnalysis | null>(null)
  const [faceDetection, setFaceDetection] = useState<FaceLandmarkDetectionResult | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [resumeBatchId, setResumeBatchId] = useState<string | null>(null)
  const [resumeTryOnTasks, setResumeTryOnTasks] = useState<MerchantRuntimeTryOnTaskRef[]>([])
  const [guestCompareUnlocked, setGuestCompareUnlocked] = useState(false)
  const featuredFramesRef = useRef<HTMLElement>(null)
  const tryOnSectionRef = useRef<HTMLDivElement>(null)
  const [storeContinuationQuery, setStoreContinuationQuery] = useState('')

  const accent = merchant?.accentColor || '#1F4B5A'
  const merchantContinuation = createMerchantContinuation({
    locale,
    merchantSlug,
    experienceType: experienceSlug ? 'CAMPAIGN' : 'STORE',
    experienceSlug,
  })
  const runtimeContinuationKey = merchantContinuation
    ? merchantRuntimeContinuationStorageKey(merchantContinuation)
    : null
  const merchantContinuationPath = merchantContinuation?.canonicalReturnPath

  const clearRuntimeContinuation = useCallback(() => {
    if (typeof window === 'undefined' || !runtimeContinuationKey) return
    try {
      sessionStorage.removeItem(runtimeContinuationKey)
    } catch {
      // Ignore unavailable storage.
    }
  }, [runtimeContinuationKey])

  const persistRuntimeContinuation = useCallback((batchId = resumeBatchId, tryOnTasks = resumeTryOnTasks) => {
    if (
      typeof window === 'undefined' ||
      !runtimeContinuationKey ||
      !session ||
      !photoPreview ||
      !isPersistablePreviewUrl(photoPreview) ||
      recommendations.length === 0 ||
      selectedIds.length === 0 ||
      !selectionSaved
    ) return

    const value: RuntimeContinuationState = {
      merchantId: session.merchantId,
      merchantSessionId: session.merchantSessionId,
      expiresAt: session.expiresAt,
      photoPreview,
      recommendations,
      selectedIds,
      selectionSaved: true,
      batchId,
      tryOnTasks,
    }
    try {
      sessionStorage.setItem(
        runtimeContinuationKey,
        serializeMerchantRuntimeContinuationState({
          ...value,
          selectionSaved: true,
        }),
      )
    } catch {
      // Ignore unavailable or quota-limited storage.
    }
  }, [photoPreview, recommendations, resumeBatchId, resumeTryOnTasks, runtimeContinuationKey, selectedIds, selectionSaved, session])

  useEffect(() => {
    let cancelled = false

    async function loadMerchant() {
      if (initialPublicMerchant) {
        setMerchant(initialPublicMerchant)
        setLoadState('ready')
        return
      }

      setLoadState('loading')
      setErrorMessage(null)
      try {
        const query = experienceSlug ? `?experienceSlug=${encodeURIComponent(experienceSlug)}` : ''
        const res = await fetch(`/api/store/merchants/${encodeURIComponent(merchantSlug)}${query}`)
        const json = await res.json()
        if (cancelled) return

        if (!res.ok || !json.success) {
          setLoadState(res.status === 403 || res.status === 404 ? 'unavailable' : 'error')
          setErrorMessage(json.error || t('errors.unavailable'))
          return
        }

        setMerchant(json.data)
        setLoadState('ready')
      } catch {
        if (!cancelled) {
          setLoadState('error')
          setErrorMessage(t('errors.generic'))
        }
      }
    }

    loadMerchant()
    return () => {
      cancelled = true
    }
  }, [merchantSlug, experienceSlug, t, initialPublicMerchant])

  useEffect(() => {
    if (!merchant || typeof window === 'undefined' || !runtimeContinuationKey || !merchantContinuationPath) return
    const params = new URLSearchParams(window.location.search)
    if (!params.has('merchantContinuation')) return
    const current = getMerchantContinuationFromUrl(`${window.location.pathname}${window.location.search}`)
    if (current?.canonicalReturnPath !== merchantContinuationPath) return

    try {
      const raw = sessionStorage.getItem(runtimeContinuationKey)
      if (!raw) return
      const parsedJson = JSON.parse(raw) as unknown
      const value = parseMerchantRuntimeContinuationState(parsedJson)
      if (!value) {
        sessionStorage.removeItem(runtimeContinuationKey)
        return
      }

      const validRecommendations = value.recommendations.filter((frame): frame is RecommendedFrame =>
        Boolean(frame && typeof frame === 'object' && typeof (frame as RecommendedFrame).id === 'string'),
      )
      if (validRecommendations.length === 0 || value.selectedIds.length === 0) return

      setSession({
        merchantId: value.merchantId,
        merchantSessionId: value.merchantSessionId,
        expiresAt: value.expiresAt,
      })
      setPrivacyAccepted(true)
      setPhotoPreview(value.photoPreview)
      setPhotoReady(true)
      setRecommendations(validRecommendations)
      setSelectedIds(value.selectedIds)
      setSelectionSaved(true)
      setResumeBatchId(value.batchId)
      setResumeTryOnTasks(value.tryOnTasks)
      setGuestCompareUnlocked(true)
    } catch {
      // Ignore malformed same-tab state and let the shopper restart cleanly.
    }
  }, [merchant, merchantContinuationPath, runtimeContinuationKey])

  useEffect(() => {
    if (!experienceSlug || typeof window === 'undefined') return

    const current = new URLSearchParams(window.location.search)
    const preserved = new URLSearchParams()
    for (const key of ['source', 'medium', 'campaign', 'surface', 'utm_source', 'utm_medium', 'utm_campaign']) {
      const value = current.get(key)
      if (value) preserved.set(key, value)
    }
    const query = preserved.toString()
    setStoreContinuationQuery(query ? `?${query}` : '')
  }, [experienceSlug])

  const ensureSession = useCallback(async (): Promise<SessionState | null> => {
    if (session) return session

    setSessionStarting(true)
    setErrorMessage(null)
    try {
      const res = await fetch('/api/store/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchantSlug,
          ...(experienceSlug ? { experienceSlug } : {}),
          locale,
          deviceType: deviceTypeLabel(),
          acquisition: captureStoreAcquisition(),
        }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        setErrorMessage(json.error || t('errors.session'))
        return null
      }

      const next: SessionState = {
        merchantId: json.data.merchantId,
        merchantSessionId: json.data.merchantSessionId,
        expiresAt: json.data.expiresAt,
      }
      setSession(next)
      try {
        sessionStorage.setItem(`vt_store_session:${merchantSlug}:${experienceSlug || 'store'}`, JSON.stringify(next))
      } catch {
        // ignore
      }
      return next
    } catch {
      setErrorMessage(t('errors.session'))
      return null
    } finally {
      setSessionStarting(false)
    }
  }, [session, merchantSlug, experienceSlug, locale, t])

  const runRecommendations = useCallback(
    async (activeSession: SessionState, file: File) => {
      setRecommending(true)
      setErrorMessage(null)
      setRecommendations([])
      setSelectedIds([])
      setSelectionSaved(false)

      let measuredShape: string | undefined
      let faceAspectRatio: number | undefined
      let geometryAnalysis: {
        status?: 'measured' | 'unavailable'
        measuredShape?: string
        alternativeShapes?: string[]
        measuredConfidence?: number
        qualityScore?: number
        ratios?: {
          faceAspectRatio?: number
          jawToCheekWidth?: number
          foreheadToCheekWidth?: number
        }
      } | undefined

      try {
        const landmark = await analyzeFaceLandmarkFile(file)
        setFaceGeometry(landmark.geometry)
        setFaceDetection(landmark.detection)
        geometryAnalysis = {
          status: landmark.geometry.status,
          measuredShape: landmark.geometry.measuredShape,
          alternativeShapes: landmark.geometry.alternativeShapes,
          measuredConfidence: landmark.geometry.measuredConfidence,
          qualityScore: landmark.geometry.qualityScore,
          ratios: {
            faceAspectRatio: landmark.geometry.ratios?.faceAspectRatio,
            jawToCheekWidth: landmark.geometry.ratios?.jawToCheekWidth,
            foreheadToCheekWidth: landmark.geometry.ratios?.foreheadToCheekWidth,
          },
        }
        if (landmark.geometry.status === 'measured') {
          measuredShape = landmark.geometry.measuredShape
          faceAspectRatio = landmark.geometry.ratios?.faceAspectRatio
        }
      } catch {
        // Fall back to catalog-only ranking when on-device analysis fails.
        setFaceGeometry(null)
        setFaceDetection(null)
      }

      try {
        const res = await fetch('/api/store/sessions/recommend', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            merchantSlug,
            merchantSessionId: activeSession.merchantSessionId,
            measuredShape,
            faceAspectRatio,
            geometryAnalysis,
            locale,
            deviceType: deviceTypeLabel(),
            clientActionId: `rec:${activeSession.merchantSessionId}:${Date.now()}`,
          }),
        })
        const json = await res.json()
        if (!res.ok || !json.success) {
          setErrorMessage(json.error || t('errors.recommend'))
          return
        }
        setRecommendations(json.data.frames || [])
      } catch {
        setErrorMessage(t('errors.recommend'))
      } finally {
        setRecommending(false)
      }
    },
    [merchantSlug, locale, t],
  )

  const handleAcceptPrivacy = async () => {
    const created = await ensureSession()
    if (created) setPrivacyAccepted(true)
  }

  const scrollToFeaturedFrames = useCallback(() => {
    featuredFramesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [])

  const handleImageSelect = async (file: File, preview: string) => {
    clearRuntimeContinuation()
    setResumeBatchId(null)
    setPhotoPreview(preview)
    setPhotoReady(false)
    setRecommendations([])
    setSelectedIds([])
    setSelectionSaved(false)
    setFaceGeometry(null)
    setFaceDetection(null)
    setErrorMessage(null)

    const activeSession = await ensureSession()
    if (!activeSession) return

    setPhotoUploading(true)
    try {
      const formData = new FormData()
      formData.set('photo', file)
      formData.set('merchantSlug', merchantSlug)
      formData.set('merchantSessionId', activeSession.merchantSessionId)
      formData.set('locale', locale)
      formData.set('deviceType', deviceTypeLabel())

      const res = await fetch('/api/store/sessions/photo', {
        method: 'POST',
        body: formData,
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        setErrorMessage(json.error || t('errors.upload'))
        setPhotoPreview(undefined)
        return
      }

      setPhotoPreview(json.data.previewUrl || preview)
      setPhotoReady(true)
      await runRecommendations(activeSession, file)
    } catch {
      setErrorMessage(t('errors.upload'))
      setPhotoPreview(undefined)
    } finally {
      setPhotoUploading(false)
    }
  }

  const handleImageRemove = () => {
    clearRuntimeContinuation()
    setResumeBatchId(null)
    setPhotoPreview(undefined)
    setPhotoReady(false)
    setRecommendations([])
    setSelectedIds([])
    setSelectionSaved(false)
    setFaceGeometry(null)
    setFaceDetection(null)
  }

  const frameSelectionContext = {
    guestSponsoredTryOnLimit: merchant?.guestSponsoredTryOnLimit ?? null,
    guestCompareUnlocked,
  }

  const toggleFrame = (frameId: string) => {
    clearRuntimeContinuation()
    setResumeBatchId(null)
    setSelectionSaved(false)
    setSelectedIds((current) => {
      if (current.includes(frameId)) {
        return current.filter((id) => id !== frameId)
      }
      const max = maxSelectableStoreFrames(merchant?.experiencePolicy ?? {
        tryOnEnabled: true,
        compareEnabled: true,
        maxCompareFrames: 2,
        inquiryEnabled: false,
      }, frameSelectionContext)
      if (current.length >= max) return current
      return [...current, frameId]
    })
  }

  const handleConfirmSelection = async () => {
    if (!session || selectedIds.length === 0) return
    setSelectionSaving(true)
    setErrorMessage(null)
    try {
      const res = await fetch('/api/store/sessions/select-frames', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchantSlug,
          merchantSessionId: session.merchantSessionId,
          frameIds: selectedIds,
          locale,
          deviceType: deviceTypeLabel(),
          clientActionId: `sel:${session.merchantSessionId}:${selectedIds.join(',')}`,
        }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        setErrorMessage(json.error || t('errors.select'))
        return
      }
      setSelectionSaved(true)
    } catch {
      setErrorMessage(t('errors.select'))
    } finally {
      setSelectionSaving(false)
    }
  }

  const scrollToTryOn = useCallback(() => {
    tryOnSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [])

  useEffect(() => {
    if (!selectionSaved || typeof window === 'undefined') return
    const frame = window.requestAnimationFrame(() => scrollToTryOn())
    return () => window.cancelAnimationFrame(frame)
  }, [selectionSaved, scrollToTryOn])

  useEffect(() => {
    persistRuntimeContinuation()
  }, [persistRuntimeContinuation])

  const handleContinuationBatchId = useCallback((batchId: string) => {
    setResumeBatchId(batchId)
    persistRuntimeContinuation(batchId, resumeTryOnTasks)
  }, [persistRuntimeContinuation, resumeTryOnTasks])

  const handleTryOnTasksChange = useCallback((tasks: MerchantRuntimeTryOnTaskRef[]) => {
    setResumeTryOnTasks((current) => {
      const currentKey = current.map((task) => `${task.merchantFrameId}:${task.taskId}`).sort().join(',')
      const nextKey = tasks.map((task) => `${task.merchantFrameId}:${task.taskId}`).sort().join(',')
      return currentKey === nextKey ? current : tasks
    })
  }, [])

  if (loadState === 'loading') {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="flex items-center gap-2 text-gray-600">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>{t('loading')}</span>
        </div>
      </div>
    )
  }

  if (loadState !== 'ready' || !merchant) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <Store className="mx-auto mb-4 h-10 w-10 text-gray-400" />
        <h1 className="text-2xl font-semibold text-gray-900">{t('errors.unavailableTitle')}</h1>
        <p className="mt-2 text-gray-600">{errorMessage || t('errors.unavailable')}</p>
      </div>
    )
  }

  const currentStep = resolveStoreWorkspaceStep({
    photoReady,
    selectionContinued: selectionSaved,
    tryOnEnabled: merchant.experiencePolicy.tryOnEnabled,
  })
  const maxSelectableFrames = maxSelectableStoreFrames(merchant.experiencePolicy, {
    guestSponsoredTryOnLimit: merchant.guestSponsoredTryOnLimit,
    guestCompareUnlocked,
  })
  const selectedFrames = recommendations.filter((frame) => selectedIds.includes(frame.id))
  const isCampaign = merchant.experience?.type === 'CAMPAIGN'
  const continuationText = (key: string, fallback: string) => t.has(key) ? t(key) : fallback
  const fitProfileCopy: StoreFitProfileCopy = {
    eyebrow: continuationText('fitProfile.eyebrow', 'Lightweight fit guidance'),
    title: continuationText('fitProfile.title', 'Your fit profile'),
    detected: continuationText('fitProfile.detected', '✓ Fit profile detected'),
    analyzing: continuationText('fitProfile.analyzing', 'Building your fit profile…'),
    unavailableTitle: continuationText('fitProfile.unavailableTitle', 'Fit profile not available yet'),
    unavailableBody: continuationText('fitProfile.unavailableBody', 'We could not read a fit profile from this photo, so recommendations use the available frame details.'),
    profileLabel: continuationText('fitProfile.profileLabel', 'Face / fit summary'),
    whyTitle: continuationText('fitProfile.whyTitle', 'Why these frames'),
    mapAlt: continuationText('fitProfile.mapAlt', 'Your photo with a subtle fit map'),
    mapFallback: continuationText('fitProfile.mapFallback', 'Fit map unavailable'),
  }
  const stepChooseFrames = continuationText('steps.chooseFrames', 'Choose frames')
  const stepStartTryOn = continuationText('steps.startTryOn', 'Start Try-On')
  const selectionCtaState = resolveStoreSelectionCtaState({
    selectionContinued: selectionSaved,
    tryOnEnabled: merchant.experiencePolicy.tryOnEnabled,
  })
  const selectionCtaLabel = selectionCtaState === 'continue-to-try-on'
    ? continuationText('recommend.continue', 'Continue to Try-On')
    : selectionCtaState === 'try-on-selected'
      ? (maxSelectableFrames === 1
        ? continuationText('recommend.tryOnThisFrame', 'Try On This Frame')
        : continuationText('recommend.tryOnSelected', 'Try on selected frames'))
      : t('recommend.confirm', { count: selectedIds.length })
  const selectionBusyLabel = selectionCtaState === 'save-selection'
    ? t('recommend.saving')
    : continuationText('recommend.preparing', 'Preparing your try-on…')
  const presentationAcquisition = captureStoreAcquisition()
  const presentationMode = resolvePresentationMode({
    experienceType: merchant.experience?.type || 'STORE',
    persistedPresentationMode: merchant.experience?.presentationMode,
    acquisitionSurface:
      presentationAcquisition.source === 'visutry' && presentationAcquisition.medium === 'internal'
        ? presentationAcquisition.surface
        : null,
  })
  const presentationCopy: ExperiencePresentationCopy = {
    storeLabel: t('experience.storeLabel'),
    campaignLabel: t('experience.campaignLabel'),
    storeSubhead: t('experience.storeSubhead'),
    storeHero: t('experience.storeHero'),
    heroBody: t('experience.heroBody'),
    referenceCatalog: t('experience.referenceCatalog'),
    liveCatalog: t('experience.liveCatalog'),
    featuredEyebrow: t('experience.featuredEyebrow'),
    featuredTitle: t('experience.featuredTitle'),
    featuredDescription: t('experience.featuredDescription'),
    storeCta: t('experience.storeCta'),
    campaignCta: t('experience.campaignCta'),
    actionCta: t('experience.actionCta'),
    ctaSupport: t('experience.ctaSupport'),
    privacyTitle: t('privacy.title'),
    privacyBody: t('privacy.body'),
    privacyPoint1: t('privacy.point1'),
    privacyPoint2: t('privacy.point2'),
    privacyPoint3: t('privacy.point3'),
    privacyPublicNoticeLabel: t('experience.privacyPublicNoticeLabel'),
    privacyPublicNotice: t('privacy.publicPocNotice'),
    privacyAccept: t('privacy.accept'),
    privacyStarting: t('privacy.starting'),
    privacyHint: t('experience.privacyHint'),
    poweredBy: t('experience.poweredBy'),
    uploadTitle: t('upload.title'),
    recommendTitle: t('recommend.title'),
    tryOnTitle: merchant.experiencePolicy.tryOnEnabled ? t('tryOn.title') : t('recommend.title'),
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f7f8fb] text-slate-950">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[540px] bg-[radial-gradient(circle_at_78%_18%,rgba(191,219,254,0.42),transparent_33%),radial-gradient(circle_at_16%_8%,rgba(254,243,199,0.42),transparent_30%)]" />
      <div className="relative mx-auto max-w-[1440px] px-5 pb-10 pt-5 sm:px-8 lg:px-10">
        <header className="flex items-center justify-between gap-3 rounded-3xl border border-white/80 bg-white/75 px-5 py-4 shadow-[0_18px_60px_rgba(15,23,42,0.06)] backdrop-blur-xl sm:px-7">
          <MerchantMark merchant={merchant} accent={accent} />
        </header>

        {!privacyAccepted ? (
          <ExperiencePresentationShell
            mode={presentationMode}
            merchant={merchant}
            accent={accent}
            featuredFrames={merchant.featuredFrames}
            copy={presentationCopy}
            publicPocStorage={publicPocStorage}
            sessionStarting={sessionStarting}
            errorMessage={errorMessage}
            onStartRuntime={handleAcceptPrivacy}
            onShoppingCta={scrollToFeaturedFrames}
            featuredFramesRef={featuredFramesRef}
          />
        ) : (
          <main className="py-7 sm:py-10">
            <section className="mx-auto mb-7 flex max-w-4xl items-center gap-3 rounded-2xl border border-white bg-white/80 p-3 shadow-sm backdrop-blur sm:gap-6 sm:px-5">
              <JourneyStep number={1} label={t('upload.title')} active={currentStep === 1} complete={currentStep > 1} accent={accent} />
              <div className="h-px flex-1 bg-slate-200" />
              <JourneyStep number={2} label={stepChooseFrames} active={currentStep === 2} complete={currentStep > 2} accent={accent} />
              {merchant.experiencePolicy.tryOnEnabled ? <><div className="h-px flex-1 bg-slate-200" /><JourneyStep number={3} label={stepStartTryOn} active={currentStep === 3} complete={false} accent={accent} /></> : null}
            </section>

            <div className={`grid gap-6 ${recommendations.length > 0 ? 'xl:grid-cols-[minmax(0,1fr)_340px]' : ''}`}>
              <div className="space-y-6">
                <section className="overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white p-5 shadow-[0_22px_70px_rgba(15,23,42,0.07)] sm:p-7">
                  <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">Step 1</p>
                      <h1 className="mt-2 font-serif text-2xl font-semibold text-slate-950 sm:text-3xl">{t('upload.title')}</h1>
                      <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">{t('upload.guidance')}</p>
                    </div>
                    <span className="flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700"><ShieldCheck className="h-3.5 w-3.5" />Private session</span>
                  </div>
                  <ImageUpload
                    label={t('upload.label')}
                    description={t('upload.description')}
                    iconType="user"
                    height="h-[340px] sm:h-[460px]"
                    currentImage={photoPreview}
                    loading={photoUploading || recommending}
                    loadingText={photoUploading ? t('upload.uploading') : recommending ? t('recommend.analyzing') : t('upload.uploading')}
                    onImageSelect={handleImageSelect}
                    onImageRemove={handleImageRemove}
                  />
                  {errorMessage ? <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">{errorMessage}</p> : null}
                </section>

                {photoReady && (recommending || recommendations.length > 0) ? (
                  <StoreFitProfile
                    photoPreview={photoPreview || ''}
                    geometry={faceGeometry}
                    detection={faceDetection}
                    analyzing={recommending}
                    copy={fitProfileCopy}
                  />
                ) : null}

                {photoReady && recommending ? (
                  <div className="flex min-h-36 items-center justify-center gap-3 rounded-[2rem] border border-slate-200 bg-white p-7 text-slate-600 shadow-sm">
                    <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                    <span className="font-medium">{t('recommend.analyzing')}</span>
                  </div>
                ) : null}

                {photoReady && !recommending && recommendations.length > 0 ? (
                  <section className="rounded-[2rem] border border-slate-200/80 bg-white p-5 shadow-[0_22px_70px_rgba(15,23,42,0.07)] sm:p-7">
                    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">Step 2 · {stepChooseFrames}</p>
                        <h2 className="mt-2 font-serif text-2xl font-semibold text-slate-950 sm:text-3xl">{t('recommend.title')}</h2>
                        <p className="mt-2 text-sm text-slate-500">{merchant.experiencePolicy.tryOnEnabled ? t('recommend.subtitle', { max: maxSelectableFrames }) : t('recommend.subtitleNoTryOn')}</p>
                      </div>
                      <span className="rounded-full bg-slate-50 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">{t('recommend.curatedLabel')}</span>
                    </div>

                    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {recommendations.map((frame, index) => {
                        const selected = selectedIds.includes(frame.id)
                        const priceLabel = formatPrice(frame.price, frame.currency)
                        return (
                          <li key={frame.id}>
                            <button
                              type="button"
                              onClick={() => toggleFrame(frame.id)}
                              disabled={!selected && selectedIds.length >= maxSelectableFrames}
                              aria-pressed={selected}
                              aria-label={selected ? `Remove ${frame.name}` : `Select ${frame.name}`}
                              className={`group h-full w-full overflow-hidden rounded-2xl border bg-white text-left transition hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60 ${selected ? 'border-transparent shadow-lg' : 'border-slate-200'}`}
                              style={selected ? { boxShadow: `0 0 0 2px ${accent}, 0 16px 35px rgba(15,23,42,0.1)` } : undefined}
                            >
                              <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-b from-white to-slate-50">
                                {frame.imageUrl ? <Image src={frame.imageUrl} alt={frame.name} fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" className="object-contain p-5 transition duration-300 group-hover:scale-[1.04]" /> : <Glasses className="absolute inset-0 m-auto h-10 w-10 text-slate-300" aria-label={t('recommend.imageUnavailable')} />}
                                <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-bold text-slate-600 shadow-sm">#{index + 1}</span>
                                {selected ? <CheckCircle2 className="absolute right-3 top-3 h-6 w-6 rounded-full bg-white" style={{ color: accent }} /> : null}
                              </div>
                              <div className="p-4">
                                <div className="flex items-start justify-between gap-3">
                                  <p className="font-semibold text-slate-900">{frame.name}</p>
                                  <p className="shrink-0 text-right text-sm font-semibold text-slate-900">{priceLabel || t('recommend.priceUnavailable')}</p>
                                </div>
                                <p className="mt-1 text-xs font-medium uppercase tracking-[0.12em] text-slate-400">{frame.productBrand || merchant.name}</p>
                                <p className="mt-1 text-xs capitalize text-slate-400">{[frame.shape, frame.color, frame.widthClass].filter(Boolean).join(' · ')}</p>
                                <p className="mt-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">{continuationText('recommend.reasonLabel', 'Why it fits')}</p>
                                <p className="mt-1 text-xs leading-5 text-slate-600">{frame.reason || continuationText('recommend.reasonFallback', 'Selected from this collection.')}</p>
                              </div>
                            </button>
                          </li>
                        )
                      })}
                    </ul>
                  </section>
                ) : null}

                {recommendations.length > 0 && merchant.experiencePolicy.tryOnEnabled ? (
                  <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm xl:hidden">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-600">{selectionSaved ? continuationText('recommend.readyEyebrow', 'Ready when you are') : 'Step 2'}</p>
                        <p className="mt-1 text-sm text-slate-500">{t('recommend.selectHint', { max: maxSelectableFrames, count: selectedIds.length })}</p>
                      </div>
                      <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-sm font-bold text-blue-700">{selectedIds.length}</span>
                    </div>
                    <button
                      type="button"
                      data-selection-cta="mobile"
                      onClick={selectionSaved ? scrollToTryOn : handleConfirmSelection}
                      disabled={selectedIds.length === 0 || selectionSaving}
                      className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3.5 text-sm font-semibold text-white shadow-lg transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
                      style={{ backgroundColor: accent }}
                    >
                      {selectionSaving ? <><Loader2 className="h-4 w-4 animate-spin" />{selectionBusyLabel}</> : <>{selectionCtaLabel}<ArrowRight className="h-4 w-4" /></>}
                    </button>
                  </div>
                ) : null}

                <div ref={tryOnSectionRef}>
                  {selectionSaved && session && merchant.experiencePolicy.tryOnEnabled ? (
                    <StoreTryOnComparePanel
                      merchantSlug={merchantSlug}
                      experienceType={merchant.experience?.type || 'STORE'}
                      experienceSlug={merchant.experience?.type === 'CAMPAIGN' ? merchant.experience.slug : undefined}
                      locale={locale}
                      merchantSessionId={session.merchantSessionId}
                      selectedFrames={selectedFrames.map((frame) => ({ id: frame.id, name: frame.name, imageUrl: frame.imageUrl, productUrl: frame.productUrl, price: frame.price, currency: frame.currency, shape: frame.shape, productBrand: frame.productBrand }))}
                      photoPreview={photoPreview}
                      accent={accent}
                      experiencePolicy={merchant.experiencePolicy}
                      onError={(message) => setErrorMessage(message || null)}
                      initialBatchId={resumeBatchId}
                      initialTasks={resumeTryOnTasks}
                      onContinuationBatchId={handleContinuationBatchId}
                      onTryOnTasksChange={handleTryOnTasksChange}
                    />
                  ) : null}
                </div>
              </div>

              {recommendations.length > 0 ? (
                <aside className="hidden xl:sticky xl:top-6 xl:block xl:self-start">
                  <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-[0_22px_70px_rgba(15,23,42,0.08)]">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-600">Your shortlist</p>
                        <p className="mt-1 text-sm text-slate-500">{t('recommend.selectHint', { max: maxSelectableFrames, count: selectedIds.length })}</p>
                      </div>
                      <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-sm font-bold text-blue-700">{selectedIds.length}</span>
                    </div>
                    <div className="mt-5 space-y-2.5">
                      {selectedFrames.length > 0 ? selectedFrames.map((frame) => (
                        <div key={frame.id} className="flex items-center gap-3 rounded-2xl bg-slate-50 p-2.5">
                          <div className="relative h-14 w-16 shrink-0 overflow-hidden rounded-xl bg-white">{frame.imageUrl ? <Image src={frame.imageUrl} alt="" fill sizes="64px" className="object-contain p-1.5" /> : null}</div>
                          <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-slate-800">{frame.name}</p><p className="mt-0.5 text-xs uppercase tracking-[0.1em] text-slate-400">{frame.productBrand || merchant.name}</p></div>
                          <CheckCircle2 className="h-4 w-4 shrink-0" style={{ color: accent }} />
                        </div>
                      )) : <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-8 text-center text-xs leading-5 text-slate-400">Select the frames you want to see on your photo.</div>}
                    </div>
                    {selectedIds.length >= maxSelectableFrames ? <p className="mt-4 rounded-xl bg-amber-50 px-3 py-2.5 text-xs leading-5 text-amber-900" role="status">{t('recommend.limitReached', { max: maxSelectableFrames })}</p> : null}
                    <button
                      type="button"
                      data-selection-cta="desktop"
                      onClick={selectionSaved ? scrollToTryOn : handleConfirmSelection}
                      disabled={selectedIds.length === 0 || selectionSaving}
                      className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3.5 text-sm font-semibold text-white shadow-lg transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
                      style={{ backgroundColor: accent }}
                    >
                      {selectionSaving ? <><Loader2 className="h-4 w-4 animate-spin" />{selectionBusyLabel}</> : <>{selectionCtaLabel}<ArrowRight className="h-4 w-4" /></>}
                    </button>
                    {selectionSaved ? <div className="mt-4 flex gap-2 rounded-2xl bg-emerald-50 p-3 text-sm text-emerald-800"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /><div><p className="font-semibold">{continuationText('recommend.readyTitle', 'Frames ready')}</p>{merchant.experiencePolicy.tryOnEnabled ? <p className="mt-0.5 text-xs leading-5">{continuationText('recommend.readyBody', 'Continue below to start your virtual try-on.')}</p> : null}</div></div> : null}
                  </div>
                </aside>
              ) : null}
            </div>

            {isCampaign ? (
              <section className="mt-8 rounded-[2rem] border border-slate-200/80 bg-white p-5 shadow-sm sm:p-7">
                <div className="mt-3 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <h2 className="font-serif text-2xl font-semibold text-slate-950 sm:text-3xl">{continuationText('continuation.title', 'Explore the full collection')}</h2>
                  </div>
                  <Link
                    href={`/${locale}/store/${merchantSlug}${storeContinuationQuery}`}
                    className="inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-800 transition hover:border-blue-300 hover:text-blue-700"
                  >
                    {continuationText('continuation.cta', 'Visit the full Store')}
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </div>
              </section>
            ) : null}

          </main>
        )}
      </div>
    </div>
  )
}
