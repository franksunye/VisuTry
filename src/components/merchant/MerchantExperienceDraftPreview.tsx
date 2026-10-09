'use client'
import { useEffect, useRef, useState } from 'react'
import { brandAccentForDisplay } from '@/modules/merchant/domain/merchant-brand-kit'
import { publicMerchantImageUrl } from '@/lib/is-loopback-image-url'
import { ExperiencePresentationShell, type ExperiencePresentationCopy, type PresentationFrame } from '@/components/store/ExperiencePresentationShell'
import { resolveMerchantHandoff } from '@/modules/store/domain/merchant-handoff'
import type { DecisionJourneyStage } from '@/modules/store/domain/decision-journey'
import type { ExperienceConfigurationDraft } from './MerchantExperienceConfiguration'

export type ShopperDraftPreviewContext = {
  experienceType: 'STORE' | 'CAMPAIGN'
  merchantId: string
  experienceId: string
  merchantName: string
  experienceName: string
  headline: string | null
  description: string | null
  frames: PresentationFrame[]
}
const PREVIEW_COPY: ExperiencePresentationCopy = {
  storeLabel: 'Store', campaignLabel: 'Campaign', storeSubhead: 'Discover selected eyewear.',
  storeHero: 'Find your next pair of glasses', heroBody: 'Explore curated frames.',
  referenceCatalog: 'Selected frames', liveCatalog: 'Selected frames',
  featuredEyebrow: 'Collection', featuredTitle: 'Explore the collection',
  featuredDescription: 'Selected eyewear.', storeCta: 'Browse the collection',
  campaignCta: 'Browse the collection', actionCta: 'Get personalized recommendations',
  ctaSupport: 'Read-only preview · shopping actions are disabled.',
  privacyTitle: 'Your photo stays in your control',
  privacyBody: 'A privacy notice is shown before starting the experience.',
  privacyPoint1: 'No photo is uploaded in this preview.',
  privacyPoint2: 'This preview does not create a shopper session.',
  privacyPoint3: 'Shopping actions are disabled.',
  privacyPublicNoticeLabel: 'Read-only', privacyPublicNotice: 'No data is collected.',
  privacyAccept: 'Continue', privacyStarting: 'Starting…',
  privacyHint: 'Preview only · no shopper data is collected',
  poweredBy: 'Powered by VisuTry', uploadTitle: 'Upload your photo',
  recommendTitle: 'Recommendations', tryOnTitle: 'Virtual Try-On',
}
const RESULT_STAGES: Partial<Record<DecisionJourneyStage, [string, string]>> = {
  FIT_PROFILE: ['Fit profile', 'Fit information appears when available after face analysis.'],
  TRY_ON: ['Virtual looks', 'Generated looks appear after the shopper chooses frames.'],
  COMPARE: ['Compare frames', 'Compared frames appear after the shopper selects favorites.'],
}
export function MerchantExperienceDraftPreview({
  value, context, effectiveStages, kioskEnabled,
}: {
  value: ExperienceConfigurationDraft
  context: ShopperDraftPreviewContext
  effectiveStages: DecisionJourneyStage[]
  kioskEnabled: boolean
}) {
  const framesRef = useRef<HTMLElement>(null)
  const [brand, setBrand] = useState<{ logoUrl: string | null; accentColor: string | null; heroAssetUrl: string | null }>({ logoUrl: null, accentColor: null, heroAssetUrl: null })
  useEffect(() => {
    let cancelled = false
    const base = `/api/merchant/${encodeURIComponent(context.merchantId)}/brand`
    Promise.all([
      fetch(base, { cache: 'no-store' }).then(r => r.ok ? r.json() : null),
      fetch(`${base}/hero?experienceId=${encodeURIComponent(context.experienceId)}`, { cache: 'no-store' }).then(r => r.ok ? r.json() : null),
    ]).then(([merchant, hero]) => {
      if (cancelled) return
      setBrand({
        logoUrl: publicMerchantImageUrl(merchant?.data?.logoUrl ?? null),
        accentColor: merchant?.data?.accentColor ?? null,
        heroAssetUrl: publicMerchantImageUrl(hero?.data?.heroAssetUrl ?? null),
      })
    }).catch(() => { /* Keep the private preview safely unbranded if reads fail. */ })
    return () => { cancelled = true }
  }, [context.merchantId, context.experienceId])
  const handoffs = [value.primaryHandoff, value.secondaryHandoff]
    .map((handoff) => resolveMerchantHandoff({ type: handoff.action || null, label: handoff.label, url: handoff.url }))
    .filter((handoff) => handoff !== null)

  return <div data-testid="unsaved-shopper-visual-preview" data-draft-only="true" className="mt-4 overflow-hidden rounded-xl border border-blue-100 bg-white">
    <div className="border-b border-slate-100 px-4 py-3">
      <h4 className="text-sm font-semibold text-slate-900">Shopper page · unsaved visual preview</h4>
      <p className="mt-1 text-xs text-slate-600">Current form values in the shared shopper presentation renderer. No publishing, session, photo upload or AI generation.</p>
    </div>
    <div className="px-4 pb-4">
      <ExperiencePresentationShell
        mode={value.presentationMode}
        merchant={{
          name: context.merchantName, logoUrl: brand.logoUrl, referenceData: false,
          activeFrameCount: context.frames.length,
          experience: {
            type: context.experienceType,
            name: context.experienceName,
            headline: context.headline,
            description: context.description,
            heroAssetUrl: brand.heroAssetUrl ?? context.frames[0]?.imageUrl ?? null,
          },
        }}
        accent={brandAccentForDisplay(brand.accentColor)} featuredFrames={context.frames} copy={PREVIEW_COPY}
        publicPocStorage={false} sessionStarting={false} errorMessage={null}
        onStartRuntime={() => undefined} onShoppingCta={() => undefined}
        featuredFramesRef={framesRef} showRuntimeCta={false}
        runtimeBlocked compact heroHeadingLevel={2}
      />
      <section aria-label="Shopper result layout preview" className="mt-3 space-y-2 border-t border-slate-200 pt-4">
        <h4 className="font-serif text-lg font-semibold text-slate-950">Your eyewear result</h4>
        <p className="text-xs text-slate-500">Layout only. No face analysis, recommendation or generated look is simulated.</p>
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
          <p className="text-sm font-semibold text-slate-900">Recommended frames</p>
          <p className="mt-1 text-xs text-slate-600">Recommendations appear after the shopper completes face analysis.</p>
        </div>
        {effectiveStages.filter((stage) => stage in RESULT_STAGES).map((stage) => (
          <div key={stage} data-preview-stage={stage} className="rounded-lg border border-slate-200 p-3">
            <p className="text-sm font-semibold text-slate-900">{RESULT_STAGES[stage]?.[0]}</p>
            <p className="mt-1 text-xs text-slate-600">{RESULT_STAGES[stage]?.[1]}</p>
          </div>
        ))}
        {handoffs.length ? <div aria-label="Shopper handoff preview" className="flex flex-wrap gap-2">
          {handoffs.map((handoff, index) => <span key={index} className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-800">{handoff.label}</span>)}
        </div> : null}
        <p className="text-xs text-slate-500">{kioskEnabled ? 'Kiosk delivery with idle reset and phone handoff.' : 'Web delivery. Kiosk is not enabled.'}</p>
      </section>
    </div>
  </div>
}
