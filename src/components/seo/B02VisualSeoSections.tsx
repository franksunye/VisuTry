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

/**
 * Render B02 with the same acquisition-page hierarchy as B01:
 * one dominant visual per page, with additional assets demoted to supporting education.
 * B02 masters carry prominent in-image headlines, so primary/editorial HTML headings stay
 * semantic but visually hidden. Supporting-card headings remain visible.
 */
export function B02VisualSeoSections({ locale, pagePath }: B02VisualSeoSectionsProps) {
  if (locale !== 'en') return null

  const assets = getVisualSeoAssetsForPage(pagePath, 'B02')
  if (assets.length === 0) return null

  // This page already has its dominant B01 visual. B02-009 is additional workflow education,
  // so it must remain visually subordinate rather than becoming a second full-width hero.
  if (pagePath === '/what-glasses-suit-my-face') {
    return (
      <section className="mt-5 space-y-5 sm:mt-6 sm:space-y-6" aria-label="Additional visual glasses guides">
        {assets.map((asset) => (
          <VisualSeoAsset key={asset.id} asset={asset} variant="supporting-wide" />
        ))}
      </section>
    )
  }

  const [primaryAsset, ...supportingAssets] = assets

  return (
    <section className="mt-14 space-y-5 sm:space-y-6" aria-label="Visual glasses guides">
      <VisualSeoAsset asset={primaryAsset} variant="editorial" headingDisplay="sr-only" />
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
