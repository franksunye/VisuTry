import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { CANONICAL_FACE_SHAPES } from '@/config/face-analysis'
import {
  getTopPickPresetById,
  getTopPickPresetForStyle,
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
})
