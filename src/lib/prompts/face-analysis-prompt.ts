import { CANONICAL_FACE_SHAPES } from '@/config/face-analysis'
import { FaceGeometryAnalysis } from '@/types/face-analysis'

export function buildFaceAnalysisPrompt(geometry?: FaceGeometryAnalysis | null): string {
  const shapes = CANONICAL_FACE_SHAPES.join(', ')
  const measuredContext = geometry?.status === 'measured' && geometry.ratios
    ? `
Measured landmark signals are available from an on-device face landmarker. Use them as supporting geometry evidence, but still visually verify the photo:
- measuredShape: ${geometry.measuredShape ?? 'unknown'}
- measuredConfidence: ${geometry.measuredConfidence ?? 'unknown'}
- qualityScore: ${geometry.qualityScore}/100
- faceAspectRatio: ${geometry.ratios.faceAspectRatio}
- cheekToFaceWidth: ${geometry.ratios.cheekToFaceWidth}
- jawToCheekWidth: ${geometry.ratios.jawToCheekWidth}
- foreheadToCheekWidth: ${geometry.ratios.foreheadToCheekWidth}
- eyeLineTiltDeg: ${geometry.ratios.eyeLineTiltDeg}
- symmetryOffset: ${geometry.ratios.symmetryOffset}
- signals: ${geometry.signals.join('; ')}
- warnings: ${geometry.warnings.join('; ') || 'none'}
`
    : `
No reliable landmark measurements are available. Analyze visually and keep confidence conservative.
`

  return `You are a professional eyewear stylist and facial geometry analyst.

Analyze the face in the uploaded photo and respond with ONLY valid JSON (no markdown, no code fences).
${measuredContext}

Requirements:
- faceShape must be exactly one of: ${shapes}
- confidence is a number between 0 and 1
- keyFeatures: 3-5 short bullet strings describing visible facial structure
- bestFrames: 3-5 frame style recommendations (e.g. round, cat-eye, browline, aviator, oversized)
- framesToAvoid: 2-4 frame styles to avoid for this face shape
- styleGuide: 2-3 sentences of personalized styling advice
- strengths: 3 short strings describing positive facial structure signals for eyewear styling
- styleRecommendations: 3 short, practical eyewear styling tips
- If measured landmark signals are available, keyFeatures and strengths should reference the measured proportions in plain language.
- Do not estimate age, gender, attractiveness, ethnicity, emotion, wealth, or profession.
- Do not claim medical or biometric certainty.

JSON schema:
{
  "faceShape": "square",
  "confidence": 0.92,
  "summary": "One sentence overview of the face shape",
  "keyFeatures": ["Strong jawline", "Balanced forehead width"],
  "bestFrames": ["round frames", "oval frames"],
  "framesToAvoid": ["square frames", "geometric frames"],
  "styleGuide": "Personalized advice paragraph.",
  "strengths": ["Defined jawline", "Balanced upper and lower face"],
  "styleRecommendations": ["Choose rounder frames to soften angles"]
}`
}
