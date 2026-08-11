import { FaceOwnerVisualSections } from '@/components/seo/FaceOwnerVisualSections'
import type { VisualSeoAssetStage } from '@/config/visual-seo-assets'

export const B04_VISUAL_SEO_PAGES = ['/style/round-face', '/style/oval-face', '/style/square-face'] as const
export type B04VisualSeoPage = (typeof B04_VISUAL_SEO_PAGES)[number]

type B04VisualSeoSectionsProps = {
  locale: string
  pagePath: B04VisualSeoPage
  stage: VisualSeoAssetStage
}

export function B04VisualSeoSections({ locale, pagePath, stage }: B04VisualSeoSectionsProps) {
  return <FaceOwnerVisualSections locale={locale} pagePath={pagePath} batch="B04" stage={stage} />
}
