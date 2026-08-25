import vseo055 from '../../assets/visual-seo/B07/source/VSEO-055__best-rectangle-glasses-for-round-face-01-hero.png'
import vseo056 from '../../assets/visual-seo/B07/source/VSEO-056__best-rectangle-glasses-for-round-face-02-why-it-works.png'
import vseo057 from '../../assets/visual-seo/B07/source/VSEO-057__best-rectangle-glasses-for-round-face-03-watch-for.png'
import vseo058 from '../../assets/visual-seo/B07/source/VSEO-058__best-rectangle-glasses-for-round-face-04-compare.png'
import vseo059 from '../../assets/visual-seo/B07/source/VSEO-059__best-square-glasses-for-round-face-01-hero.png'
import vseo060 from '../../assets/visual-seo/B07/source/VSEO-060__best-square-glasses-for-round-face-02-why-it-works.png'
import vseo061 from '../../assets/visual-seo/B07/source/VSEO-061__best-square-glasses-for-round-face-03-watch-for.png'
import vseo062 from '../../assets/visual-seo/B07/source/VSEO-062__best-square-glasses-for-round-face-04-compare.png'
import vseo063 from '../../assets/visual-seo/B07/source/VSEO-063__best-browline-glasses-for-round-face-01-hero.png'
import vseo064 from '../../assets/visual-seo/B07/source/VSEO-064__best-browline-glasses-for-round-face-02-why-it-works.png'
import vseo065 from '../../assets/visual-seo/B08/source/VSEO-065__best-browline-glasses-for-round-face-03-watch-for.png'
import vseo066 from '../../assets/visual-seo/B08/source/VSEO-066__best-browline-glasses-for-round-face-04-compare.png'
import vseo067 from '../../assets/visual-seo/B08/source/VSEO-067__best-cat-eye-glasses-for-round-face-01-hero.png'
import vseo068 from '../../assets/visual-seo/B08/source/VSEO-068__best-cat-eye-glasses-for-round-face-02-why-it-works.png'
import vseo069 from '../../assets/visual-seo/B08/source/VSEO-069__best-cat-eye-glasses-for-round-face-03-watch-for.png'
import vseo070 from '../../assets/visual-seo/B08/source/VSEO-070__best-cat-eye-glasses-for-round-face-04-compare.png'
import vseo071 from '../../assets/visual-seo/B08/source/VSEO-071__best-geometric-glasses-for-round-face-01-hero.png'
import vseo072 from '../../assets/visual-seo/B08/source/VSEO-072__best-geometric-glasses-for-round-face-02-why-it-works.png'
import vseo073 from '../../assets/visual-seo/B08/source/VSEO-073__best-geometric-glasses-for-round-face-03-watch-for.png'
import vseo074 from '../../assets/visual-seo/B08/source/VSEO-074__best-geometric-glasses-for-round-face-04-compare.png'
import vseo075 from '../../assets/visual-seo/B09/source/VSEO-075__best-cat-eye-glasses-for-oval-face-01-hero.png'
import vseo076 from '../../assets/visual-seo/B09/source/VSEO-076__best-cat-eye-glasses-for-oval-face-02-why-it-works.png'
import vseo077 from '../../assets/visual-seo/B09/source/VSEO-077__best-cat-eye-glasses-for-oval-face-03-watch-for.png'
import vseo078 from '../../assets/visual-seo/B09/source/VSEO-078__best-cat-eye-glasses-for-oval-face-04-compare.png'
import vseo079 from '../../assets/visual-seo/B09/source/VSEO-079__best-aviator-glasses-for-oval-face-01-hero.png'
import vseo080 from '../../assets/visual-seo/B09/source/VSEO-080__best-aviator-glasses-for-oval-face-02-why-it-works.png'
import vseo081 from '../../assets/visual-seo/B09/source/VSEO-081__best-aviator-glasses-for-oval-face-03-watch-for.png'
import vseo082 from '../../assets/visual-seo/B09/source/VSEO-082__best-aviator-glasses-for-oval-face-04-compare.png'
import vseo083 from '../../assets/visual-seo/B09/source/VSEO-083__best-browline-glasses-for-oval-face-01-hero.png'
import vseo084 from '../../assets/visual-seo/B09/source/VSEO-084__best-browline-glasses-for-oval-face-02-why-it-works.png'

export type CombinationVisualSeoStage = 'hero' | 'why' | 'fit' | 'compare'

