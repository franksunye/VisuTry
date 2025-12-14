/**
 * External Try-On API - Submit Endpoint
 * 
 * POST /api/v1/external/try-on
 * 
 * Authentication: X-API-Key header
 * Content-Type: multipart/form-data
 * 
 * Request Body:
 *   - userImage: File (required)
 *   - itemImage: File (required)
 *   - type: string (optional, default: "GLASSES")
 *   - callbackUrl: string (optional, for future webhook support)
 * 
 * Response:
 *   {
 *     success: boolean,
 *     data: {
 *       taskId: string,
 *       status: "submitted" | "completed",
 *       serviceType: "grsai" | "gemini",
 *       isAsync: boolean,
 *       resultImageUrl?: string
 *     }
 *   }
 */

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getRequestContext, logger } from "@/lib/logger"
import { validateApiKey, getApiKeyFromRequest } from "@/lib/api-key"
import { submitTryOnTask } from "@/lib/tryon-service"
import { TryOnType, isValidTryOnType } from "@/config/try-on-types"

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function POST(request: NextRequest) {
    const ctx = getRequestContext(request)
    const startTime = Date.now()

    try {
        // 1. API Key Authentication
        const apiKey = getApiKeyFromRequest(request)
        const authResult = await validateApiKey(apiKey)

        if (!authResult.valid || !authResult.userId) {
            logger.warn('api', 'External API auth failed', { error: authResult.error }, ctx)
            return NextResponse.json(
                { success: false, error: authResult.error || "Unauthorized" },
                { status: 401 }
            )
        }

        const userId = authResult.userId
        logger.info('api', 'External API request authenticated', { userId }, ctx)

        // 2. Get User for Service Tiering
        const user = await prisma.user.findUnique({
            where: { id: userId }
        })

        if (!user) {
            return NextResponse.json(
                { success: false, error: "User not found" },
                { status: 404 }
            )
        }

        // 3. Parse Request Data
        let formData: FormData
        try {
            formData = await request.formData()
        } catch (e) {
            return NextResponse.json(
                { success: false, error: "Invalid form data. Expected multipart/form-data." },
                { status: 400 }
            )
        }

        const userImageFile = formData.get("userImage") as File
        const itemImageFile = formData.get("itemImage") as File || formData.get("glassesImage") as File
        const tryOnTypeParam = formData.get("type") as string || "GLASSES"
        const callbackUrl = formData.get("callbackUrl") as string || undefined

        // 4. Validate Inputs
        if (!userImageFile) {
            return NextResponse.json(
                { success: false, error: "userImage is required" },
                { status: 400 }
            )
        }

        if (!itemImageFile) {
            return NextResponse.json(
                { success: false, error: "itemImage is required" },
                { status: 400 }
            )
        }

        const tryOnType = tryOnTypeParam.toUpperCase() as TryOnType
        if (!isValidTryOnType(tryOnType)) {
            return NextResponse.json(
                { success: false, error: `Invalid try-on type: ${tryOnTypeParam}. Valid types: GLASSES, WATCH, etc.` },
                { status: 400 }
            )
        }

        // 5. Image Size Validation
        const MAX_IMAGE_SIZE = 5 * 1024 * 1024 // 5MB for API (more lenient than web)

        if (userImageFile.size > MAX_IMAGE_SIZE) {
            return NextResponse.json(
                { success: false, error: `userImage too large. Maximum size is 5MB.` },
                { status: 400 }
            )
        }

        if (itemImageFile.size > MAX_IMAGE_SIZE) {
            return NextResponse.json(
                { success: false, error: `itemImage too large. Maximum size is 5MB.` },
                { status: 400 }
            )
        }

        // 6. Submit Task (Reuse existing service)
        logger.info('api', 'Submitting external try-on task', { userId, tryOnType }, ctx)

        const result = await submitTryOnTask(
            user,
            userImageFile,
            itemImageFile,
            tryOnType
        )

        // 7. Store callback URL in metadata if provided (for future webhook support)
        if (callbackUrl && result.taskId) {
            await prisma.tryOnTask.update({
                where: { id: result.taskId },
                data: {
                    metadata: {
                        // @ts-ignore - metadata is JSON type
                        ...(await prisma.tryOnTask.findUnique({ where: { id: result.taskId }, select: { metadata: true } }))?.metadata,
                        callbackUrl,
                        source: 'external_api'
                    }
                }
            })
        }

        const duration = Date.now() - startTime
        logger.info('api', 'External try-on task submitted', {
            taskId: result.taskId,
            status: result.status,
            serviceType: result.serviceType,
            duration
        }, ctx)

        // 8. Response
        return NextResponse.json({
            success: true,
            data: {
                taskId: result.taskId,
                status: result.status,
                serviceType: result.serviceType,
                isAsync: result.isAsync,
                resultImageUrl: result.resultImageUrl,
                // Additional info for external clients
                pollUrl: `/api/v1/external/try-on/${result.taskId}`,
                estimatedWaitTime: result.isAsync ? "10-30 seconds" : undefined
            }
        })

    } catch (error) {
        const duration = Date.now() - startTime
        logger.error('api', 'External try-on submit error', error as Error, { duration }, ctx)

        return NextResponse.json(
            { success: false, error: error instanceof Error ? error.message : "Internal server error" },
            { status: 500 }
        )
    }
}
