import { CanonicalFaceShape } from '@/config/face-analysis'
import {
  FaceAnalysisMetric,
  FaceGeometryAnalysis,
  FrameRecommendation,
  StyleTip,
  TryOnGuidance,
} from '@/types/face-analysis'
import { buildMeasuredFaceMetrics } from '@/lib/face-landmark-metrics'

type ShapeReportProfile = {
  metrics: Omit<FaceAnalysisMetric, 'score'>[]
  recommended: Array<Omit<FrameRecommendation, 'score'> & { score: number }>
  avoid: Array<Omit<FrameRecommendation, 'score'> & { score: number }>
  strengths: string[]
  styleTips: StyleTip[]
}

const REPORT_DISCLAIMER =
  'AI-estimated style guidance based on the uploaded photo. Results are not medical or biometric measurements.'

const profiles: Record<CanonicalFaceShape, ShapeReportProfile> = {
  round: {
    metrics: [
      metric('faceShape', 'Face Shape', 'Round', 'Soft curves', 'Face length and width appear close, with softer facial angles.'),
      metric('faceLength', 'Face Length', 'Short to Medium', 'Compact', 'The face reads slightly shorter relative to width.'),
      metric('faceWidth', 'Face Width', 'Wide', 'Full cheeks', 'Cheek and face width are visually prominent.'),
      metric('jawline', 'Jawline', 'Soft', 'Rounded', 'The lower face has less angular definition.'),
      metric('cheekbones', 'Cheekbones', 'Moderate', 'Balanced', 'Cheekbones are visible without dominating the face.'),
      metric('symmetry', 'Symmetry', 'Balanced', 'Stable', 'Left and right facial structure appears visually balanced.'),
    ],
    recommended: [
      frame('rectangle', 'Rectangle', 94, 'Adds structure and length.', 'Choose medium-width rectangular frames with clean corners.'),
      frame('browline', 'Browline', 91, 'Defines the upper face.', 'A stronger brow helps sharpen soft facial curves.'),
      frame('wayfarer', 'Wayfarer', 88, 'Adds gentle angles.', 'Works well when the frame is not too oversized.'),
      frame('geometric', 'Geometric', 84, 'Creates contrast.', 'Use subtle geometric shapes for definition without harshness.'),
    ],
    avoid: [
      frame('round', 'Small Round', 30, 'Can repeat facial roundness.', 'Round-on-round styling may reduce definition.'),
      frame('oversized', 'Oversized Round', 34, 'Can overwhelm soft features.', 'Large circular frames may make the face look wider.'),
      frame('rimless', 'Very Thin Rimless', 42, 'May not add enough structure.', 'A little frame presence is usually more flattering.'),
    ],
    strengths: ['Soft, approachable proportions', 'Balanced cheek area', 'Flexible casual styling range'],
    styleTips: [
      tip('Add definition', 'Use frames with visible corners to create more facial structure.'),
      tip('Keep the fit medium', 'Frames that are too small can make cheeks feel wider.'),
      tip('Use contrast carefully', 'Darker top rims can add shape without looking heavy.'),
    ],
  },
  square: {
    metrics: [
      metric('faceShape', 'Face Shape', 'Square', 'Angular', 'A strong jawline and balanced width create a square facial structure.'),
      metric('faceLength', 'Face Length', 'Medium', 'Balanced', 'Face length appears proportional to the overall width.'),
      metric('faceWidth', 'Face Width', 'Wide', 'Defined', 'Forehead and jaw width appear similar and visually strong.'),
      metric('jawline', 'Jawline', 'Strong', 'Distinct', 'The lower face has strong angular definition.'),
      metric('cheekbones', 'Cheekbones', 'Moderate', 'Prominent', 'Cheekbones support the angular structure without overpowering it.'),
      metric('symmetry', 'Symmetry', 'High', 'Balanced', 'Overall facial balance appears high in the uploaded photo.'),
    ],
    recommended: [
      frame('round', 'Round', 94, 'Softens angles and adds balance.', 'Choose round frames with enough width to match your jawline.'),
      frame('aviator', 'Aviator', 91, 'Adds curves with confident structure.', 'Aviators contrast the jaw without looking too delicate.'),
      frame('browline', 'Browline', 88, 'Highlights the upper face.', 'Browline frames draw attention upward and balance strong lower features.'),
      frame('wayfarer', 'Wayfarer', 85, 'Keeps structure but softens edges.', 'Pick slightly rounded wayfarers instead of boxy versions.'),
    ],
    avoid: [
      frame('narrow-rectangle', 'Narrow Rectangle', 28, 'May exaggerate facial width.', 'Narrow frames can make the jaw look broader.'),
      frame('small-square', 'Small Square', 31, 'Repeats too many angles.', 'Small square frames can make the face feel boxier.'),
      frame('geometric-sharp', 'Geometric Sharp', 34, 'May create too many hard lines.', 'Sharp frames compete with angular features.'),
    ],
    strengths: ['Strong, defined jawline', 'Balanced forehead and jaw width', 'Confident angular profile'],
    styleTips: [
      tip('Balance is key', 'Choose frames that add curve and soften your stronger angles.'),
      tip('Go medium to large', 'Medium or larger frames usually suit your face proportions best.'),
      tip('Mind the bridge', 'A keyhole or lower bridge fit can soften the nose structure.'),
    ],
  },
  oval: {
    metrics: [
      metric('faceShape', 'Face Shape', 'Oval', 'Balanced', 'The face appears longer than wide with balanced proportions.'),
      metric('faceLength', 'Face Length', 'Medium to Long', 'Vertical', 'Length is slightly more prominent than width.'),
      metric('faceWidth', 'Face Width', 'Balanced', 'Even', 'Width appears balanced across forehead, cheeks, and jaw.'),
      metric('jawline', 'Jawline', 'Moderate', 'Soft taper', 'The lower face tapers naturally without heavy angles.'),
      metric('cheekbones', 'Cheekbones', 'Moderate', 'Balanced', 'Cheekbones support a flexible frame range.'),
      metric('symmetry', 'Symmetry', 'High', 'Balanced', 'Overall facial structure appears visually even.'),
    ],
    recommended: [
      frame('browline', 'Browline', 93, 'Adds character while preserving balance.', 'A great choice when you want definition.'),
      frame('aviator', 'Aviator', 90, 'Works with natural proportions.', 'Aviators suit oval faces when bridge fit is right.'),
      frame('rectangle', 'Rectangle', 88, 'Adds clean structure.', 'Medium rectangles create a sharp everyday look.'),
      frame('round', 'Round', 84, 'Softens the look.', 'Round frames work well if they are not too small.'),
    ],
    avoid: [
      frame('oversized-heavy', 'Very Oversized', 38, 'Can hide balanced proportions.', 'Avoid frames that dominate your face.'),
      frame('too-narrow', 'Too Narrow', 42, 'Can make the face look longer.', 'Choose frames close to face width.'),
    ],
    strengths: ['Naturally balanced proportions', 'Wide frame style flexibility', 'Easy to dress up or down'],
    styleTips: [
      tip('Use your flexibility', 'Try both rounded and angular styles before deciding.'),
      tip('Watch frame scale', 'The main risk is frames that are too narrow or too large.'),
      tip('Match your style signal', 'Oval faces can choose frames more by personality than correction.'),
    ],
  },
  heart: {
    metrics: [
      metric('faceShape', 'Face Shape', 'Heart', 'Top-weighted', 'The upper face appears wider with a narrower chin.'),
      metric('faceLength', 'Face Length', 'Medium', 'Balanced', 'Length is balanced relative to facial width.'),
      metric('faceWidth', 'Face Width', 'Upper Wide', 'Forehead focus', 'Forehead width is visually more prominent.'),
      metric('jawline', 'Jawline', 'Soft', 'Tapered', 'The jaw narrows toward the chin.'),
      metric('cheekbones', 'Cheekbones', 'Prominent', 'Lifted', 'Cheekbones help define the middle face.'),
      metric('symmetry', 'Symmetry', 'Balanced', 'Stable', 'Overall structure appears visually balanced.'),
    ],
    recommended: [
      frame('cat-eye', 'Cat-Eye', 93, 'Complements cheekbones and lift.', 'Choose softer cat-eye shapes rather than heavy top rims.'),
      frame('oval', 'Oval', 90, 'Balances a narrower chin.', 'Oval frames soften the upper-to-lower face transition.'),
      frame('rimless', 'Light Rimless', 86, 'Keeps the upper face light.', 'Subtle frames avoid adding extra forehead weight.'),
      frame('bottom-heavy', 'Bottom-Weighted', 84, 'Adds balance near the chin.', 'A little lower-frame presence can even the proportions.'),
    ],
    avoid: [
      frame('top-heavy', 'Heavy Browline', 32, 'Can overemphasize forehead width.', 'Avoid thick top rims if they feel dominant.'),
      frame('oversized-square', 'Oversized Square', 36, 'May crowd the upper face.', 'Large angular frames can feel heavy.'),
    ],
    strengths: ['Defined upper face', 'Naturally lifted cheek area', 'Elegant tapered jawline'],
    styleTips: [
      tip('Keep the top light', 'Avoid frames that add too much visual weight near the forehead.'),
      tip('Use gentle lift', 'Soft cat-eye lines can enhance your natural cheekbone structure.'),
      tip('Balance the chin', 'Frames with subtle lower detail can create harmony.'),
    ],
  },
  diamond: {
    metrics: [
      metric('faceShape', 'Face Shape', 'Diamond', 'Cheekbone-led', 'Cheekbones appear wider than forehead and chin.'),
      metric('faceLength', 'Face Length', 'Medium', 'Balanced', 'Face length is visually balanced.'),
      metric('faceWidth', 'Face Width', 'Cheekbone Wide', 'Middle focus', 'The widest point appears around the cheekbones.'),
      metric('jawline', 'Jawline', 'Moderate', 'Tapered', 'Jaw narrows gently toward the chin.'),
      metric('cheekbones', 'Cheekbones', 'Prominent', 'Distinct', 'Cheekbones are a strong visual feature.'),
      metric('symmetry', 'Symmetry', 'Balanced', 'Stable', 'Overall structure appears visually balanced.'),
    ],
    recommended: [
      frame('oval', 'Oval', 93, 'Softens cheekbone width.', 'Oval frames keep the look balanced and refined.'),
      frame('cat-eye', 'Cat-Eye', 90, 'Adds lift without crowding.', 'A gentle upsweep flatters prominent cheekbones.'),
      frame('browline', 'Browline', 87, 'Balances the upper face.', 'Browline styles add presence near the forehead.'),
      frame('rimless', 'Rimless', 82, 'Keeps features open.', 'Light frames avoid adding bulk at the cheekbones.'),
    ],
    avoid: [
      frame('narrow', 'Narrow Frames', 30, 'Can exaggerate cheekbone width.', 'Narrow frames may pinch the center face visually.'),
      frame('small-geometric', 'Small Geometric', 35, 'Can compete with angles.', 'Small sharp shapes may feel too busy.'),
    ],
    strengths: ['Distinct cheekbone structure', 'Elegant facial angles', 'Strong fashion-forward potential'],
    styleTips: [
      tip('Open the eye area', 'Choose frames that do not sit too low on the cheeks.'),
      tip('Add upper balance', 'Browline or soft cat-eye frames can balance cheekbone width.'),
      tip('Avoid pinching', 'Frames should be close to cheekbone width, not much narrower.'),
    ],
  },
  oblong: {
    metrics: [
      metric('faceShape', 'Face Shape', 'Oblong', 'Longer', 'Face length appears noticeably greater than width.'),
      metric('faceLength', 'Face Length', 'Long', 'Vertical', 'Vertical proportion is the dominant visual signal.'),
      metric('faceWidth', 'Face Width', 'Narrow to Balanced', 'Slim', 'Width appears more restrained than length.'),
      metric('jawline', 'Jawline', 'Moderate', 'Structured', 'Jawline is visible without strong width.'),
      metric('cheekbones', 'Cheekbones', 'Moderate', 'Balanced', 'Cheekbones are supportive but not dominant.'),
      metric('symmetry', 'Symmetry', 'Balanced', 'Stable', 'Overall structure appears visually balanced.'),
    ],
    recommended: [
      frame('oversized', 'Oversized', 92, 'Adds width and presence.', 'Taller frames help balance a longer face.'),
      frame('wayfarer', 'Wayfarer', 89, 'Creates horizontal structure.', 'Wayfarers add width without looking too formal.'),
      frame('browline', 'Browline', 86, 'Breaks up vertical length.', 'A strong top line creates visual balance.'),
      frame('round-large', 'Large Round', 82, 'Softens length.', 'Rounder frames work best when not too small.'),
    ],
    avoid: [
      frame('small-narrow', 'Small Narrow', 28, 'Can lengthen the face visually.', 'Tiny frames leave too much vertical space.'),
      frame('thin-rectangle', 'Thin Rectangle', 33, 'Adds little vertical balance.', 'Very shallow frames can make the face look longer.'),
    ],
    strengths: ['Elegant vertical proportions', 'Good fit for statement frames', 'Strong editorial styling potential'],
    styleTips: [
      tip('Add frame height', 'Choose frames with enough depth to balance facial length.'),
      tip('Use horizontal detail', 'Browlines or thicker temples can create width.'),
      tip('Avoid tiny frames', 'Small frames often make long faces feel longer.'),
    ],
  },
  triangle: {
    metrics: [
      metric('faceShape', 'Face Shape', 'Triangle', 'Jaw-led', 'The lower face appears wider than the upper face.'),
      metric('faceLength', 'Face Length', 'Medium', 'Balanced', 'Face length appears proportional.'),
      metric('faceWidth', 'Face Width', 'Lower Wide', 'Jaw focus', 'Jaw width is the strongest width signal.'),
      metric('jawline', 'Jawline', 'Strong', 'Broad', 'The jawline has strong visual presence.'),
      metric('cheekbones', 'Cheekbones', 'Moderate', 'Balanced', 'Cheekbones are visible but not the widest point.'),
      metric('symmetry', 'Symmetry', 'Balanced', 'Stable', 'Overall structure appears visually balanced.'),
    ],
    recommended: [
      frame('browline', 'Browline', 94, 'Adds balance to the upper face.', 'A stronger top rim offsets jaw width.'),
      frame('cat-eye', 'Cat-Eye', 90, 'Lifts attention upward.', 'A gentle upsweep balances lower-face strength.'),
      frame('top-heavy', 'Top-Accent', 87, 'Creates upper-face presence.', 'Top detail helps distribute visual weight.'),
      frame('aviator', 'Aviator', 83, 'Adds width near the eyes.', 'Aviators can balance the jaw when sized well.'),
    ],
    avoid: [
      frame('bottom-heavy', 'Bottom-Heavy', 29, 'Can emphasize jaw width.', 'Avoid frames that add weight low on the face.'),
      frame('small-round', 'Small Round', 37, 'May not balance lower width.', 'Small frames can make the jaw look stronger.'),
    ],
    strengths: ['Strong lower-face definition', 'Confident jaw structure', 'Works well with upper-accent frames'],
    styleTips: [
      tip('Draw attention upward', 'Use browline, cat-eye, or top-accent frames.'),
      tip('Keep lower rims light', 'Avoid heavy lower rims that amplify jaw width.'),
      tip('Match frame width carefully', 'Frames should balance the jaw without being oversized.'),
    ],
  },
}

