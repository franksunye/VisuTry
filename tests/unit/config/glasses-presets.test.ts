import { existsSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { CANONICAL_FACE_SHAPES } from '@/config/face-analysis'
import {
  getTopPickPresetById,
  getTopPickPresetForStyle,
  STYLE_EXPLORER_GLASSES_PRESETS,
  TOP_PICK_GLASSES_PRESETS,
} from '@/config/glasses-presets'
import {
  buildAvoidRecommendations,
  buildFrameRecommendations,
} from '@/lib/face-analysis-report'

describe('glasses presets', () => {
  it('contains 16 high-fidelity preset assets', () => {
    expect(TOP_PICK_GLASSES_PRESETS).toHaveLength(16)

    for (const preset of TOP_PICK_GLASSES_PRESETS) {
      expect(preset.assetPath).toMatch(/\.jpg$/)
      expect(existsSync(join(process.cwd(), 'public', preset.assetPath))).toBe(true)
    }
  })

  it('maps every current report frame recommendation to a preset', () => {
    const styles = CANONICAL_FACE_SHAPES.flatMap((shape) => [
      ...buildFrameRecommendations(shape),
      ...buildAvoidRecommendations(shape),
    ])

    for (const style of styles) {
      const preset = getTopPickPresetForStyle(style.displayName)
      expect(getTopPickPresetById(preset.id)).toBeTruthy()
      expect(existsSync(join(process.cwd(), 'public', preset.assetPath))).toBe(true)
    }
  })

  it('contains 16 optimized Style Explorer JPEG presets with balanced categories', () => {
    expect(STYLE_EXPLORER_GLASSES_PRESETS).toHaveLength(16)
    expect(STYLE_EXPLORER_GLASSES_PRESETS.filter((preset) => preset.category === 'optical')).toHaveLength(8)
    expect(STYLE_EXPLORER_GLASSES_PRESETS.filter((preset) => preset.category === 'sunglasses')).toHaveLength(8)

    for (const preset of STYLE_EXPLORER_GLASSES_PRESETS) {
      expect(preset.assetPath).toMatch(/style-explorer\/.+\.jpg$/)
      expect(preset.isStyleExplorerEnabled).toBe(true)
      expect(getTopPickPresetById(preset.id)).toEqual(preset)
      const assetPath = join(process.cwd(), 'public', preset.assetPath)
      expect(existsSync(assetPath)).toBe(true)
      expect(statSync(assetPath).size).toBeLessThan(120 * 1024)
    }
  })
})
