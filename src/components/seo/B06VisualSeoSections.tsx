import { getVisualSeoAssetsForPage, type VisualSeoAsset, type VisualSeoAssetStage } from '@/config/visual-seo-assets'
import { VisualSeoAsset as VisualSeoAssetView } from '@/components/seo/VisualSeoAsset'

export const B06_VISUAL_SEO_FACE_SHAPES = ['round', 'oval', 'square', 'heart', 'diamond', 'oblong'] as const
export type B06VisualSeoFaceShape = (typeof B06_VISUAL_SEO_FACE_SHAPES)[number]
export type B06VisualSeoStage = Extract<VisualSeoAssetStage, 'characteristics' | 'identify'>

type B06VisualSeoSectionsProps = {
  locale: string
  faceShape: string
  stage: B06VisualSeoStage
}

function getStageAsset(assets: readonly VisualSeoAsset[], stage: B06VisualSeoStage) {
  const asset = assets.find((item) => item.stage === stage)
  if (!asset) throw new Error(`Missing B06 Visual SEO asset for stage: ${stage}`)
  return asset
}

function getFaceShapeLabel(faceShape: B06VisualSeoFaceShape) {
  return faceShape === 'heart' ? 'heart-shaped' : faceShape
}

function getFaceShapeArticle(faceShape: B06VisualSeoFaceShape) {
  return faceShape === 'oval' || faceShape === 'oblong' ? 'an' : 'a'
}

/**
 * B06 explains what each face shape is and how to recognize it before the
 * existing glasses, hairstyle, and personalized-tool sections begin.
 */
export function B06VisualSeoSections({ locale, faceShape, stage }: B06VisualSeoSectionsProps) {
  if (locale !== 'en') return null
  if (!B06_VISUAL_SEO_FACE_SHAPES.includes(faceShape as B06VisualSeoFaceShape)) return null

  const pagePath = `/face-shapes/${faceShape}`
  const assets = getVisualSeoAssetsForPage(pagePath, 'B06')
  if (assets.length === 0) return null

  const asset = getStageAsset(assets, stage)
  const faceShapeLabel = getFaceShapeLabel(faceShape as B06VisualSeoFaceShape)
  const faceShapeArticle = getFaceShapeArticle(faceShape as B06VisualSeoFaceShape)
  const heading = stage === 'characteristics'
    ? `What defines ${faceShapeArticle} ${faceShapeLabel} face`
    : `How to identify ${faceShapeArticle} ${faceShapeLabel} face`

  return (
    <section className="mt-12 sm:mt-14" aria-label={`${faceShapeLabel} face shape ${stage} guide`}>
      <h2 className="mb-4 text-2xl font-bold tracking-tight text-slate-950 md:text-3xl">{heading}</h2>
      <VisualSeoAssetView asset={asset} variant="editorial" headingDisplay="sr-only" />
    </section>
  )
}
