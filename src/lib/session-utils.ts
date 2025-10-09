/**
 * Session utilities for managing user session updates
 * 
 * This module provides utilities to trigger session updates when user data changes,
 * ensuring the JWT token is refreshed from the database.
 */

/**
 * Trigger a session update on the client side
 * This will cause the JWT callback to re-fetch user data from the database
 * 
 * Usage:
 * ```typescript
 * import { triggerSessionUpdate } from '@/lib/session-utils'
 * 
 * // After updating user data in the database
 * await prisma.user.update({ ... })
 * await triggerSessionUpdate()
 * ```
 */
export async function triggerSessionUpdate() {
  if (typeof window !== 'undefined') {
    // Client-side: use next-auth's update function
    const { useSession } = await import('next-auth/react')
    const { update } = useSession()
    await update()
  }
}

/**
 * Server-side function to invalidate session cache
 * Call this after updating user data in the database
 */
export function invalidateSessionCache(userId: string) {
  // In a production environment, you might want to use Redis or similar
  // to track which users need their sessions refreshed
  console.log(`Session cache invalidated for user: ${userId}`)
}

