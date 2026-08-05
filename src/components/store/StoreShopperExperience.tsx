'use client'

import { useCallback, useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { CheckCircle2, Loader2, ShieldCheck, Sparkles, Store } from 'lucide-react'
import { ImageUpload } from '@/components/upload/ImageUpload'

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

type StoreShopperExperienceProps = {
  merchantSlug: string
  locale: string
}

type LoadState = 'loading' | 'ready' | 'unavailable' | 'error'

export function StoreShopperExperience({
  merchantSlug,
  locale,
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
      const deviceType =
        typeof window !== 'undefined' && window.matchMedia('(max-width: 768px)').matches
          ? 'mobile'
          : 'desktop'

      const res = await fetch('/api/store/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchantSlug,
          locale,
          deviceType,
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
        sessionStorage.setItem(
          `vt_store_session:${merchantSlug}`,
          JSON.stringify(next),
        )
      } catch {
        // sessionStorage may be unavailable
      }
      return next
    } catch {
      setErrorMessage(t('errors.session'))
      return null
    } finally {
      setSessionStarting(false)
    }
  }, [session, merchantSlug, locale, t])

  const handleAcceptPrivacy = async () => {
    const created = await ensureSession()
    if (created) {
      setPrivacyAccepted(true)
    }
  }

  const handleImageSelect = async (file: File, preview: string) => {
    setPhotoPreview(preview)
    setPhotoReady(false)
    setErrorMessage(null)

    const activeSession = await ensureSession()
    if (!activeSession) return

    setPhotoUploading(true)
    try {
      const deviceType =
        typeof window !== 'undefined' && window.matchMedia('(max-width: 768px)').matches
          ? 'mobile'
          : 'desktop'

      const formData = new FormData()
      formData.set('photo', file)
      formData.set('merchantSlug', merchantSlug)
      formData.set('merchantSessionId', activeSession.merchantSessionId)
      formData.set('locale', locale)
      formData.set('deviceType', deviceType)

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
    <div className="mx-auto max-w-xl px-4 py-8 sm:py-12">
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
              loading={photoUploading}
              loadingText={t('upload.uploading')}
              onImageSelect={handleImageSelect}
              onImageRemove={handleImageRemove}
            />
            {errorMessage && (
              <p className="mt-3 text-sm text-red-600" role="alert">
                {errorMessage}
              </p>
            )}
          </div>

          {photoReady && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                <div className="flex-1">
                  <p className="font-medium text-emerald-900">{t('upload.readyTitle')}</p>
                  <p className="mt-1 text-sm text-emerald-800">{t('upload.readyBody')}</p>
                  <button
                    type="button"
                    disabled
                    className="mt-4 flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-lg bg-gray-300 px-4 py-3 text-sm font-semibold text-gray-600"
                    title={t('upload.nextComingSoon')}
                  >
                    <Sparkles className="h-4 w-4" />
                    {t('upload.nextComingSoon')}
                  </button>
                </div>
              </div>
            </div>
          )}

          <p className="text-center text-xs text-gray-500">{t('noCreditsNote')}</p>
        </section>
      )}
    </div>
  )
}
