import { getVisualSeoAssetsForPage } from '@/config/visual-seo-assets'
import { VisualSeoAsset } from '@/components/seo/VisualSeoAsset'

type B01VisualSeoPage = '/face-shape-detector' | '/what-is-my-face-shape' | '/what-glasses-suit-my-face'

type B01VisualSeoSectionsProps = {
  locale: string
  pagePath: B01VisualSeoPage
}

/**
 * Render English B01 visual-answer blocks on their canonical pages only.
 * Acquisition pages keep one dominant Visual SEO asset; additional assets are supporting visuals.
 * B01 primary masters already carry a prominent in-image headline, so the equivalent HTML h2
 * remains semantic/accessibility content without being visually repeated above the image.
 */
export function B01VisualSeoSections({ locale, pagePath }: B01VisualSeoSectionsProps) {
  if (locale !== 'en') return null

  const assets = getVisualSeoAssetsForPage(pagePath, 'B01')
  if (assets.length === 0) return null

  const [primaryAsset, ...supportingAssets] = assets

  return (
    <section className="mt-12 space-y-5 sm:space-y-6" aria-label="Visual face shape guides">
      <VisualSeoAsset asset={primaryAsset} headingDisplay="sr-only" />
      {supportingAssets.length === 1 ? (
        <VisualSeoAsset asset={supportingAssets[0]} variant="supporting-wide" />
      ) : supportingAssets.length > 1 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {supportingAssets.map((asset) => (
            <VisualSeoAsset key={asset.id} asset={asset} variant="compact" />
          ))}
        </div>
      ) : null}
    </section>
  )
}