function metric(
  id: FaceAnalysisMetric['id'],
  label: string,
  value: string,
  caption: string,
  detail: string
): Omit<FaceAnalysisMetric, 'score'> {
  return { id, label, value, caption, detail }
}

function frame(
  type: string,
  displayName: string,
  score: number,
  reason: string,
  stylingNote: string
): FrameRecommendation {
  return { type, displayName, score, reason, stylingNote }
}

function tip(title: string, body: string): StyleTip {
  return { title, body }
}

function metricScore(baseConfidence: number, index: number): number {
  const base = Math.round(baseConfidence * 100)
  return Math.min(96, Math.max(68, base - index * 2 + 4))
}

export function buildFaceMetrics(
  shape: CanonicalFaceShape,
  confidence: number,
  geometry?: FaceGeometryAnalysis | null
): FaceAnalysisMetric[] {
  const measured = buildMeasuredFaceMetrics(shape, confidence, geometry)
  if (measured) return measured

  return profiles[shape].metrics.map((item, index) => ({
    ...item,
    score: metricScore(confidence, index),
    source: 'ai-template',
  }))
}

export function buildFrameRecommendations(shape: CanonicalFaceShape): FrameRecommendation[] {
  return profiles[shape].recommended
}

export function buildAvoidRecommendations(shape: CanonicalFaceShape): FrameRecommendation[] {
  return profiles[shape].avoid
}

export function buildReportStrengths(shape: CanonicalFaceShape, aiStrengths?: string[]): string[] {
  const strengths = aiStrengths?.filter(Boolean).slice(0, 3) ?? []
  return strengths.length >= 3 ? strengths : profiles[shape].strengths
}

export function buildStyleTips(shape: CanonicalFaceShape, aiTips?: string[]): StyleTip[] {
  const normalized = aiTips?.filter(Boolean).slice(0, 3).map((body, index) => (
    tip(['Frame balance', 'Fit direction', 'Style signal'][index] ?? 'Style tip', body)
  )) ?? []
  return normalized.length >= 3 ? normalized : profiles[shape].styleTips
}

export function buildTryOnGuidance(shape: CanonicalFaceShape): TryOnGuidance {
  const topStyles = profiles[shape].recommended.slice(0, 4).map((item) => item.displayName)
  return {
    topStyles,
    note: 'Preview the top frame directions with AI try-on before deciding what to buy.',
    cta: 'Try top picks on your photo',
  }
}

export function getReportDisclaimer(): string {
  return REPORT_DISCLAIMER
}
