import type { GlassesPreset } from '@/config/glasses-presets'
import type { StyleExplorerSelectionInput } from './types'

export function scorePreset(
  preset: GlassesPreset,
  input: StyleExplorerSelectionInput,
) {
  const style = preset.styleTags.includes(input.styleIntent) ? 40 : 0
  const occasion = input.occasion && preset.occasionTags.includes(input.occasion) ? 20 : 0
  const category = input.category === 'all' || input.category === preset.category ? 0 : Number.NEGATIVE_INFINITY
  const faceShape = input.faceShape && preset.suitableFaceShapes?.includes(input.faceShape) ? 15 : 0
  const novelty = preset.collection === 'style-explorer' ? 5 : 0

  return {
    style,
    occasion,
    category,
    faceShape,
    novelty,
    total: style + occasion + category + faceShape + novelty,
  }
}

export function scoreDiversity(preset: GlassesPreset, selected: GlassesPreset[]) {
  if (selected.length === 0) return 0

  let score = 0
  const sameShapeCount = selected.filter((item) => item.shape === preset.shape).length
  if (sameShapeCount >= 2) return Number.NEGATIVE_INFINITY
  if (sameShapeCount === 1) score -= 18
  if (selected.some((item) => item.material === preset.material)) score -= 5
  else score += 5
  if (selected.some((item) => item.visualWeight === preset.visualWeight)) score -= 4
  else score += 5
  if (selected.filter((item) => item.colorFamily === preset.colorFamily).length >= 2) score -= 12

  return score
}
