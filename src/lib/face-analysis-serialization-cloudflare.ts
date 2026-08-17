import { buildLockedTeaser } from './face-analysis-parser'
import type { FaceAnalysisFullResult, FaceAnalysisTaskResponse } from '@/types/face-analysis'

export function serializeFaceAnalysisTask(task: {
  id: string
  status: string
  userImageUrl: string
  detectedShape: string | null
  confidence: number | null
  basicResult: unknown
  fullResult: unknown
  reportUnlocked: boolean
  errorMessage: string | null
  createdAt: Date
}, options?: { isNewCompletion?: boolean }): FaceAnalysisTaskResponse {
  const fullResult = task.fullResult as FaceAnalysisFullResult | null
  const isCompleted = task.status === 'COMPLETED'
  const lockedTeaser = isCompleted && !task.reportUnlocked && fullResult ? buildLockedTeaser(fullResult) : null

  return {
    id: task.id,
    status: task.status.toLowerCase(),
    userImageUrl: task.reportUnlocked ? `/api/face-analysis/${encodeURIComponent(task.id)}/photo` : '',
    detectedShape: task.detectedShape,
    confidence: task.confidence,
    basicResult: task.basicResult as FaceAnalysisTaskResponse['basicResult'],
    fullResult: task.reportUnlocked ? fullResult : null,
    lockedTeaser,
    reportUnlocked: task.reportUnlocked,
    errorMessage: task.errorMessage,
    createdAt: task.createdAt.toISOString(),
    progress: isCompleted ? 100 : 0,
    isNewCompletion: options?.isNewCompletion,
  }
}
