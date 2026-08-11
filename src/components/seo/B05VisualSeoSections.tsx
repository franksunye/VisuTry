import { FaceOwnerVisualSections } from '@/components/seo/FaceOwnerVisualSections'
import type { VisualSeoAssetStage } from '@/config/visual-seo-assets'

export const B05_VISUAL_SEO_PAGES = ['/style/heart-face', '/style/diamond-face', '/style/oblong-face'] as const
export type B05VisualSeoPage = (typeof B05_VISUAL_SEO_PAGES)[number]

type B05VisualSeoSectionsProps = {
  locale: string
  pagePath: B05VisualSeoPage
  stage: VisualSeoAssetStage
}

export function B05VisualSeoSections({ locale, pagePath, stage }: B05VisualSeoSectionsProps) {
  return <FaceOwnerVisualSections locale={locale} pagePath={pagePath} batch="B05" stage={stage} />
}
