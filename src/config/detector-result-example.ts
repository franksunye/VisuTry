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
    'This example suggests an oval face shape, a starting point for exploring glasses styles.',
} as const
