/**
 * Recorded from the actual browser Detector pipeline on 2026-11-21 using the
 * approved VisuTry synthetic shopper. This is example data, never a fallback
 * for a visitor's analysis. Provenance and reproduction evidence are kept in
 * docs/operations/evidence/2026-11-21-detector-result-example.md.
 */
export const DETECTOR_RESULT_EXAMPLE = {
  measuredShape: 'oval',
  ratios: {
    faceAspectRatio: 1.233,
    foreheadToCheekWidth: 0.774,
    jawToCheekWidth: 0.853,
  },
  explanation:
    'In this photo, the face is a little longer than it is wide, and the jaw is narrower than the cheekbones. The detector considers the proportions together and estimates an oval shape. A different photo or pose can change the estimate.',
} as const
