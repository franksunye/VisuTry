import { getCombinationVisualSeoAssets } from '@/config/combination-visual-seo-assets'
import { getVisualSeoAssetsForPage } from '@/config/visual-seo-assets'

export const EYEBROW_FIT_IMAGE_PATH = '/images/seo/decisions/glasses-eyebrow-position-guide.svg'

/** Match actual editorial renders; never attach untranslated figures to locale pages. */
export function getEditorialImagePaths(pagePath: string, locale: string): string[] {
  if (locale === 'ar' && pagePath === '/find-glasses-for-my-face') {
    return ['/images/seo/core/glasses-frame-a-vs-b.webp']
  }
  if (locale === 'ja' && pagePath === '/find-glasses-for-my-face') {
    return ['/images/seo/decisions/glasses-frame-shapes-comparison.webp']
  }
  if (locale !== 'en') return []

  const paths = [
    ...getVisualSeoAssetsForPage(pagePath).map((asset) => asset.publicPath),
    ...getCombinationVisualSeoAssets(pagePath).map((asset) => asset.publicPath),
  ]
  if (pagePath === '/glasses-guide/should-glasses-cover-your-eyebrows') {
    paths.push(EYEBROW_FIT_IMAGE_PATH)
  }
  if (pagePath === '/blog/ai-face-analysis-for-glasses-guide') {
    paths.push('/images/seo/core/glasses-frame-a-vs-b.webp')
  }
  return [...new Set(paths)]
}
