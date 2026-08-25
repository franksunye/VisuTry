import Image from 'next/image'
import { VisualSeoAsset as VisualSeoAssetView } from '@/components/seo/VisualSeoAsset'
import { getCombinationVisualSeoAssets, type CombinationVisualSeoStage } from '@/config/combination-visual-seo-assets'
import type { CombinationSearchPage } from '@/config/search-combination-pages'
import type { VisualSeoAsset } from '@/config/visual-seo-assets'

type CombinationVisualSeoProps = {
  locale: string
  page: CombinationSearchPage
}

function getStageCopy(page: CombinationSearchPage, stage: CombinationVisualSeoStage) {
  switch (stage) {
    case 'hero':
      return { heading: page.title, body: page.primaryAnswer }
    case 'why':
      return { heading: `Why ${page.title.replace(/^Best /, '').replace(/\?$/, '')} can work`, body: page.whyItWorks }
    case 'fit':
      return { heading: 'What proportions to watch for', body: page.watchFor }
    case 'compare':
      return { heading: 'Compare the visual effect before choosing', body: page.decisionTip }
  }
}

function toVisualSeoAsset(
  page: CombinationSearchPage,
  item: ReturnType<typeof getCombinationVisualSeoAssets>[number],
): VisualSeoAsset {
  const copy = getStageCopy(page, item.stage)
  return {
    id: item.id,
    // B07-B09 use the established VisualSeoAsset renderer while their batch
    // registry remains isolated from the earlier owner-page batches.
    batch: item.batch as VisualSeoAsset['batch'],
    sourcePath: item.sourcePath,
    publicPath: item.publicPath,
    pagePath: `/glasses-guide/${page.slug}`,
    width: item.width,
    height: item.height,
    displayWidth: item.stage === 'compare' ? 'compare' : item.stage === 'hero' ? 'primary' : 'secondary',
    bodyPosition: 'before',
    stage: item.stage === 'fit' ? 'fit' : item.stage === 'compare' ? 'compare' : 'hero',
    priority: item.stage === 'hero',
    heading: copy.heading,
    alt: `${page.title} visual guide: ${copy.heading.toLowerCase()}`,
    body: copy.body,
  }
}

export function CombinationVisualSeoHero({ locale, page }: CombinationVisualSeoProps) {
  if (locale !== 'en') return null

  const item = getCombinationVisualSeoAssets(page.slug).find((asset) => asset.stage === 'hero')
  if (!item) return null

  return (
    <figure className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
      <Image
        src={item.publicPath}
        alt={`${page.title} visual recommendation`}
        width={item.width}
        height={item.height}
        priority
        sizes="(max-width: 1023px) 100vw, 560px"
        className="h-auto w-full"
      />
    </figure>
  )
}

export function CombinationVisualSeoSections({ locale, page }: CombinationVisualSeoProps) {
  if (locale !== 'en') return null

  const assets = getCombinationVisualSeoAssets(page.slug)
    .filter((item) => item.stage !== 'hero')
    .map((item) => toVisualSeoAsset(page, item))

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
