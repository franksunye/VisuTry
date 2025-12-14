/**
 * External Try-On API - Poll/Status Endpoint
 * 
 * GET /api/v1/external/try-on/[taskId]
 * 
 * Authentication: X-API-Key header
 * 
 * Response:
 *   {
 *     success: boolean,
 *     data: {
 *       taskId: string,
 *       status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED",
 *       resultImageUrl?: string,
 *       progress?: number,
 *       error?: string
 *     }
 *   }
 */

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getRequestContext, logger } from "@/lib/logger"
import { validateApiKey, getApiKeyFromRequest } from "@/lib/api-key"
import { getTryOnResult } from "@/lib/tryon-service"

export const dynamic = 'force-dynamic'

interface RouteParams {
    params: Promise<{
        taskId: string
    }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
    const ctx = getRequestContext(request)
    const { taskId } = await params

    try {
        // 1. API Key Authentication
        const apiKey = getApiKeyFromRequest(request)
        const authResult = await validateApiKey(apiKey)

        if (!authResult.valid || !authResult.userId) {
            return NextResponse.json(
                { success: false, error: authResult.error || "Unauthorized" },
                { status: 401 }
            )
        }

        const userId = authResult.userId

        // 2. Validate taskId
        if (!taskId) {
            return NextResponse.json(
                { success: false, error: "Task ID is required" },
                { status: 400 }
            )
        }

        // 3. Verify Task Ownership
        const task = await prisma.tryOnTask.findUnique({
            where: { id: taskId },
            select: { userId: true }
        })

        if (!task) {
            return NextResponse.json(
                { success: false, error: "Task not found" },
                { status: 404 }
            )
        }

        // Important: External API can only access tasks created by the same API key's user
        if (task.userId !== userId) {
            logger.warn('api', 'External API attempted to access another user task', {
                requestUserId: userId,
                taskUserId: task.userId,
                taskId
            }, ctx)
            return NextResponse.json(
                { success: false, error: "Task not found" }, // Don't reveal existence
                { status: 404 }
            )
        }

        // 4. Get/Poll Result (this also triggers GRSAI polling if needed)
        const result = await getTryOnResult(taskId)

        // 5. Response
        return NextResponse.json({
            success: true,
            data: {
                taskId,
                status: result.status,
                resultImageUrl: result.resultImageUrl,
                progress: result.progress,
                error: result.error
            }
        })

    } catch (error) {
        logger.error('api', 'External try-on poll error', error as Error, { taskId }, ctx)

        return NextResponse.json(
            { success: false, error: error instanceof Error ? error.message : "Internal server error" },
            { status: 500 }
        )
    }
}
