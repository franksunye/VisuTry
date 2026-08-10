import { getVisualSeoAssetsForPage, type VisualSeoAsset } from '@/config/visual-seo-assets'
import { VisualSeoAsset as VisualSeoAssetView } from '@/components/seo/VisualSeoAsset'

type B03VisualSeoPage =
  | '/try-glasses-on-photo'
  | '/compare-glasses-frames'
  | '/ai-glasses-advisor'

type B03VisualSeoSectionsProps = {
  locale: string
  pagePath: B03VisualSeoPage
}

function getAsset(assets: readonly VisualSeoAsset[], id: string) {
  const asset = assets.find((item) => item.id === id)
  if (!asset) throw new Error(`Missing B03 Visual SEO asset: ${id}`)
  return asset
}

/**
 * B03 follows the page-level density budget established by B01/B02.
 * A route may have only one dominant Visual SEO asset across all batches.
 * Later-batch assets remain supporting education, especially on mobile.
 */
export function B03VisualSeoSections({ locale, pagePath }: B03VisualSeoSectionsProps) {
  if (locale !== 'en') return null

  const assets = getVisualSeoAssetsForPage(pagePath, 'B03')
  if (assets.length === 0) return null

  // VSEO-016 from B02 already owns the dominant visual slot on this page.
  // Keep both B03 comparisons subordinate on desktop and compact on mobile.
  if (pagePath === '/try-glasses-on-photo') {
    return (
      <section className="mt-5 sm:mt-6" aria-label="Additional glasses photo comparisons">
        <div className="grid gap-4 md:grid-cols-2">
          {assets.map((asset) => (
            <VisualSeoAssetView key={asset.id} asset={asset} variant="compact" />
          ))}
        </div>
      </section>
    )
  }

  if (pagePath === '/compare-glasses-frames') {
    const primaryAsset = getAsset(assets, 'VSEO-019')
    const supportingAssets = [getAsset(assets, 'VSEO-020'), getAsset(assets, 'VSEO-021')]

    return (
      <section className="mt-14 space-y-5 sm:space-y-6" aria-label="Visual frame comparison guides">
        <VisualSeoAssetView asset={primaryAsset} variant="editorial" headingDisplay="sr-only" />
        <div className="grid gap-4 md:grid-cols-2">
          {supportingAssets.map((asset) => (
            <VisualSeoAssetView key={asset.id} asset={asset} variant="compact" />
          ))}
        </div>
      </section>
    )
  }

  // Recommendation outcome is the dominant advisor visual. Analysis and the
  // broader workflow stay supporting so the page does not become an infographic stack.
  const primaryAsset = getAsset(assets, 'VSEO-023')
  const supportingAssets = [getAsset(assets, 'VSEO-022'), getAsset(assets, 'VSEO-024')]

  return (
    <section className="mt-14 space-y-5 sm:space-y-6" aria-label="Visual AI glasses advisor guides">
      <VisualSeoAssetView asset={primaryAsset} variant="editorial" headingDisplay="sr-only" />
      <div className="grid gap-4 md:grid-cols-2">
        {supportingAssets.map((asset) => (
          <VisualSeoAssetView key={asset.id} asset={asset} variant="compact" />
        ))}
      </div>
    </section>
  )
}
