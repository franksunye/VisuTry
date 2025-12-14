/**
 * API Key Authentication Utility
 * 
 * For MVP, API keys are stored in environment variable.
 * Format: EXTERNAL_API_KEYS="sk_live_abc123:userId1,sk_live_def456:userId2"
 * 
 * In production, this should be migrated to database storage.
 */

import { prisma } from "@/lib/prisma"
import { logger } from "@/lib/logger"

export interface ApiKeyValidationResult {
    valid: boolean
    userId?: string
    error?: string
}

/**
 * Validate an API key from the X-API-Key header
 * Returns the associated userId if valid
 */
export async function validateApiKey(apiKey: string | null): Promise<ApiKeyValidationResult> {
    if (!apiKey) {
        return { valid: false, error: "API key is required" }
    }

    // Check format
    if (!apiKey.startsWith("sk_")) {
        return { valid: false, error: "Invalid API key format" }
    }

    // Parse environment variable
    const apiKeysEnv = process.env.EXTERNAL_API_KEYS || ""

    if (!apiKeysEnv) {
        logger.warn('api', 'EXTERNAL_API_KEYS environment variable not configured')
        return { valid: false, error: "API key authentication not configured" }
    }

    // Format: "sk_xxx:userId1,sk_yyy:userId2"
    const keyMappings = apiKeysEnv.split(",").map(entry => {
        const [key, userId] = entry.trim().split(":")
        return { key, userId }
    })

    const match = keyMappings.find(m => m.key === apiKey)

    if (!match || !match.userId) {
        logger.warn('api', 'Invalid API key attempt', { keyPrefix: apiKey.substring(0, 10) })
        return { valid: false, error: "Invalid API key" }
    }

    // Verify the userId exists in database
    const user = await prisma.user.findUnique({
        where: { id: match.userId },
        select: { id: true, email: true, isPremium: true }
    })

    if (!user) {
        logger.error('api', 'API key references non-existent user', undefined, { userId: match.userId })
        return { valid: false, error: "API key configuration error" }
    }

    logger.info('api', 'API key validated successfully', { userId: user.id })
    return { valid: true, userId: user.id }
}

/**
 * Extract API key from request headers
 */
export function getApiKeyFromRequest(request: Request): string | null {
    return request.headers.get("X-API-Key") || request.headers.get("x-api-key")
}

/**
 * Generate a new API key (for future use)
 * Format: sk_live_<random32chars>
 */
export function generateApiKey(): string {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
    let result = "sk_live_"
    for (let i = 0; i < 32; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
}
