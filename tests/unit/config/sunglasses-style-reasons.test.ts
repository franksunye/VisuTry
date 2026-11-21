import { SUNGLASSES_FACE_SHAPE_GUIDES } from '@/config/sunglasses-face-shape-content'
import { getSunglassesStyleReason } from '@/config/sunglasses-style-reasons'

describe('sunglasses card explanations', () => {
  test.each(['en', 'ja', 'es'])('%s has a distinct reason for every displayed frame', (locale) => {
    for (const guide of Object.values(SUNGLASSES_FACE_SHAPE_GUIDES)) {
      const reasons = guide.bestStyles.map((style) => getSunglassesStyleReason(locale, guide.faceShape, style))
      expect(reasons.every(Boolean)).toBe(true)
      expect(new Set(reasons).size).toBe(guide.bestStyles.length)
      if (locale !== 'en') {
        expect(reasons.every((reason, index) => reason !== guide.bestStyles[index].why)).toBe(true)
      }
    }
  })

  test('other locales retain their existing localized fallback', () => {
    for (const locale of ['id', 'ar', 'ru', 'de', 'pt', 'fr']) {
      for (const guide of Object.values(SUNGLASSES_FACE_SHAPE_GUIDES)) {
        for (const style of guide.bestStyles) {
          expect(getSunglassesStyleReason(locale, guide.faceShape, style)).toBeUndefined()
        }
      }
    }
  })
})
