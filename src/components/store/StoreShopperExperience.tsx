'use client'

import { useCallback, useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import {
  CheckCircle2,
  Loader2,
  ShieldCheck,
  Store,
} from 'lucide-react'
import { ImageUpload } from '@/components/upload/ImageUpload'
import { StoreTryOnComparePanel } from '@/components/store/StoreTryOnComparePanel'
import { analyzeFaceLandmarkFile } from '@/lib/face-landmark-client'

type MerchantProfile = {
  id: string
  slug: string
  name: string
  logoUrl: string | null
  websiteUrl: string | null
  accentColor: string | null
  activeFrameCount: number
}

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
  score: number
  reason: string
}

type StoreShopperExperienceProps = {
  merchantSlug: string
  locale: string
  publicPocStorage: boolean
}

type LoadState = 'loading' | 'ready' | 'unavailable' | 'error'

const MAX_SELECT = 4

function deviceTypeLabel(): string {
  if (typeof window === 'undefined') return 'desktop'
  return window.matchMedia('(max-width: 768px)').matches ? 'mobile' : 'desktop'
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

export function StoreShopperExperience({
  merchantSlug,
  locale,
  publicPocStorage,
}: StoreShopperExperienceProps) {
  const t = useTranslations('storeShopper')
  const [loadState, setLoadState] = useState<LoadState>('loading')
  const [merchant, setMerchant] = useState<MerchantProfile | null>(null)
  const [privacyAccepted, setPrivacyAccepted] = useState(false)
  const [session, setSession] = useState<SessionState | null>(null)
  const [sessionStarting, setSessionStarting] = useState(false)
  const [photoPreview, setPhotoPreview] = useState<string | undefined>()
  const [photoUploading, setPhotoUploading] = useState(false)
  const [photoReady, setPhotoReady] = useState(false)
  const [recommending, setRecommending] = useState(false)
  const [recommendations, setRecommendations] = useState<RecommendedFrame[]>([])
  const [rankingVersion, setRankingVersion] = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [selectionSaving, setSelectionSaving] = useState(false)
  const [selectionSaved, setSelectionSaved] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const accent = merchant?.accentColor || '#1F4B5A'

  useEffect(() => {
    let cancelled = false

    async function loadMerchant() {
      setLoadState('loading')
      setErrorMessage(null)
      try {
        const res = await fetch(`/api/store/merchants/${encodeURIComponent(merchantSlug)}`)
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
  }, [merchantSlug, t])

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
          locale,
          deviceType: deviceTypeLabel(),
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
        sessionStorage.setItem(`vt_store_session:${merchantSlug}`, JSON.stringify(next))
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
  }, [session, merchantSlug, locale, t])

  const runRecommendations = useCallback(
    async (activeSession: SessionState, file: File) => {
      setRecommending(true)
      setErrorMessage(null)
      setRecommendations([])
      setSelectedIds([])
      setSelectionSaved(false)

      let measuredShape: string | undefined
      let faceAspectRatio: number | undefined

      try {
        const landmark = await analyzeFaceLandmarkFile(file)
        if (landmark.geometry.status === 'measured') {
          measuredShape = landmark.geometry.measuredShape
          faceAspectRatio = landmark.geometry.ratios?.faceAspectRatio
        }
      } catch {
        // Fall back to catalog-only ranking when on-device analysis fails.
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
        setRankingVersion(json.data.rankingVersion || null)
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

  const handleImageSelect = async (file: File, preview: string) => {
    setPhotoPreview(preview)
    setPhotoReady(false)
    setRecommendations([])
    setSelectedIds([])
    setSelectionSaved(false)
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
    setPhotoPreview(undefined)
    setPhotoReady(false)
    setRecommendations([])
    setSelectedIds([])
    setSelectionSaved(false)
  }

  const toggleFrame = (frameId: string) => {
    setSelectionSaved(false)
    setSelectedIds((current) => {
      if (current.includes(frameId)) {
        return current.filter((id) => id !== frameId)
      }
      if (current.length >= MAX_SELECT) return current
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

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:py-12">
      <header className="mb-8 text-center">
        <div className="mb-4 flex justify-center">
          {merchant.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={merchant.logoUrl}
              alt={merchant.name}
              className="h-16 w-16 rounded-full object-cover shadow-sm ring-2 ring-white"
            />
          ) : (
            <div
              className="flex h-16 w-16 items-center justify-center rounded-full text-white shadow-sm"
              style={{ backgroundColor: accent }}
            >
              <Store className="h-7 w-7" />
            </div>
          )}
        </div>
        <p className="text-sm font-medium uppercase tracking-wide text-gray-500">
          {t('brandedBy', { merchant: merchant.name })}
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
          {merchant.name}
        </h1>
        <p className="mt-3 text-base text-gray-600">{t('headline')}</p>
        <p className="mt-2 text-sm text-gray-500">
          {t('catalogHint', { count: merchant.activeFrameCount })}
        </p>
      </header>

      {!privacyAccepted ? (
        <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-4 flex items-start gap-3">
            <ShieldCheck className="mt-0.5 h-6 w-6 shrink-0" style={{ color: accent }} />
            <div>
              <h2 className="text-lg font-semibold text-gray-900">{t('privacy.title')}</h2>
              <p className="mt-2 text-sm leading-relaxed text-gray-600">{t('privacy.body')}</p>
              <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-gray-600">
                <li>{t('privacy.point1')}</li>
                <li>{t('privacy.point2')}</li>
                <li>{t('privacy.point3')}</li>
              </ul>
              {publicPocStorage ? (
                <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm leading-relaxed text-amber-900">
                  {t('privacy.publicPocNotice')}
                </p>
              ) : null}
            </div>
          </div>
          {errorMessage && (
            <p className="mb-3 text-sm text-red-600" role="alert">
              {errorMessage}
            </p>
          )}
          <button
            type="button"
            onClick={handleAcceptPrivacy}
            disabled={sessionStarting}
            className="flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            style={{ backgroundColor: accent }}
          >
            {sessionStarting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {t('privacy.starting')}
              </>
            ) : (
              t('privacy.accept')
            )}
          </button>
        </section>
      ) : (
        <section className="space-y-5">
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="mb-1 text-lg font-semibold text-gray-900">{t('upload.title')}</h2>
            <p className="mb-4 text-sm text-gray-600">{t('upload.guidance')}</p>
            <ImageUpload
              label={t('upload.label')}
              description={t('upload.description')}
              iconType="user"
              currentImage={photoPreview}
              loading={photoUploading || recommending}
              loadingText={
                photoUploading
                  ? t('upload.uploading')
                  : recommending
                    ? t('recommend.analyzing')
                    : t('upload.uploading')
              }
              onImageSelect={handleImageSelect}
              onImageRemove={handleImageRemove}
            />
            {errorMessage && (
              <p className="mt-3 text-sm text-red-600" role="alert">
                {errorMessage}
              </p>
            )}
          </div>

          {photoReady && recommending && (
            <div className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white p-6 text-gray-600">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>{t('recommend.analyzing')}</span>
            </div>
          )}

          {photoReady && !recommending && recommendations.length > 0 && (
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-gray-900">{t('recommend.title')}</h2>
                <p className="mt-1 text-sm text-gray-600">{t('recommend.subtitle')}</p>
                {rankingVersion && (
                  <p className="mt-1 text-xs text-gray-400">{t('recommend.version', { version: rankingVersion })}</p>
                )}
              </div>

              <ul className="grid gap-3 sm:grid-cols-2">
                {recommendations.map((frame) => {
                  const selected = selectedIds.includes(frame.id)
                  const priceLabel = formatPrice(frame.price, frame.currency)
                  return (
                    <li key={frame.id}>
                      <button
                        type="button"
                        onClick={() => toggleFrame(frame.id)}
                        className={`w-full rounded-xl border p-3 text-left transition ${
                          selected
                            ? 'border-transparent ring-2'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        style={selected ? { boxShadow: `0 0 0 2px ${accent}` } : undefined}
                      >
                        <div className="flex gap-3">
                          <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                            {frame.imageUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={frame.imageUrl}
                                alt={frame.name}
                                className="h-full w-full object-cover"
                              />
                            ) : null}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-2">
                              <p className="truncate font-medium text-gray-900">{frame.name}</p>
                              {selected && (
                                <CheckCircle2 className="h-5 w-5 shrink-0" style={{ color: accent }} />
                              )}
                            </div>
                            <p className="mt-0.5 text-xs capitalize text-gray-500">
                              {[frame.shape, frame.color, frame.widthClass].filter(Boolean).join(' · ')}
                            </p>
                            {priceLabel && (
                              <p className="mt-0.5 text-sm font-medium text-gray-800">{priceLabel}</p>
                            )}
                            <p className="mt-2 text-xs leading-snug text-gray-600">{frame.reason}</p>
                          </div>
                        </div>
                      </button>
                    </li>
                  )
                })}
              </ul>

              <div className="mt-5 space-y-3">
                <p className="text-sm text-gray-600">
                  {t('recommend.selectHint', { max: MAX_SELECT, count: selectedIds.length })}
                </p>
                <button
                  type="button"
                  onClick={handleConfirmSelection}
                  disabled={selectedIds.length === 0 || selectionSaving}
                  className="flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                  style={{ backgroundColor: accent }}
                >
                  {selectionSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {t('recommend.saving')}
                    </>
                  ) : (
                    t('recommend.confirm', { count: selectedIds.length })
                  )}
                </button>

                {selectionSaved && session && (
                  <div className="space-y-4">
                    <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                        <div>
                          <p className="font-medium text-emerald-900">{t('recommend.savedTitle')}</p>
                          <p className="mt-1 text-sm text-emerald-800">{t('recommend.savedBody')}</p>
                        </div>
                      </div>
                    </div>
                    <StoreTryOnComparePanel
                      merchantSlug={merchantSlug}
                      locale={locale}
                      merchantSessionId={session.merchantSessionId}
                      selectedFrames={recommendations
                        .filter((frame) => selectedIds.includes(frame.id))
                        .map((frame) => ({
                          id: frame.id,
                          name: frame.name,
                          imageUrl: frame.imageUrl,
                          productUrl: frame.productUrl,
                          price: frame.price,
                          currency: frame.currency,
                          shape: frame.shape,
                        }))}
                      photoPreview={photoPreview}
                      accent={accent}
                      onError={(message) => setErrorMessage(message || null)}
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          <p className="text-center text-xs text-gray-500">{t('noCreditsNote')}</p>
        </section>
      )}
    </div>
  )
}
