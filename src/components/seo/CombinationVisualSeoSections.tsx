import Image from 'next/image'
import { VisualSeoAsset as VisualSeoAssetView } from '@/components/seo/VisualSeoAsset'
import { getCombinationVisualSeoAssets } from '@/config/combination-visual-seo-assets'
import type { CombinationSearchPage } from '@/config/search-combination-pages'

type CombinationVisualSeoProps = {
  locale: string
  page: CombinationSearchPage
}

function pagePath(page: CombinationSearchPage) {
  return `/glasses-guide/${page.slug}`
}

export function CombinationVisualSeoHero({ locale, page }: CombinationVisualSeoProps) {
  if (locale !== 'en') return null

  const item = getCombinationVisualSeoAssets(pagePath(page)).find((asset) => asset.role === 'hero')
  if (!item) return null

  return (
    <figure className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
      <Image
        src={item.publicPath}
        alt={item.alt}
        width={item.width}
        height={item.height}
        priority={item.priority}
        sizes="(max-width: 1023px) 100vw, 560px"
        className="h-auto w-full"
      />
    </figure>
  )
}

export function CombinationVisualSeoSections({ locale, page }: CombinationVisualSeoProps) {
  if (locale !== 'en') return null

  const assets = getCombinationVisualSeoAssets(pagePath(page)).filter((item) => item.role !== 'hero')
  if (assets.length === 0) return null

  return (
    <div className="mt-12 space-y-12 sm:mt-14 sm:space-y-14" aria-label={`${page.title} visual guides`}>
      {assets.map((asset) => (
        <section key={asset.id}>
          <VisualSeoAssetView asset={asset} variant="editorial" />
        </section>
      ))}
    </div>
  )
}
