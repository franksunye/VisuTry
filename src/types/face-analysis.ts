import { CanonicalFaceShape } from '@/config/face-analysis'

export interface FaceAnalysisAiResult {
  faceShape: CanonicalFaceShape
  confidence: number
  summary: string
  keyFeatures: string[]
  bestFrames: string[]
  framesToAvoid: string[]
  styleGuide: string
  strengths?: string[]
  styleRecommendations?: string[]
}

export interface FaceAnalysisBasicResult {
  faceShape: CanonicalFaceShape
  faceShapeDisplayName: string
  confidence: number
  summary: string
  keyFeatures: string[]
  geometry?: FaceGeometryAnalysis
}

export interface FaceAnalysisFullResult extends FaceAnalysisBasicResult {
  bestFrames: string[]
  framesToAvoid: string[]
  styleGuide: string
  catalogRecommendedStyles?: string[]
  catalogAvoidStyles?: string[]
  reportVersion?: 'v2'
  overview?: FaceAnalysisOverview
  metrics?: FaceAnalysisMetric[]
  frameRecommendations?: FrameRecommendation[]
  avoidRecommendations?: FrameRecommendation[]
  styleTips?: StyleTip[]
  tryOnGuidance?: TryOnGuidance
  geometry?: FaceGeometryAnalysis
}

export interface FaceAnalysisLockedTeaser {
  bestFrames: string[]
  framesToAvoid: string[]
  catalogRecommendedStyles?: string[]
}

export interface FaceAnalysisOverview {
  summary: string
  strengths: string[]
  disclaimer: string
}

export interface FaceAnalysisMetric {
  id: 'faceShape' | 'faceLength' | 'faceWidth' | 'jawline' | 'cheekbones' | 'symmetry'
  label: string
  value: string
  score: number
  caption: string
  detail: string
  source?: 'landmark' | 'ai-template'
}

export interface FaceLandmarkPoint {
  x: number
  y: number
  z?: number
}

export interface FaceGeometryRatios {
  faceAspectRatio: number
  cheekToFaceWidth: number
  jawToCheekWidth: number
  foreheadToCheekWidth: number
  eyeLineTiltDeg: number
  symmetryOffset: number
  noseBridgeToFaceWidth: number
}

export interface FaceGeometryAnalysis {
  version: 'landmark-v1'
  status: 'measured' | 'unavailable'
  source: 'mediapipe-face-landmarker' | 'ai-fallback'
  faceDetected: boolean
  faceCount: number
  qualityScore: number
  measuredShape?: CanonicalFaceShape
  measuredConfidence?: number
  ratios?: FaceGeometryRatios
  signals: string[]
  warnings: string[]
}

export interface FrameRecommendation {
  type: string
  displayName: string
  score: number
  reason: string
  stylingNote: string
}

export interface StyleTip {
  title: string
  body: string
}

export interface TryOnGuidance {
  topStyles: string[]
  note: string
  cta: string
}

export interface FaceAnalysisTaskResponse {
  id: string
  status: string
  userImageUrl: string
  detectedShape?: string | null
  confidence?: number | null
  basicResult?: FaceAnalysisBasicResult | null
  fullResult?: FaceAnalysisFullResult | null
  lockedTeaser?: FaceAnalysisLockedTeaser | null
  reportUnlocked: boolean
  errorMessage?: string | null
  createdAt: string
  progress?: number
  isNewCompletion?: boolean
}
