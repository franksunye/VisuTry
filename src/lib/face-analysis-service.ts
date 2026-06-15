import { put } from '@vercel/blob'
import { Prisma, TaskStatus, User } from '@prisma/client'
import { calculateExpiresAt } from '@/config/retention'
import { FACE_ANALYSIS_MODEL } from '@/config/face-analysis'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { buildFaceAnalysisPrompt } from '@/lib/prompts/face-analysis-prompt'
import { analyzeFaceWithGrsAi } from '@/lib/grsai-face-analysis'
import { normalizeGeometryAnalysis } from '@/lib/face-landmark-metrics'
import {
  buildBasicResult,
  buildFullResult,
  buildLockedTeaser,
  parseFaceAnalysisContent,
} from '@/lib/face-analysis-parser'
import {
  FaceAnalysisBasicResult,
  FaceAnalysisFullResult,
  FaceGeometryAnalysis,
  FaceAnalysisTaskResponse,
} from '@/types/face-analysis'

export interface FaceAnalysisSubmitResult {
  taskId: string
  status: 'completed' | 'failed'
  serviceType: string
  basicResult?: FaceAnalysisBasicResult
  fullResult?: FaceAnalysisFullResult
  reportUnlocked?: boolean
  error?: string
}

export function serializeFaceAnalysisTask(
  task: {
    id: string
    status: TaskStatus
    userImageUrl: string
    detectedShape: string | null
    confidence: number | null
    basicResult: unknown
    fullResult: unknown
    reportUnlocked: boolean
    errorMessage: string | null
    createdAt: Date
  },
  options?: { isNewCompletion?: boolean }
): FaceAnalysisTaskResponse {
  const fullResult = task.fullResult as FaceAnalysisFullResult | null
  const isCompleted = task.status === TaskStatus.COMPLETED
  const lockedTeaser =
    isCompleted && !task.reportUnlocked && fullResult
      ? buildLockedTeaser(fullResult)
      : null

  return {
    id: task.id,
    status: task.status.toLowerCase(),
    userImageUrl: task.userImageUrl,
    detectedShape: task.detectedShape,
    confidence: task.confidence,
    basicResult: task.basicResult as FaceAnalysisBasicResult | null,
    fullResult: task.reportUnlocked ? fullResult : null,
    lockedTeaser,
    reportUnlocked: task.reportUnlocked,
    errorMessage: task.errorMessage,
    createdAt: task.createdAt.toISOString(),
    progress: isCompleted ? 100 : 0,
    isNewCompletion: options?.isNewCompletion,
  }
}

export async function submitFaceAnalysis(
  user: User,
  userImageFile: File,
  options?: {
    clientSubmissionId?: string
    reportUnlocked?: boolean
    geometry?: FaceGeometryAnalysis | null
  }
): Promise<FaceAnalysisSubmitResult> {
  const startTime = Date.now()
  const geometry = normalizeGeometryAnalysis(options?.geometry)
  const createMetadata = toJsonSafe({
    serviceType: 'grsai-face-chat',
    model: FACE_ANALYSIS_MODEL,
    clientSubmissionId: options?.clientSubmissionId,
    originalFileName: userImageFile.name,
    geometry,
  }) as Prisma.InputJsonValue
  const prompt = buildFaceAnalysisPrompt(geometry)

  const blob = await put(
    `face-analysis/${user.id}/${Date.now()}-${userImageFile.name}`,
    userImageFile,
    { access: 'public' }
  )

  const task = await prisma.faceAnalysisTask.create({
    data: {
      userId: user.id,
      userImageUrl: blob.url,
      status: TaskStatus.PROCESSING,
      prompt,
      expiresAt: calculateExpiresAt(user),
      metadata: createMetadata,
    },
  })

  try {
    // Inline data URI (same as try-on GrsAi). Blob URL forces GrsAi to fetch Vercel
    // storage and often hangs until the socket closes (~60s+).
    const imageBuffer = Buffer.from(await userImageFile.arrayBuffer())
    const imageMime = userImageFile.type || 'image/jpeg'
    const imageDataUri = `data:${imageMime};base64,${imageBuffer.toString('base64')}`

    const rawContent = await analyzeFaceWithGrsAi(imageDataUri, prompt)
    const aiResult = parseFaceAnalysisContent(rawContent)
    const basicResult = buildBasicResult(aiResult, geometry)
    const fullResult = buildFullResult(aiResult, geometry)
    const basicResultJson = toJsonSafe(basicResult)
    const fullResultJson = toJsonSafe(fullResult)

    const reportUnlocked = options?.reportUnlocked ?? false
    const completionMetadata = toJsonSafe({
      serviceType: 'grsai-face-chat',
      model: FACE_ANALYSIS_MODEL,
      clientSubmissionId: options?.clientSubmissionId,
      completionTimeMs: Date.now() - startTime,
      geometry,
    }) as Prisma.InputJsonValue

    await prisma.faceAnalysisTask.update({
      where: { id: task.id },
      data: {
        status: TaskStatus.COMPLETED,
        detectedShape: aiResult.faceShape,
        confidence: aiResult.confidence,
        basicResult: basicResultJson as unknown as Prisma.InputJsonValue,
        fullResult: fullResultJson as unknown as Prisma.InputJsonValue,
        reportUnlocked,
        metadata: completionMetadata,
      },
    })

    return {
      taskId: task.id,
      status: 'completed',
      serviceType: 'grsai-face-chat',
      basicResult,
      fullResult: reportUnlocked ? fullResult : undefined,
      reportUnlocked,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Analysis failed'
    logger.error('face-analysis-service', 'Analysis failed', error as Error, {
      taskId: task.id,
      userId: user.id,
    })

    await prisma.faceAnalysisTask.update({
      where: { id: task.id },
      data: {
        status: TaskStatus.FAILED,
        errorMessage,
      },
    })

    throw error
  }
}

export async function getFaceAnalysisResult(
  taskId: string
): Promise<FaceAnalysisTaskResponse> {
  const task = await prisma.faceAnalysisTask.findUnique({ where: { id: taskId } })
  if (!task) {
    throw new Error('Task not found')
  }
  return serializeFaceAnalysisTask(task)
}

export async function getFaceAnalysisTaskForUser(
  taskId: string,
  userId: string
): Promise<FaceAnalysisTaskResponse | null> {
  const task = await prisma.faceAnalysisTask.findFirst({
    where: { id: taskId, userId },
  })
  if (!task) return null
  return serializeFaceAnalysisTask(task)
}

export async function unlockFaceAnalysisReport(taskId: string, userId: string): Promise<boolean> {
  const result = await prisma.faceAnalysisTask.updateMany({
    where: { id: taskId, userId },
    data: { reportUnlocked: true },
  })
  return result.count > 0
}

function toJsonSafe<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}
