import {
  STYLE_EXPLORER_GLASSES_PRESETS,
  type GlassesPreset,
} from '@/config/glasses-presets'
import { scoreDiversity, scorePreset } from './scoring'
import type {
  StyleExplorerSelectionInput,
  StyleLookCandidate,
} from './types'

function byScoreThenId(
  a: { preset: GlassesPreset; score: number },
  b: { preset: GlassesPreset; score: number },
) {
  return b.score - a.score || a.preset.id.localeCompare(b.preset.id)
}

export function selectStyleExplorerFrames(
  input: StyleExplorerSelectionInput,
  catalog: GlassesPreset[] = STYLE_EXPLORER_GLASSES_PRESETS,
): StyleLookCandidate[] {
  const limit = Math.max(1, Math.min(4, Math.floor(input.limit)))
  const exclusionSet = new Set(input.exclusionIds ?? [])
  const pinnedSet = new Set(input.pinnedPresetIds ?? [])
  let eligible = catalog.filter((preset) => (
    preset.isStyleExplorerEnabled &&
    (input.category === 'all' || preset.category === input.category)
  ))

  const withoutExcluded = eligible.filter((preset) => !exclusionSet.has(preset.id) || pinnedSet.has(preset.id))
  if (withoutExcluded.length >= limit) eligible = withoutExcluded

  const selected: GlassesPreset[] = []
  const result: StyleLookCandidate[] = []

  const addPreset = (preset: GlassesPreset) => {
    if (selected.some((item) => item.id === preset.id) || result.length >= limit) return
    const base = scorePreset(preset, input)
    const diversity = scoreDiversity(preset, selected)
    selected.push(preset)
    result.push({
      presetId: preset.id,
      lookKey: `${input.styleIntent}-${preset.id}`,
      score: base.total + diversity,
      scoreBreakdown: {
        style: base.style,
        occasion: base.occasion,
        category: base.category,
        faceShape: base.faceShape,
        diversity: base.novelty + diversity,
      },
    })
  }

  for (const id of input.pinnedPresetIds ?? []) {
    const preset = eligible.find((item) => item.id === id)
    if (preset) addPreset(preset)
  }

  // An "all" recommendation should demonstrate the breadth of the feature.
  if (input.category === 'all' && result.length < limit) {
    for (const category of ['optical', 'sunglasses'] as const) {
      if (selected.some((item) => item.category === category)) continue
      const best = eligible
        .filter((preset) => preset.category === category && !selected.some((item) => item.id === preset.id))
        .map((preset) => ({
          preset,
          score: scorePreset(preset, input).total + scoreDiversity(preset, selected),
        }))
        .sort(byScoreThenId)[0]
      if (best) addPreset(best.preset)
    }
  }

  while (result.length < limit) {
    const best = eligible
      .filter((preset) => !selected.some((item) => item.id === preset.id))
      .map((preset) => ({
        preset,
        score: scorePreset(preset, input).total + scoreDiversity(preset, selected),
      }))
      .filter((item) => Number.isFinite(item.score))
      .sort(byScoreThenId)[0]
    if (!best) break
    addPreset(best.preset)
  }

  return result
}
