import { getVisualSeoAssetsForPage, type VisualSeoAsset, type VisualSeoAssetStage } from '@/config/visual-seo-assets'
import { VisualSeoAsset as VisualSeoAssetView } from '@/components/seo/VisualSeoAsset'

export const B04_VISUAL_SEO_PAGES = ['/style/round-face', '/style/oval-face', '/style/square-face'] as const
export type B04VisualSeoPage = (typeof B04_VISUAL_SEO_PAGES)[number]

type B04VisualSeoSectionsProps = {
  locale: string
  pagePath: B04VisualSeoPage
  stage: VisualSeoAssetStage
}

function getStageAsset(assets: readonly VisualSeoAsset[], stage: VisualSeoAssetStage) {
  const asset = assets.find((item) => item.stage === stage)
  if (!asset) throw new Error(`Missing B04 Visual SEO asset for stage: ${stage}`)
  return asset
}

/**
 * B04 gives each English Face Style owner page one visual answer per decision
 * stage: recommendation, A/B comparison, and fit/proportion guidance.
 * Each stage is rendered independently so the images can sit beside the page's
 * existing recommendation, workflow, and decision copy rather than becoming a gallery.
 */
export function B04VisualSeoSections({ locale, pagePath, stage }: B04VisualSeoSectionsProps) {
  if (locale !== 'en') return null

  const assets = getVisualSeoAssetsForPage(pagePath, 'B04')
  if (assets.length === 0) return null

  const asset = getStageAsset(assets, stage)
  const label = stage === 'hero'
    ? 'Face shape frame recommendations'
    : stage === 'compare'
      ? 'Face shape frame comparisons'
      : 'Face shape frame fit guidance'

  return (
    <section className="mt-12 sm:mt-14" aria-label={label}>
      <VisualSeoAssetView asset={asset} variant="owner-editorial" />
    </section>
  )
}
