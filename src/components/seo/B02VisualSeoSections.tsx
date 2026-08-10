import { getVisualSeoAssetsForPage } from '@/config/visual-seo-assets'
import { VisualSeoAsset } from '@/components/seo/VisualSeoAsset'

type B02VisualSeoPage =
  | '/what-glasses-suit-my-face'
  | '/find-glasses-for-my-face'
  | '/virtual-glasses-try-on'
  | '/try-glasses-on-photo'

type B02VisualSeoSectionsProps = {
  locale: string
  pagePath: B02VisualSeoPage
}

/** Render B02 as editorial answer blocks, not UI cards or a gallery. */
export function B02VisualSeoSections({ locale, pagePath }: B02VisualSeoSectionsProps) {
  if (locale !== 'en') return null

  const assets = getVisualSeoAssetsForPage(pagePath, 'B02')
  return (
    <section className="mt-14 space-y-16" aria-label="Visual glasses guides">
      {assets.map((asset) => (
        <VisualSeoAsset key={asset.id} asset={asset} variant="editorial" />
      ))}
    </section>
  )
}
