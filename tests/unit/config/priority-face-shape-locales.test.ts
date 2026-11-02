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

  it('keeps the English free Detector search promise consistent with the real product', () => {
    const copy = getFaceShapeSeoCopy('en').detector
    expect(copy.metaTitle).toContain('Face Shape Detector Online')
    expect(copy.title).toContain('Face Shape Detector Online')
    expect(copy.metaDescription).toContain('free in your browser')
    expect(copy.metaDescription).toContain('No sign-up')
    expect(copy.intro).toContain('glasses styles')
    expect(copy.faq.find((faq) => faq.question.includes('free'))?.answer).toContain('no account or credits')
    expect(copy.faq.find((faq) => faq.question.includes('uploaded'))?.answer).toContain('browser memory')
  })

  it('matches existing JA camera and ES photo search demand without changing paid report boundaries', () => {
    const ja = getFaceShapeSeoCopy('ja').detector
    const es = getFaceShapeSeoCopy('es').detector
    expect(ja.metaTitle).toContain('顔の形診断')
    expect(ja.metaTitle).toContain('カメラ')
    expect(ja.intro).toContain('サーバーに送信せず')
    expect(es.metaTitle).toContain('forma')
    expect(es.metaDescription).toContain('sin registro')
    expect(es.intro).toContain('navegador')
    expect(ja.faq.some(({ answer }) => answer.includes('クレジット'))).toBe(true)
    expect(es.faq.some(({ answer }) => answer.includes('gratuito'))).toBe(true)
  })

  it('preserves canonical route-level locale metadata', () => {
    const es = getFaceShapeSeoCopy('es')
    const ja = getFaceShapeSeoCopy('ja')
    expect(es.detector.metaTitle).toContain('Detector')
    expect(ja.detector.metaTitle).toContain('顔')
  })
})
