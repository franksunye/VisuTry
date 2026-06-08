import { CanonicalFaceShape } from '@/config/face-analysis'

export interface FaceAnalysisAiResult {
  faceShape: CanonicalFaceShape
  confidence: number
  summary: string
  keyFeatures: string[]
  bestFrames: string[]
  framesToAvoid: string[]
  styleGuide: string
}

export interface FaceAnalysisBasicResult {
  faceShape: CanonicalFaceShape
  faceShapeDisplayName: string
  confidence: number
  summary: string
  keyFeatures: string[]
}

export interface FaceAnalysisFullResult extends FaceAnalysisBasicResult {
  bestFrames: string[]
  framesToAvoid: string[]
  styleGuide: string
  catalogRecommendedStyles?: string[]
  catalogAvoidStyles?: string[]
}

export interface FaceAnalysisLockedTeaser {
  bestFrames: string[]
  framesToAvoid: string[]
  catalogRecommendedStyles?: string[]
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
