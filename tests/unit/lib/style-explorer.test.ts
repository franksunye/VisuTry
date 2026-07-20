import { STYLE_EXPLORER_GLASSES_PRESETS } from '@/config/glasses-presets'
import { selectStyleExplorerFrames } from '@/lib/style-explorer/frame-selector'
import { getStyleLookCopy } from '@/lib/style-explorer/look-copy'

describe('Style Explorer selector', () => {
  it.each(['professional', 'minimal', 'classic', 'creative', 'bold', 'vacation'] as const)(
    'returns four deterministic and diverse %s looks',
    (styleIntent) => {
      const input = { styleIntent, occasion: 'weekend' as const, category: 'all' as const, limit: 4 }
      const first = selectStyleExplorerFrames(input)
      const second = selectStyleExplorerFrames(input)

      expect(first).toEqual(second)
      expect(first).toHaveLength(4)
      expect(new Set(first.map((item) => item.presetId)).size).toBe(4)

      const categories = first.map((item) =>
        STYLE_EXPLORER_GLASSES_PRESETS.find((preset) => preset.id === item.presetId)?.category,
      )
      expect(categories).toContain('optical')
      expect(categories).toContain('sunglasses')
    },
  )

  it('filters category and respects exclusions and pins', () => {
    const initial = selectStyleExplorerFrames({
      styleIntent: 'minimal',
      category: 'optical',
      limit: 4,
    })
    const pinned = initial[0].presetId
    const refreshed = selectStyleExplorerFrames({
      styleIntent: 'minimal',
      category: 'optical',
      limit: 4,
      exclusionIds: initial.map((item) => item.presetId),
      pinnedPresetIds: [pinned],
    })

    expect(refreshed[0].presetId).toBe(pinned)
    expect(refreshed.every((item) => item.presetId.startsWith('optical-'))).toBe(true)
    expect(refreshed.slice(1).some((item) => !initial.some((old) => old.presetId === item.presetId))).toBe(true)
  })

  it('creates stable presentation copy', () => {
    const copy = getStyleLookCopy(STYLE_EXPLORER_GLASSES_PRESETS[0], 'classic', 'everyday')
    expect(copy.name).toBe('Everyday Classic')
    expect(copy.summary).toContain('Classic Black Wayfarer')
    expect(copy.tags).toContain('Classic')
  })
})
