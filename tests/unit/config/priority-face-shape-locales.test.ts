import { FACE_SHAPE_SLUGS } from '@/config/face-shape-content'
import { getFaceShapeSeoCopy } from '@/config/face-shape-seo-locales'
import { getPriorityDetectorFeedback } from '@/config/priority-detector-feedback'

describe('priority Japanese and Spanish search quality', () => {
  it.each(['ja', 'es'] as const)('%s has distinct frame advice for all seven shapes', (locale) => {
    const copy = getFaceShapeSeoCopy(locale)
    for (const field of ['tryFirst', 'avoidFirst', 'reasons'] as const) {
      const values = FACE_SHAPE_SLUGS.map((shape) => copy.glasses[field][shape])
      expect(new Set(values).size).toBe(7)
    }
    expect(new Set(copy.detector.tips).size).toBe(4)
    expect(new Set(copy.detector.faq.map((item) => item.answer)).size).toBe(copy.detector.faq.length)
    expect(copy.glasses.columns).toHaveLength(4)
  })

  it('keeps localized mobile feedback independent of stable analytics reason strings', () => {
    expect(getPriorityDetectorFeedback('ja').photoTipTitle).toContain('写真')
    expect(getPriorityDetectorFeedback('ja').unsupportedFile).toContain('JPG')
    expect(getPriorityDetectorFeedback('es').photoTipTitle).toContain('Consejos')
    expect(getPriorityDetectorFeedback('es').oversizedFile).toContain('10 MB')
    expect(getPriorityDetectorFeedback('en').photoTipTitle).toBe('For the clearest result')
  })

  it('preserves canonical route-level locale metadata', () => {
    const es = getFaceShapeSeoCopy('es')
    const ja = getFaceShapeSeoCopy('ja')
    expect(es.detector.metaTitle).toContain('Detector')
    expect(ja.detector.metaTitle).toContain('顔')
  })
})
