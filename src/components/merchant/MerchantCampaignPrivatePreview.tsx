'use client'

import { useRef } from 'react'
import { ExperiencePresentationShell, type ExperiencePresentationCopy, type PresentationMerchant } from '@/components/store/ExperiencePresentationShell'
import type { CampaignReadModel } from '@/modules/store/application/campaign-service'

const CAMPAIGN_PREVIEW_COPY: ExperiencePresentationCopy = {
  storeLabel: 'Campaign preview',
  campaignLabel: 'Campaign preview',
  storeSubhead: 'A private preview of the Campaign your shoppers will see.',
  storeHero: 'Explore this Campaign',
  heroBody: 'A focused selection of eyewear.',
  referenceCatalog: 'Catalog',
  liveCatalog: 'Campaign',
  featuredEyebrow: 'Campaign products',
  featuredTitle: 'Explore the selection',
  featuredDescription: 'Products selected for this Campaign.',
  storeCta: 'Explore products',
  campaignCta: 'Explore products',
  actionCta: 'Explore products',
  ctaSupport: 'Private preview — no shopper session is started.',
  privacyTitle: 'Private Campaign preview',
  privacyBody: 'This preview is only visible to you until you publish.',
  privacyPoint1: 'No shopper session is started.',
  privacyPoint2: 'Publishing is still a separate decision.',
  privacyPoint3: 'The saved Campaign products appear below.',
  privacyPublicNoticeLabel: 'Draft visibility',
  privacyPublicNotice: 'Anonymous shoppers cannot access this draft.',
  privacyAccept: 'Continue',
  privacyStarting: 'Starting…',
  privacyHint: 'Private draft preview',
  poweredBy: 'Powered by VisuTry',
  uploadTitle: 'Shopper photo',
  recommendTitle: 'Recommendations',
  tryOnTitle: 'Try on',
}

type CampaignDate = Date | string | null
type PreviewCampaign = Omit<CampaignReadModel, 'startAt' | 'endAt'> & { startAt: CampaignDate; endAt: CampaignDate }

export function MerchantCampaignPrivatePreview({ campaign, merchantName }: { campaign: PreviewCampaign; merchantName: string }) {
  const featuredFramesRef = useRef<HTMLElement>(null)
  const merchant: PresentationMerchant = {
    name: merchantName,
    logoUrl: null,
    referenceData: campaign.referenceData,
    activeFrameCount: campaign.selectedFrames.length,
    experience: {
      type: 'CAMPAIGN',
      name: campaign.name,
      headline: campaign.headline,
      description: campaign.description,
      heroAssetUrl: campaign.selectedFrames.find((frame) => frame.imageUrl)?.imageUrl ?? null,
    },
  }
  const frames = campaign.selectedFrames.filter((frame) => frame.name).map((frame) => ({
    id: frame.id,
    name: frame.name ?? 'Campaign product',
    imageUrl: frame.imageUrl,
    shape: frame.shape ?? '',
    color: null,
    productBrand: frame.brand,
  }))

  return <section data-testid="campaign-private-preview" className="overflow-hidden rounded-xl border border-slate-200 bg-[#f7f8fb]" aria-label="Private Campaign preview">
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-white px-4 py-3">
      <div><p className="text-xs font-bold uppercase tracking-[0.15em] text-blue-700">Private draft preview</p><p className="mt-0.5 text-sm font-semibold text-slate-950">{campaign.name}</p></div>
      <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">DRAFT · not public</span>
    </div>
    <div className="px-3 sm:px-5">
      <ExperiencePresentationShell
        mode={campaign.presentationMode}
        merchant={merchant}
        accent="#1d4ed8"
        featuredFrames={frames}
        copy={CAMPAIGN_PREVIEW_COPY}
        publicPocStorage={false}
        sessionStarting={false}
        errorMessage={null}
        onStartRuntime={() => undefined}
        onShoppingCta={() => featuredFramesRef.current?.scrollIntoView({ behavior: 'smooth' })}
        featuredFramesRef={featuredFramesRef}
        showRuntimeCta={false}
        featuredFrameLimit={null}
      />
    </div>
  </section>
}