type CombinationVisualSeoAsset = {
  id: `VSEO-${string}`
  batch: 'B07' | 'B08' | 'B09'
  pageSlug: string
  stage: CombinationVisualSeoStage
  sourcePath: string
  publicPath: string
  width: number
  height: number
}

const asset = (
  id: CombinationVisualSeoAsset['id'],
  batch: CombinationVisualSeoAsset['batch'],
  pageSlug: string,
  stage: CombinationVisualSeoStage,
  sourcePath: string,
  publicPath: string,
  width: number,
  height: number,
): CombinationVisualSeoAsset => ({ id, batch, pageSlug, stage, sourcePath, publicPath, width, height })

export const COMBINATION_VISUAL_SEO_ASSETS = [
  asset('VSEO-055', 'B07', 'best-rectangle-glasses-for-round-face', 'hero', 'assets/visual-seo/B07/source/VSEO-055__best-rectangle-glasses-for-round-face-01-hero.png', vseo055.src, vseo055.width, vseo055.height),
  asset('VSEO-056', 'B07', 'best-rectangle-glasses-for-round-face', 'why', 'assets/visual-seo/B07/source/VSEO-056__best-rectangle-glasses-for-round-face-02-why-it-works.png', vseo056.src, vseo056.width, vseo056.height),
  asset('VSEO-057', 'B07', 'best-rectangle-glasses-for-round-face', 'fit', 'assets/visual-seo/B07/source/VSEO-057__best-rectangle-glasses-for-round-face-03-watch-for.png', vseo057.src, vseo057.width, vseo057.height),
  asset('VSEO-058', 'B07', 'best-rectangle-glasses-for-round-face', 'compare', 'assets/visual-seo/B07/source/VSEO-058__best-rectangle-glasses-for-round-face-04-compare.png', vseo058.src, vseo058.width, vseo058.height),
  asset('VSEO-059', 'B07', 'best-square-glasses-for-round-face', 'hero', 'assets/visual-seo/B07/source/VSEO-059__best-square-glasses-for-round-face-01-hero.png', vseo059.src, vseo059.width, vseo059.height),
  asset('VSEO-060', 'B07', 'best-square-glasses-for-round-face', 'why', 'assets/visual-seo/B07/source/VSEO-060__best-square-glasses-for-round-face-02-why-it-works.png', vseo060.src, vseo060.width, vseo060.height),
  asset('VSEO-061', 'B07', 'best-square-glasses-for-round-face', 'fit', 'assets/visual-seo/B07/source/VSEO-061__best-square-glasses-for-round-face-03-watch-for.png', vseo061.src, vseo061.width, vseo061.height),
  asset('VSEO-062', 'B07', 'best-square-glasses-for-round-face', 'compare', 'assets/visual-seo/B07/source/VSEO-062__best-square-glasses-for-round-face-04-compare.png', vseo062.src, vseo062.width, vseo062.height),
  asset('VSEO-063', 'B07', 'best-browline-glasses-for-round-face', 'hero', 'assets/visual-seo/B07/source/VSEO-063__best-browline-glasses-for-round-face-01-hero.png', vseo063.src, vseo063.width, vseo063.height),
  asset('VSEO-064', 'B07', 'best-browline-glasses-for-round-face', 'why', 'assets/visual-seo/B07/source/VSEO-064__best-browline-glasses-for-round-face-02-why-it-works.png', vseo064.src, vseo064.width, vseo064.height),
  asset('VSEO-065', 'B08', 'best-browline-glasses-for-round-face', 'fit', 'assets/visual-seo/B08/source/VSEO-065__best-browline-glasses-for-round-face-03-watch-for.png', vseo065.src, vseo065.width, vseo065.height),
  asset('VSEO-066', 'B08', 'best-browline-glasses-for-round-face', 'compare', 'assets/visual-seo/B08/source/VSEO-066__best-browline-glasses-for-round-face-04-compare.png', vseo066.src, vseo066.width, vseo066.height),
  asset('VSEO-067', 'B08', 'best-cat-eye-glasses-for-round-face', 'hero', 'assets/visual-seo/B08/source/VSEO-067__best-cat-eye-glasses-for-round-face-01-hero.png', vseo067.src, vseo067.width, vseo067.height),
  asset('VSEO-068', 'B08', 'best-cat-eye-glasses-for-round-face', 'why', 'assets/visual-seo/B08/source/VSEO-068__best-cat-eye-glasses-for-round-face-02-why-it-works.png', vseo068.src, vseo068.width, vseo068.height),
  asset('VSEO-069', 'B08', 'best-cat-eye-glasses-for-round-face', 'fit', 'assets/visual-seo/B08/source/VSEO-069__best-cat-eye-glasses-for-round-face-03-watch-for.png', vseo069.src, vseo069.width, vseo069.height),
  asset('VSEO-070', 'B08', 'best-cat-eye-glasses-for-round-face', 'compare', 'assets/visual-seo/B08/source/VSEO-070__best-cat-eye-glasses-for-round-face-04-compare.png', vseo070.src, vseo070.width, vseo070.height),
  asset('VSEO-071', 'B08', 'best-geometric-glasses-for-round-face', 'hero', 'assets/visual-seo/B08/source/VSEO-071__best-geometric-glasses-for-round-face-01-hero.png', vseo071.src, vseo071.width, vseo071.height),
  asset('VSEO-072', 'B08', 'best-geometric-glasses-for-round-face', 'why', 'assets/visual-seo/B08/source/VSEO-072__best-geometric-glasses-for-round-face-02-why-it-works.png', vseo072.src, vseo072.width, vseo072.height),
  asset('VSEO-073', 'B08', 'best-geometric-glasses-for-round-face', 'fit', 'assets/visual-seo/B08/source/VSEO-073__best-geometric-glasses-for-round-face-03-watch-for.png', vseo073.src, vseo073.width, vseo073.height),
  asset('VSEO-074', 'B08', 'best-geometric-glasses-for-round-face', 'compare', 'assets/visual-seo/B08/source/VSEO-074__best-geometric-glasses-for-round-face-04-compare.png', vseo074.src, vseo074.width, vseo074.height),
  asset('VSEO-075', 'B09', 'best-cat-eye-glasses-for-oval-face', 'hero', 'assets/visual-seo/B09/source/VSEO-075__best-cat-eye-glasses-for-oval-face-01-hero.png', vseo075.src, vseo075.width, vseo075.height),
  asset('VSEO-076', 'B09', 'best-cat-eye-glasses-for-oval-face', 'why', 'assets/visual-seo/B09/source/VSEO-076__best-cat-eye-glasses-for-oval-face-02-why-it-works.png', vseo076.src, vseo076.width, vseo076.height),
  asset('VSEO-077', 'B09', 'best-cat-eye-glasses-for-oval-face', 'fit', 'assets/visual-seo/B09/source/VSEO-077__best-cat-eye-glasses-for-oval-face-03-watch-for.png', vseo077.src, vseo077.width, vseo077.height),
  asset('VSEO-078', 'B09', 'best-cat-eye-glasses-for-oval-face', 'compare', 'assets/visual-seo/B09/source/VSEO-078__best-cat-eye-glasses-for-oval-face-04-compare.png', vseo078.src, vseo078.width, vseo078.height),
  asset('VSEO-079', 'B09', 'best-aviator-glasses-for-oval-face', 'hero', 'assets/visual-seo/B09/source/VSEO-079__best-aviator-glasses-for-oval-face-01-hero.png', vseo079.src, vseo079.width, vseo079.height),
  asset('VSEO-080', 'B09', 'best-aviator-glasses-for-oval-face', 'why', 'assets/visual-seo/B09/source/VSEO-080__best-aviator-glasses-for-oval-face-02-why-it-works.png', vseo080.src, vseo080.width, vseo080.height),
  asset('VSEO-081', 'B09', 'best-aviator-glasses-for-oval-face', 'fit', 'assets/visual-seo/B09/source/VSEO-081__best-aviator-glasses-for-oval-face-03-watch-for.png', vseo081.src, vseo081.width, vseo081.height),
  asset('VSEO-082', 'B09', 'best-aviator-glasses-for-oval-face', 'compare', 'assets/visual-seo/B09/source/VSEO-082__best-aviator-glasses-for-oval-face-04-compare.png', vseo082.src, vseo082.width, vseo082.height),
  asset('VSEO-083', 'B09', 'best-browline-glasses-for-oval-face', 'hero', 'assets/visual-seo/B09/source/VSEO-083__best-browline-glasses-for-oval-face-01-hero.png', vseo083.src, vseo083.width, vseo083.height),
  asset('VSEO-084', 'B09', 'best-browline-glasses-for-oval-face', 'why', 'assets/visual-seo/B09/source/VSEO-084__best-browline-glasses-for-oval-face-02-why-it-works.png', vseo084.src, vseo084.width, vseo084.height),
] as const

export function getCombinationVisualSeoAssets(pageSlug: string) {
  return COMBINATION_VISUAL_SEO_ASSETS.filter((item) => item.pageSlug === pageSlug)
}
