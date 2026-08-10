import { getVisualSeoAssetsForPage } from '@/config/visual-seo-assets'
import { VisualSeoAsset } from '@/components/seo/VisualSeoAsset'

type B01VisualSeoPage = '/face-shape-detector' | '/what-is-my-face-shape' | '/what-glasses-suit-my-face'

type B01VisualSeoSectionsProps = {
  locale: string
  pagePath: B01VisualSeoPage
}

/** Render the English B01 visual-answer blocks on their canonical pages only. */
export function B01VisualSeoSections({ locale, pagePath }: B01VisualSeoSectionsProps) {
  if (locale !== 'en') return null

  const assets = getVisualSeoAssetsForPage(pagePath)
  return (
    <section className="mt-12 space-y-8" aria-label="Visual face shape guides">
      {assets.map((asset) => (
        <VisualSeoAsset key={asset.id} asset={asset} />
      ))}
    </section>
  )
}
