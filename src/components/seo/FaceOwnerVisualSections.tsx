import { getVisualSeoAssetsForPage, type VisualSeoAsset, type VisualSeoAssetBatch, type VisualSeoAssetStage } from '@/config/visual-seo-assets'
import { VisualSeoAsset as VisualSeoAssetView } from '@/components/seo/VisualSeoAsset'

export type FaceOwnerVisualBatch = Extract<VisualSeoAssetBatch, 'B04' | 'B05'>

type FaceOwnerVisualSectionsProps = {
  locale: string
  pagePath: string
  batch: FaceOwnerVisualBatch
  stage: VisualSeoAssetStage
}

function getStageAsset(assets: readonly VisualSeoAsset[], stage: VisualSeoAssetStage, batch: FaceOwnerVisualBatch) {
  const asset = assets.find((item) => item.stage === stage)
  if (!asset) throw new Error(`Missing ${batch} Visual SEO asset for stage: ${stage}`)
  return asset
}

/**
 * Shared rendering module for Face Style owner batches. Each owner page gets
 * one full editorial visual at each decision stage: recommendation, comparison,
 * and fit/proportion guidance.
 */
export function FaceOwnerVisualSections({ locale, pagePath, batch, stage }: FaceOwnerVisualSectionsProps) {
  if (locale !== 'en') return null

  const assets = getVisualSeoAssetsForPage(pagePath, batch)
  if (assets.length === 0) return null

  const asset = getStageAsset(assets, stage, batch)
  const label = stage === 'hero'
    ? 'Face shape frame recommendations'
    : stage === 'compare'
      ? 'Face shape frame comparisons'
      : 'Face shape frame fit guidance'

  return (
    <section className="mt-12 sm:mt-14" aria-label={label}>
      <VisualSeoAssetView asset={asset} variant="owner-editorial" headingDisplay="sr-only" />
    </section>
  )
}
